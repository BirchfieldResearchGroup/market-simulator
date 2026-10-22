import { DurableObject } from 'cloudflare:workers';
import * as v from 'valibot';
import {
	CLOSE_CODE,
	emptyGame,
	type GameState,
	type Period,
	type Role,
	type ServerMessage
} from '../shared/game';
import { ClientMessage, PlayerIdentity, type GameOptions } from '../shared/schema';
import { verifyAdminToken } from './auth';
import {
	admitPlayer,
	advancePeriod,
	kickPlayer,
	newGame,
	rewardPlayer,
	setAutoAdvance,
	startGame,
	submitOffers,
	updateOptions,
	type Admission
} from './engine';
import type { Env } from './env';
import { periodFor, viewFor } from './view';

const IDLE_TTL_MS = 48 * 60 * 60 * 1000;

const REJECTIONS: Record<Exclude<Admission, 'joined' | 'returning'>, string> = {
	closed: 'This game is no longer accepting players.',
	full: 'This game is full.',
	taken: 'That name is already taken by another student.'
};

interface Member {
	role: Role;
	name: string;
}

function send(ws: WebSocket, message: ServerMessage) {
	try {
		ws.send(JSON.stringify(message));
	} catch {}
}

function end(ws: WebSocket, reason: string) {
	send(ws, { type: 'closed', reason });
	try {
		ws.close(CLOSE_CODE, reason);
	} catch {}
}

function parse(raw: string | ArrayBuffer): ClientMessage | null {
	try {
		const result = v.safeParse(ClientMessage, JSON.parse(raw as string));
		return result.success ? result.output : null;
	} catch {
		return null;
	}
}

export class MarketRoom extends DurableObject<Env> {
	private game: GameState = emptyGame();
	private listing = '';

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
		void ctx.blockConcurrencyWhile(async () => {
			this.game = { ...emptyGame(), ...(await ctx.storage.get<GameState>('game')) };
		});
	}

	async create(options: GameOptions): Promise<boolean> {
		if (this.game.state !== 'uninitialized') return false;
		this.game = newGame(options);
		await this.save();
		return true;
	}

	async destroy(): Promise<void> {
		for (const ws of this.ctx.getWebSockets()) end(ws, 'This market was deleted.');
		this.game = emptyGame();
		this.listing = '';
		await this.ctx.storage.deleteAlarm();
		await this.ctx.storage.deleteAll();
		await this.registry.remove(this.name);
	}

	async fetch(request: Request): Promise<Response> {
		const [client, server] = Object.values(new WebSocketPair());
		const admission = await this.admit(new URL(request.url));
		if (typeof admission === 'string') {
			server.accept();
			end(server, admission);
		} else {
			await this.join(server, admission);
		}
		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
		const message = parse(raw);
		if (!message) return;
		const { role, name } = this.member(ws);
		const outcome =
			role === 'admin'
				? this.applyAdmin(message)
				: message.type === 'submitOffers' &&
					submitOffers(this.game, name, message.offers, message.period);
		if (!outcome)
			return send(ws, { type: 'error', message: 'That action is not available right now.' });
		const cleared = typeof outcome === 'object' ? outcome : undefined;
		if (cleared) await this.ctx.storage.put(`period:${cleared.number}`, cleared);
		await this.save(cleared, role === 'participant' ? ws : undefined);
	}

	webSocketClose(): void {
		this.sendClients();
	}

	async alarm(): Promise<void> {
		const { state, auto_advance, advance_time } = this.game;
		if (state === 'running' && auto_advance) {
			if (Date.now() < advance_time) return this.scheduleAlarm();
			const cleared = advancePeriod(this.game);
			if (cleared) await this.ctx.storage.put(`period:${cleared.number}`, cleared);
			return this.save(cleared ?? undefined);
		}
		if (this.ctx.getWebSockets().length > 0) return this.scheduleAlarm();
		await this.destroy();
	}

	private get name() {
		return this.ctx.id.name ?? '';
	}

	private get registry() {
		return this.env.MARKET_REGISTRY.getByName('global');
	}

	private member(ws: WebSocket): Member {
		const [role, name] = this.ctx.getTags(ws);
		return { role: role as Role, name };
	}

	private async admit(url: URL): Promise<(Member & { joined: boolean }) | string> {
		if (this.game.state === 'uninitialized') return 'This market does not exist.';
		const params = Object.fromEntries(url.searchParams);
		if (params.role === 'admin') {
			return (await verifyAdminToken(params.key, this.env.ADMIN_PASSWORD))
				? { role: 'admin', name: 'admin', joined: false }
				: 'Your instructor session expired. Please sign in again.';
		}
		const identity = v.safeParse(PlayerIdentity, params);
		if (!identity.success) return 'Invalid name or UIN.';
		const { name, uin } = identity.output;
		const admission = admitPlayer(this.game, name, uin);
		if (admission !== 'joined' && admission !== 'returning') return REJECTIONS[admission];
		return { role: 'participant', name, joined: admission === 'joined' };
	}

	private async join(ws: WebSocket, { role, name, joined }: Member & { joined: boolean }) {
		for (const other of this.ctx.getWebSockets()) {
			const member = this.member(other);
			if (member.role === role && member.name === name)
				end(other, 'You connected from another tab.');
		}
		this.ctx.acceptWebSocket(ws, [role, name]);
		const stored = await this.ctx.storage.list<Period>({ prefix: 'period:' });
		const periods = [...stored.values()]
			.sort((a, b) => a.number - b.number)
			.map((period) => periodFor(period, this.game, role, name));
		send(ws, { type: 'state', state: this.view(role, name), periods });
		if (joined) await this.save();
		else this.sendClients();
	}

	private applyAdmin(message: ClientMessage): boolean | Period | null {
		const game = this.game;
		switch (message.type) {
			case 'updateOptions':
				return updateOptions(game, message.options);
			case 'setVisibility':
				game.visibility = message.visibility;
				return true;
			case 'startGame':
				return startGame(game);
			case 'advancePeriod':
				return advancePeriod(game);
			case 'setAutoAdvance':
				return setAutoAdvance(game, message.enabled);
			case 'rewardPlayer':
				return rewardPlayer(game, message.player, message.amount);
			case 'kickPlayer':
				if (!kickPlayer(game, message.player)) return false;
				for (const ws of this.ctx.getWebSockets('participant'))
					if (this.member(ws).name === message.player) end(ws, 'You were removed from this game.');
				return true;
			case 'submitOffers':
				return false;
		}
	}

	private clients(): string[] {
		return [...new Set(this.ctx.getWebSockets('participant').map((ws) => this.member(ws).name))];
	}

	private view(role: Role, name: string) {
		const view = viewFor(this.game, role, name);
		return role === 'admin' ? { ...view, clients: this.clients() } : view;
	}

	private sendClients() {
		const message: ServerMessage = { type: 'clients', clients: this.clients() };
		for (const ws of this.ctx.getWebSockets('admin')) send(ws, message);
	}

	private scheduleAlarm() {
		const { state, auto_advance, advance_time } = this.game;
		return this.ctx.storage.setAlarm(
			state === 'running' && auto_advance ? advance_time : Date.now() + IDLE_TTL_MS
		);
	}

	private async save(cleared?: Period, only?: WebSocket) {
		await this.ctx.storage.put('game', this.game);
		await this.scheduleAlarm();
		for (const ws of this.ctx.getWebSockets()) {
			const { role, name } = this.member(ws);
			if (only && role !== 'admin' && ws !== only) continue;
			send(ws, {
				type: 'state',
				state: this.view(role, name),
				cleared: cleared && periodFor(cleared, this.game, role, name)
			});
		}
		await this.publish();
	}

	private async publish() {
		const { state, visibility, players, options } = this.game;
		const listing = {
			name: this.name,
			state,
			visibility,
			playerCount: Object.keys(players).length,
			maxPlayers: options.max_participants,
			playerUins: Object.values(players).map((p) => p.uin)
		};
		const key = JSON.stringify(listing);
		if (key === this.listing) return;
		try {
			await this.registry.put(listing);
			this.listing = key;
		} catch (error) {
			console.error('Registry update failed', error);
		}
	}
}
