import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS } from '../shared/config';
import type { GameState } from '../shared/game';
import { ClientMessage, GameOptionsSchema, type GameOptions } from '../shared/schema';
import {
	admitPlayer,
	advancePeriod,
	forecastLoad,
	kickPlayer,
	newGame,
	rewardPlayer,
	startGame,
	submitOffers
} from './engine';
import { periodFor, viewFor } from './view';

const fixed = () => 0.5;

function runningGame(options: Partial<GameOptions> = {}): GameState {
	const game = newGame({ ...DEFAULT_OPTIONS, ...options });
	admitPlayer(game, 'alice', 'A1');
	admitPlayer(game, 'bob', 'B2');
	startGame(game, 1000);
	return game;
}

function offer(game: GameState, player: string, markup: number) {
	const offers = Object.fromEntries(
		Object.values(game.gens)
			.filter((g) => g.owner === player)
			.map((g) => [g.id, g.cost + markup])
	);
	return submitOffers(game, player, offers, game.period, 2000);
}

describe('admission', () => {
	it('joins, recognises returning players and rejects impostors', () => {
		const game = newGame({ ...DEFAULT_OPTIONS, max_participants: 2 });
		expect(admitPlayer(game, 'alice', 'A1')).toBe('joined');
		expect(admitPlayer(game, 'alice', 'A1')).toBe('returning');
		expect(admitPlayer(game, 'alice', 'X9')).toBe('taken');
		expect(admitPlayer(game, 'bob', 'B2')).toBe('joined');
		expect(admitPlayer(game, 'carol', 'C3')).toBe('full');
		startGame(game);
		expect(admitPlayer(game, 'dave', 'D4')).toBe('closed');
		expect(admitPlayer(game, 'bob', 'B2')).toBe('returning');
	});

	it('only kicks during the lobby', () => {
		const game = newGame(DEFAULT_OPTIONS);
		admitPlayer(game, 'alice', 'A1');
		expect(kickPlayer(game, 'alice')).toBe(true);
		expect(game.players).toEqual({});
		expect(kickPlayer(runningGame(), 'alice')).toBe(false);
	});
});

describe('game lifecycle', () => {
	it('starts with each player owning the preset portfolio', () => {
		const game = runningGame({ gen_preset: 'simple', starting_money: 500 });
		expect(game.state).toBe('running');
		expect(game.period).toBe(1);
		expect(game.advance_time).toBe(1000 + DEFAULT_OPTIONS.auto_advance_time * 1000);
		expect(Object.values(game.gens).filter((g) => g.owner === 'alice')).toHaveLength(3);
		expect(game.players.alice.money).toBe(500);
		expect(Object.values(game.gens).every((g) => g.offer === g.cost)).toBe(true);
	});

	it('refuses to start without players', () => {
		expect(startGame(newGame(DEFAULT_OPTIONS))).toBe(false);
	});

	it('completes after the final period', () => {
		const game = runningGame({ num_periods: 2 });
		expect(advancePeriod(game, 3000, fixed)?.number).toBe(1);
		expect(game.period).toBe(2);
		expect(advancePeriod(game, 4000, fixed)?.number).toBe(2);
		expect(game.state).toBe('completed');
		expect(game.period).toBe(2);
		expect(advancePeriod(game)).toBeNull();
	});
});

describe('offers', () => {
	it('clamps to the offer cap and ignores generators the player does not own', () => {
		const game = runningGame({ max_offer_price: 100 });
		const [own, other] = ['Gen 1', 'Gen 6'];
		expect(submitOffers(game, 'alice', { [own]: 500, [other]: 1 }, 1)).toBe(true);
		expect(game.gens[own].offer).toBe(100);
		expect(game.gens[other].offer).toBe(game.gens[other].cost);
	});

	it('rejects offers for a stale period', () => {
		const game = runningGame();
		advancePeriod(game, 3000, fixed);
		expect(submitOffers(game, 'alice', { 'Gen 1': 10 }, 1)).toBe(false);
	});
});

describe('market clearing', () => {
	it('pays every dispatched unit the clearing price under last accepted offer', () => {
		const game = runningGame();
		offer(game, 'bob', 5);
		expect(forecastLoad(game)).toBe(104);
		const period = advancePeriod(game, 3000, fixed)!;
		expect(period.load).toBe(104);
		expect(period.marginal_cost).toBe(30);
		expect(period.players.alice).toEqual({ revenue: 1620, costs: 1120, profit: 500, money: 500 });
		expect(period.players.bob).toEqual({ revenue: 1500, costs: 1000, profit: 500, money: 500 });
		expect(game.players.alice.money).toBe(500);
	});

	it('pays each unit its own offer under pay as offered', () => {
		const game = runningGame({ payment_method: 'pay_as_offered' });
		offer(game, 'bob', 5);
		const period = advancePeriod(game, 3000, fixed)!;
		expect(period.players.alice?.profit).toBe(0);
		expect(period.players.bob?.profit).toBe(250);
	});

	it('applies the scarcity price only when demand goes unmet', () => {
		const short = runningGame({ load_profile: 'peak', scarcity_price: 500 });
		for (const gen of Object.values(short.gens).slice(1)) gen.capacity = 0;
		expect(advancePeriod(short, 3000, fixed)!.marginal_cost).toBe(500);
		expect(advancePeriod(runningGame({ scarcity_price: 500 }), 3000, fixed)!.marginal_cost).toBe(
			30
		);
	});

	it('keeps jittered load within the configured band', () => {
		expect(advancePeriod(runningGame({ load_jitter: 10 }), 0, () => 0)!.load).toBe(94);
		expect(advancePeriod(runningGame({ load_jitter: 10 }), 0, () => 0.999999)!.load).toBe(114);
	});
});

describe('rewards', () => {
	it('adjusts money once the game is running', () => {
		const game = runningGame();
		expect(rewardPlayer(game, 'alice', 250.5)).toBe(true);
		expect(game.players.alice.money).toBe(250.5);
		expect(rewardPlayer(newGame(DEFAULT_OPTIONS), 'alice', 1)).toBe(false);
	});
});

describe('participant view', () => {
	it('hides other players, their generators and every UIN', () => {
		const game = runningGame();
		rewardPlayer(game, 'bob', 900);
		const view = viewFor(game, 'participant', 'alice');
		expect(view.players.bob).toEqual({ uin: '', money: 0, last_offer_time: 0 });
		expect(view.players.alice.uin).toBe('');
		expect(Object.values(view.gens).every((g) => g.owner === 'alice')).toBe(true);
		expect(view.rank).toBe(2);
		expect(viewFor(game, 'admin', 'admin').players.bob.uin).toBe('B2');

		const period = periodFor(advancePeriod(game, 3000, fixed)!, game, 'participant', 'alice');
		expect(Object.keys(period.players)).toEqual(['alice']);
		expect(Object.keys(period.gens).every((id) => game.gens[id].owner === 'alice')).toBe(true);
	});
});

describe('schemas', () => {
	it('rejects options outside their limits', () => {
		expect(v.is(GameOptionsSchema, DEFAULT_OPTIONS)).toBe(true);
		expect(v.is(GameOptionsSchema, { ...DEFAULT_OPTIONS, num_periods: Number.NaN })).toBe(false);
		expect(v.is(GameOptionsSchema, { ...DEFAULT_OPTIONS, max_participants: 1 })).toBe(false);
		expect(v.is(GameOptionsSchema, { ...DEFAULT_OPTIONS, gen_preset: 'huge' })).toBe(false);
	});

	it('accepts only well-formed client messages', () => {
		expect(v.is(ClientMessage, { type: 'advancePeriod' })).toBe(true);
		expect(v.is(ClientMessage, { type: 'submitOffers', period: 1, offers: { a: 10 } })).toBe(true);
		expect(v.is(ClientMessage, { type: 'submitOffers', period: 1, offers: { a: Infinity } })).toBe(
			false
		);
		expect(v.is(ClientMessage, { type: 'deleteEverything' })).toBe(false);
	});
});
