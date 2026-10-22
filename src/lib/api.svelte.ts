import type { MarketListItem } from '../../shared/game';
import type { GameOptions } from '../../shared/schema';
import { session } from './session.svelte';

async function request(path: string, init: RequestInit = {}) {
	const key = session.adminKey;
	const response = await fetch(`/api${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...(key && { Authorization: `Bearer ${key}` }) }
	});
	if (response.status === 401 && key) session.logout();
	return response;
}

export async function login(password: string): Promise<string | null> {
	const response = await request('/login', { method: 'POST', body: JSON.stringify({ password }) });
	return response.ok ? ((await response.json()) as { key: string }).key : null;
}

export async function createMarket(name: string, options: GameOptions): Promise<number> {
	const response = await request('/markets', {
		method: 'POST',
		body: JSON.stringify({ name, options })
	});
	return response.status;
}

export async function deleteMarket(name: string): Promise<void> {
	await request(`/markets/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

export function pollMarkets(intervalMs: number) {
	let markets = $state<MarketListItem[]>([]);
	let loaded = $state(false);
	let failed = $state(false);

	async function refresh() {
		const identity = session.identity;
		const query =
			identity?.role === 'participant' ? `?uin=${encodeURIComponent(identity.uin)}` : '';
		try {
			const response = await request(`/markets${query}`);
			if (!response.ok) throw new Error(response.statusText);
			markets = (await response.json()) as MarketListItem[];
			failed = false;
		} catch {
			failed = true;
		}
		loaded = true;
	}

	$effect(() => {
		void refresh();
		const timer = setInterval(() => void refresh(), intervalMs);
		const onVisible = () => {
			if (document.visibilityState === 'visible') void refresh();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});

	return {
		get markets() {
			return markets;
		},
		get loaded() {
			return loaded;
		},
		get failed() {
			return failed;
		},
		refresh
	};
}
