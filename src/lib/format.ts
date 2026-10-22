import type { Phase } from '../../shared/game';

const currency = (signDisplay: 'auto' | 'exceptZero') =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		signDisplay
	});

const plain = currency('auto');
const signed = currency('exceptZero');

type Value = number | null | undefined;

export const money = (value: Value, withSign = false) =>
	value == null ? '—' : (withSign ? signed : plain).format(value);

export const price = (value: Value) => (value == null ? '—' : `${plain.format(value)}/MWh`);

export const mw = (value: Value) => (value == null ? '—' : `${value.toLocaleString('en-US')} MW`);

export const tone = (value: Value) => (!value ? '' : value > 0 ? 'text-success' : 'text-danger');

export const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

export const average = (values: number[]) =>
	values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

export function duration(seconds: number): string {
	const minutes = Math.round(seconds / 60);
	if (seconds < 60) return `${seconds}s`;
	if (minutes < 60) return `${minutes}m`;
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m`.replace(/ 0m$/, '');
}

export const PHASES: Record<Phase, { label: string; short: string; badge: string }> = {
	uninitialized: { label: 'Not Created', short: 'New', badge: 'badge-muted' },
	forming: { label: 'Open for Players', short: 'Open', badge: 'badge-success' },
	running: { label: 'In Progress', short: 'Live', badge: 'badge-info' },
	completed: { label: 'Completed', short: 'Done', badge: 'badge-maroon' }
};
