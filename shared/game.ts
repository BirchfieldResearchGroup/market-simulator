import { DEFAULT_OPTIONS, type Visibility } from './config';
import type { GameOptions } from './schema';

export type Role = 'admin' | 'participant';
export type Phase = 'uninitialized' | 'forming' | 'running' | 'completed';

export interface Generator {
	id: string;
	owner: string;
	capacity: number;
	cost: number;
	offer: number;
}

export interface Player {
	uin: string;
	money: number;
	last_offer_time: number;
}

interface PlayerResult {
	revenue: number;
	costs: number;
	profit: number;
	money: number;
}

export interface Period {
	number: number;
	load: number;
	marginal_cost: number;
	players: Partial<Record<string, PlayerResult>>;
	gens: Record<string, { offer: number; mw: number }>;
}

export interface GameState {
	state: Phase;
	visibility: Visibility;
	options: GameOptions;
	players: Record<string, Player>;
	gens: Record<string, Generator>;
	period: number;
	auto_advance: boolean;
	advance_time: number;
	last_advance_time: number;
}

export interface GameView extends GameState {
	load: number | null;
	now: number;
	rank?: number;
	clients?: string[];
}

export interface MarketListItem {
	name: string;
	state: Phase;
	visibility: Visibility;
	playerCount: number;
	maxPlayers: number;
	isMember: boolean;
}

export type ServerMessage =
	| { type: 'state'; state: GameView; periods?: Period[]; cleared?: Period }
	| { type: 'clients'; clients: string[] }
	| { type: 'error'; message: string }
	| { type: 'closed'; reason: string };

export const CLOSE_CODE = 4000;

export function emptyGame(): GameState {
	return {
		state: 'uninitialized',
		visibility: 'public',
		options: { ...DEFAULT_OPTIONS },
		players: {},
		gens: {},
		period: 0,
		auto_advance: false,
		advance_time: 0,
		last_advance_time: 0
	};
}

export function standings(players: Record<string, Player>): [string, Player][] {
	return Object.entries(players).sort(([a, x], [b, y]) => y.money - x.money || a.localeCompare(b));
}

export function hasSubmitted(player: Player | undefined, game: GameState): boolean {
	return !!player && player.last_offer_time > game.last_advance_time;
}
