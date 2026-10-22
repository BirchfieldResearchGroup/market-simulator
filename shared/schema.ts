import * as v from 'valibot';
import {
	GEN_PRESETS,
	LOAD_PROFILES,
	NUMBER_OPTIONS,
	PAYMENT_METHODS,
	VISIBILITIES,
	type NumberOption
} from './config';

const keys = <T extends object>(record: T) => Object.keys(record) as (keyof T & string)[];

const integer = (option: NumberOption) =>
	v.pipe(
		v.number(),
		v.integer(),
		v.minValue(NUMBER_OPTIONS[option].min),
		v.maxValue(NUMBER_OPTIONS[option].max)
	);

const label = (maxLength: number) =>
	v.pipe(v.string(), v.trim(), v.regex(/^[\w -]+$/), v.maxLength(maxLength));

const finite = v.pipe(v.number(), v.finite());

export const GameOptionsSchema = v.object({
	max_participants: integer('max_participants'),
	num_periods: integer('num_periods'),
	auto_advance_time: integer('auto_advance_time'),
	max_offer_price: integer('max_offer_price'),
	starting_money: integer('starting_money'),
	scarcity_price: integer('scarcity_price'),
	load_jitter: integer('load_jitter'),
	payment_method: v.picklist(keys(PAYMENT_METHODS)),
	gen_preset: v.picklist(keys(GEN_PRESETS)),
	load_profile: v.picklist(keys(LOAD_PROFILES))
});

export const PlayerIdentity = v.object({
	name: label(20),
	uin: v.pipe(v.string(), v.trim(), v.regex(/^[a-z0-9]{1,20}$/i))
});

export const NewMarket = v.object({ name: label(40), options: GameOptionsSchema });

export const ClientMessage = v.variant('type', [
	v.object({ type: v.literal('updateOptions'), options: GameOptionsSchema }),
	v.object({ type: v.literal('setVisibility'), visibility: v.picklist(VISIBILITIES) }),
	v.object({ type: v.literal('startGame') }),
	v.object({ type: v.literal('advancePeriod') }),
	v.object({ type: v.literal('setAutoAdvance'), enabled: v.boolean() }),
	v.object({ type: v.literal('kickPlayer'), player: v.string() }),
	v.object({
		type: v.literal('rewardPlayer'),
		player: v.string(),
		amount: v.pipe(finite, v.minValue(-1e6), v.maxValue(1e6))
	}),
	v.object({
		type: v.literal('submitOffers'),
		period: v.number(),
		offers: v.record(v.string(), finite)
	})
]);

export type GameOptions = v.InferOutput<typeof GameOptionsSchema>;
export type ClientMessage = v.InferOutput<typeof ClientMessage>;
