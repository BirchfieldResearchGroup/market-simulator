import { DurableObject } from 'cloudflare:workers';
import type { MarketListItem } from '../shared/game';
import type { Env } from './env';

export interface Listing extends Omit<MarketListItem, 'isMember'> {
	playerUins: string[];
}

export class MarketRegistry extends DurableObject<Env> {
	private markets = new Map<string, Listing>();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		void ctx.blockConcurrencyWhile(async () => {
			const stored = await ctx.storage.list<Listing>({ prefix: 'market:' });
			for (const listing of stored.values()) this.markets.set(listing.name, listing);
		});
	}

	list(includeUnlisted: boolean, uin: string | null): MarketListItem[] {
		return [...this.markets.values()]
			.filter((m) => includeUnlisted || m.visibility === 'public')
			.map(({ name, state, visibility, playerCount, maxPlayers, playerUins }) => ({
				name,
				state,
				visibility,
				playerCount,
				maxPlayers,
				isMember: !!uin && playerUins.includes(uin)
			}));
	}

	async put(listing: Listing): Promise<void> {
		this.markets.set(listing.name, listing);
		await this.ctx.storage.put(`market:${listing.name}`, listing);
	}

	async remove(name: string): Promise<void> {
		this.markets.delete(name);
		await this.ctx.storage.delete(`market:${name}`);
	}
}
