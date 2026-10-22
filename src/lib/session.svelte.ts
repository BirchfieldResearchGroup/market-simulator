import { CLOSE_CODE, type ServerMessage } from '../../shared/game';
import type { ClientMessage } from '../../shared/schema';
import { now } from './clock';
import { game } from './game.svelte';

export type Identity =
	{ role: 'admin'; key: string } | { role: 'participant'; name: string; uin: string };

type Status = 'idle' | 'connecting' | 'open' | 'reconnecting';

const STORAGE_KEY = 'msim_session';
const PING_MS = 30_000;
const PONG_TIMEOUT_MS = 5_000;
const STALL_MS = 3_000;
const MAX_FAILED_CONNECTS = 3;

const expired = (identity: Identity | null) =>
	identity?.role === 'admin' && Number(identity.key.split('.')[0]) < Date.now();

class Session {
	identity = $state<Identity | null>(null);
	market = $state<string | null>(null);
	status = $state<Status>('idle');
	error = $state<string | null>(null);
	notice = $state<string | null>(null);
	revision = $state(0);
	#lostAt = $state(0);
	#socket: WebSocket | null = null;
	#opened = false;
	#attempts = 0;
	#retry?: ReturnType<typeof setTimeout>;
	#heartbeat?: ReturnType<typeof setInterval>;
	#pong?: ReturnType<typeof setTimeout>;

	get name() {
		return this.identity?.role === 'participant' ? this.identity.name : 'Instructor';
	}

	get adminKey() {
		return this.identity?.role === 'admin' ? this.identity.key : null;
	}

	get stalled() {
		return this.status === 'reconnecting' && now() - this.#lostAt > STALL_MS;
	}

	restore() {
		try {
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as {
				identity?: Identity;
				market?: string;
			} | null;
			if (saved?.identity && !expired(saved.identity)) this.identity = saved.identity;
			this.market = saved?.market ?? null;
		} catch {}
		const linked = new URLSearchParams(location.search).get('market');
		if (linked) {
			this.market = linked;
			history.replaceState(null, '', location.pathname);
		}
		if (this.identity && this.market) this.join(this.market);
	}

	signIn(identity: Identity) {
		this.identity = identity;
		if (this.market) this.join(this.market);
		else this.#persist();
	}

	join(market: string) {
		this.market = market;
		this.error = null;
		this.status = 'connecting';
		this.#opened = false;
		this.#attempts = 0;
		game.reset();
		this.#persist();
		this.#open();
	}

	leave() {
		this.#stop();
		this.market = null;
		this.error = null;
		this.status = 'idle';
		game.reset();
		this.#persist();
	}

	logout() {
		this.leave();
		this.identity = null;
		this.#persist();
	}

	send(message: ClientMessage): boolean {
		if (this.#socket?.readyState !== WebSocket.OPEN) return false;
		this.#socket.send(JSON.stringify(message));
		return true;
	}

	#persist() {
		try {
			const market = this.error ? null : this.market;
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ identity: this.identity, market }));
		} catch {}
	}

	#stop() {
		clearTimeout(this.#retry);
		clearInterval(this.#heartbeat);
		clearTimeout(this.#pong);
		if (!this.#socket) return;
		this.#socket.onopen = this.#socket.onmessage = this.#socket.onclose = null;
		this.#socket.close();
		this.#socket = null;
	}

	#fail(message: string) {
		this.#stop();
		this.status = 'idle';
		this.error = message;
		this.#persist();
	}

	#open() {
		const { identity, market } = this;
		if (!identity || !market) return;
		this.#stop();
		const params = new URLSearchParams(
			identity.role === 'admin'
				? { market, role: 'admin', key: identity.key }
				: { market, role: 'participant', name: identity.name, uin: identity.uin }
		);
		const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
		const ws = new WebSocket(`${protocol}://${location.host}/api/ws?${params}`);
		this.#socket = ws;

		ws.onopen = () => {
			this.#opened = true;
			this.#attempts = 0;
			this.status = 'open';
			this.#heartbeat = setInterval(() => {
				ws.send('ping');
				this.#pong = setTimeout(() => ws.close(), PONG_TIMEOUT_MS);
			}, PING_MS);
		};

		ws.onmessage = ({ data }: MessageEvent<string>) => {
			if (data === 'pong') return clearTimeout(this.#pong);
			const message = JSON.parse(data) as ServerMessage;
			this.revision++;
			if (message.type === 'state') game.apply(message);
			else if (message.type === 'clients') game.setClients(message.clients);
			else if (message.type === 'closed') this.#fail(message.reason);
			else this.notice = message.message;
		};

		ws.onclose = ({ code, reason }) => {
			clearInterval(this.#heartbeat);
			clearTimeout(this.#pong);
			this.#socket = null;
			if (code === CLOSE_CODE) return this.#fail(reason);
			const attempt = ++this.#attempts;
			if (!this.#opened && attempt >= MAX_FAILED_CONNECTS)
				return this.#fail('Could not connect to this market.');
			if (this.status === 'open') {
				this.status = 'reconnecting';
				this.#lostAt = Date.now();
			}
			const delay = Math.min(1000 * 2 ** (attempt - 1), 30_000) * (0.8 + Math.random() * 0.4);
			this.#retry = setTimeout(() => this.#open(), delay);
		};
	}
}

export const session = new Session();
