import { GEN_PRESETS, LOAD_PROFILES } from '../shared/config';
import { emptyGame, type GameState, type Period } from '../shared/game';
import type { GameOptions } from '../shared/schema';

type Random = () => number;

const round2 = (x: number) => Math.round(x * 100) / 100;

export type Admission = 'joined' | 'returning' | 'closed' | 'full' | 'taken';

export function newGame(options: GameOptions): GameState {
	return { ...emptyGame(), state: 'forming', options };
}

export function admitPlayer(game: GameState, name: string, uin: string): Admission {
	const existing = game.players[name];
	if (existing) return existing.uin === uin ? 'returning' : 'taken';
	if (game.state !== 'forming') return 'closed';
	if (Object.keys(game.players).length >= game.options.max_participants) return 'full';
	game.players[name] = { uin, money: 0, last_offer_time: 0 };
	return 'joined';
}

export function updateOptions(game: GameState, options: GameOptions): boolean {
	if (game.state !== 'forming') return false;
	game.options = options;
	return true;
}

export function kickPlayer(game: GameState, player: string): boolean {
	if (game.state !== 'forming' || !game.players[player]) return false;
	delete game.players[player];
	return true;
}

export function rewardPlayer(game: GameState, player: string, amount: number): boolean {
	const target = game.players[player];
	if (!target || game.state === 'forming') return false;
	target.money = round2(target.money + amount);
	return true;
}

export function startGame(game: GameState, now = Date.now()): boolean {
	if (game.state !== 'forming' || Object.keys(game.players).length === 0) return false;
	game.gens = {};
	let n = 0;
	for (const [owner, player] of Object.entries(game.players)) {
		player.money = game.options.starting_money;
		for (const { capacity, cost } of GEN_PRESETS[game.options.gen_preset].units) {
			const id = `Gen ${++n}`;
			game.gens[id] = { id, owner, capacity, cost, offer: cost };
		}
	}
	game.state = 'running';
	game.auto_advance = true;
	openPeriod(game, 1, now);
	return true;
}

export function setAutoAdvance(game: GameState, enabled: boolean, now = Date.now()): boolean {
	if (game.state !== 'running') return false;
	game.auto_advance = enabled;
	if (enabled) game.advance_time = now + game.options.auto_advance_time * 1000;
	return true;
}

export function submitOffers(
	game: GameState,
	player: string,
	offers: Record<string, number>,
	period: number,
	now = Date.now()
): boolean {
	if (game.state !== 'running' || period !== game.period || !game.players[player]) return false;
	for (const [id, offer] of Object.entries(offers)) {
		const gen = game.gens[id];
		if (gen?.owner === player)
			gen.offer = Math.min(Math.max(offer, 0), game.options.max_offer_price);
	}
	game.players[player].last_offer_time = now;
	return true;
}

export function advancePeriod(
	game: GameState,
	now = Date.now(),
	random: Random = Math.random
): Period | null {
	if (game.state !== 'running') return null;
	const period = clearPeriod(game, random);
	if (game.period >= game.options.num_periods) game.state = 'completed';
	else openPeriod(game, game.period + 1, now);
	return period;
}

export function forecastLoad(game: GameState): number {
	return Math.floor(baseLoad(game));
}

function openPeriod(game: GameState, period: number, now: number) {
	game.period = period;
	game.last_advance_time = now;
	game.advance_time = now + game.options.auto_advance_time * 1000;
}

function baseLoad(game: GameState): number {
	const shape = LOAD_PROFILES[game.options.load_profile].shape;
	return Object.keys(game.players).length * 100 * shape[(game.period - 1) % shape.length];
}

function actualLoad(game: GameState, random: Random): number {
	const jitter = game.options.load_jitter / 100;
	if (!jitter) return forecastLoad(game);
	return Math.max(1, Math.floor(baseLoad(game) * (1 + (random() * 2 - 1) * jitter)));
}

function clearPeriod(game: GameState, random: Random): Period {
	const { options, players } = game;
	const load = actualLoad(game, random);
	const order = Object.values(game.gens);
	for (let i = order.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[order[i], order[j]] = [order[j], order[i]];
	}
	order.sort((a, b) => a.offer - b.offer);

	const gens: Period['gens'] = {};
	let remaining = load;
	let price = 0;
	for (const gen of order) {
		const mw = Math.min(gen.capacity, remaining);
		gens[gen.id] = { offer: gen.offer, mw };
		if (mw > 0) price = gen.offer;
		remaining -= mw;
	}
	if (remaining > 0 && options.scarcity_price > 0) price = options.scarcity_price;

	const results: Period['players'] = {};
	for (const name of Object.keys(players))
		results[name] = { revenue: 0, costs: 0, profit: 0, money: 0 };
	for (const gen of order) {
		const { mw } = gens[gen.id];
		const result = results[gen.owner];
		if (!mw || !result) continue;
		const revenue = round2((options.payment_method === 'pay_as_offered' ? gen.offer : price) * mw);
		const cost = round2(gen.cost * mw);
		result.revenue = round2(result.revenue + revenue);
		result.costs = round2(result.costs + cost);
		result.profit = round2(result.profit + revenue - cost);
	}
	for (const [name, player] of Object.entries(players)) {
		const result = results[name]!;
		player.money = round2(player.money + result.profit);
		result.money = player.money;
	}

	return { number: game.period, load, marginal_cost: price, players: results, gens };
}
