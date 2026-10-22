import {
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	Filler,
	Legend,
	LinearScale,
	LineController,
	LineElement,
	PointElement,
	Tooltip
} from 'chart.js';
import type { Period } from '../../shared/game';
import { money, mw, price } from './format';

Chart.register(
	BarController,
	BarElement,
	CategoryScale,
	Filler,
	Legend,
	LinearScale,
	LineController,
	LineElement,
	PointElement,
	Tooltip
);

export { Chart };

export const AXES = {
	mw: { title: 'Load (MW)', position: 'left', tick: mw, tooltip: mw },
	money: { title: 'Amount ($)', position: 'left', tick: money, tooltip: money },
	price: { title: 'Price ($/MWh)', position: 'right', tick: money, tooltip: price }
} as const;

export interface Series {
	label: string;
	axis: keyof typeof AXES;
	color: 'maroon' | 'gold' | 'info';
	bar?: boolean;
	fill?: boolean;
	dashed?: boolean;
	value: (period: Period) => number | undefined;
}

export const MARKET_SERIES: Series[] = [
	{ label: 'Load', axis: 'mw', color: 'gold', bar: true, value: (p) => p.load },
	{ label: 'Clearing price', axis: 'price', color: 'maroon', value: (p) => p.marginal_cost }
];

export function playerSeries(name: string): Series[] {
	const own = (key: 'revenue' | 'profit') => (p: Period) => p.players[name]?.[key];
	return [
		{ label: 'Load', axis: 'mw', color: 'info', bar: true, value: (p) => p.load },
		{ label: 'Revenue', axis: 'money', color: 'gold', fill: true, value: own('revenue') },
		{ label: 'Profit', axis: 'money', color: 'maroon', fill: true, value: own('profit') },
		{
			label: 'Clearing price',
			axis: 'price',
			color: 'info',
			dashed: true,
			value: MARKET_SERIES[1].value
		}
	];
}
