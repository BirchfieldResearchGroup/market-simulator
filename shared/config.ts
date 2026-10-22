export const VISIBILITIES = ['public', 'unlisted'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const PAYMENT_METHODS = {
	last_accepted_offer: {
		label: 'Last Accepted Offer',
		short: 'LAO',
		description:
			'Every dispatched generator is paid the clearing price set by the last accepted offer.'
	},
	pay_as_offered: {
		label: 'Pay as Offered',
		short: 'PAO',
		description: 'Each dispatched generator is paid its own offer price.'
	}
} as const;

export const GEN_PRESETS = {
	standard: {
		label: 'Standard',
		units: [
			{ capacity: 50, cost: 20 },
			{ capacity: 20, cost: 30 },
			{ capacity: 10, cost: 40 },
			{ capacity: 10, cost: 50 },
			{ capacity: 10, cost: 65 }
		]
	},
	simple: {
		label: 'Simple',
		units: [
			{ capacity: 50, cost: 20 },
			{ capacity: 30, cost: 35 },
			{ capacity: 20, cost: 55 }
		]
	},
	competitive: {
		label: 'Competitive',
		units: [
			{ capacity: 30, cost: 15 },
			{ capacity: 20, cost: 25 },
			{ capacity: 15, cost: 30 },
			{ capacity: 10, cost: 40 },
			{ capacity: 10, cost: 50 },
			{ capacity: 10, cost: 60 },
			{ capacity: 5, cost: 75 }
		]
	}
} as const;

export const LOAD_PROFILES = {
	realistic: {
		label: 'Realistic',
		shape: [
			0.522441691, 0.472495937, 0.44734451, 0.43918225, 0.524746677, 0.635641158, 0.732903576,
			0.789389988, 0.804715331, 0.76067869, 0.708948052, 0.616364574, 0.535339516, 0.488753845,
			0.485078364, 0.502676387, 0.58499257, 0.693471822, 0.789035563, 0.842958247, 0.850073775,
			0.804827558, 0.74614858, 0.645890024
		]
	},
	flat: { label: 'Flat', shape: Array<number>(24).fill(0.65) },
	peak: {
		label: 'Peak',
		shape: [
			0.35, 0.32, 0.3, 0.3, 0.35, 0.45, 0.7, 0.9, 0.95, 0.8, 0.6, 0.45, 0.4, 0.38, 0.38, 0.42, 0.55,
			0.75, 0.92, 0.95, 0.85, 0.65, 0.5, 0.4
		]
	},
	volatile: {
		label: 'Volatile',
		shape: [
			0.45, 0.3, 0.55, 0.35, 0.8, 0.4, 0.9, 0.5, 0.95, 0.35, 0.7, 0.45, 0.85, 0.3, 0.6, 0.9, 0.4,
			0.95, 0.5, 0.8, 0.35, 0.7, 0.55, 0.45
		]
	}
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;
export type GenPreset = keyof typeof GEN_PRESETS;
export type LoadProfile = keyof typeof LOAD_PROFILES;

export const NUMBER_OPTIONS = {
	max_participants: { label: 'Max players', min: 2, max: 99 },
	num_periods: { label: 'Periods', min: 2, max: 99 },
	auto_advance_time: { label: 'Timer (sec)', min: 2, max: 9999 },
	max_offer_price: { label: 'Offer cap ($/MWh)', min: 1, max: 9999 },
	starting_money: { label: 'Starting money ($)', min: 0, max: 999999 },
	scarcity_price: {
		label: 'Scarcity price ($/MWh)',
		min: 0,
		max: 99999,
		hint: 'Clearing price when demand exceeds supply. 0 disables.'
	},
	load_jitter: {
		label: 'Load jitter (%)',
		min: 0,
		max: 30,
		hint: 'Random ± variation applied to each period’s load.'
	}
} as const;

export type NumberOption = keyof typeof NUMBER_OPTIONS;

export const DEFAULT_OPTIONS = {
	max_participants: 6,
	num_periods: 24,
	auto_advance_time: 180,
	max_offer_price: 200,
	starting_money: 0,
	scarcity_price: 0,
	load_jitter: 0,
	payment_method: 'last_accepted_offer' as PaymentMethod,
	gen_preset: 'standard' as GenPreset,
	load_profile: 'realistic' as LoadProfile
};
