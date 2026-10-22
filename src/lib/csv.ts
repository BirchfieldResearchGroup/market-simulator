import type { Period } from '../../shared/game';

const cell = (value: number | string | undefined) => {
	const text = String(value ?? '');
	return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function downloadCsv(periods: Period[], name: string) {
	const players = [...new Set(periods.flatMap((p) => Object.keys(p.players)))];
	const gens = [...new Set(periods.flatMap((p) => Object.keys(p.gens)))];
	const header = [
		'Period',
		'Load (MW)',
		'Clearing price ($/MWh)',
		...players.flatMap((n) => [`${n} revenue`, `${n} costs`, `${n} profit`, `${n} money`]),
		...gens.flatMap((id) => [`${id} offer`, `${id} MW`])
	];
	const rows = periods.map((p) => [
		p.number,
		p.load,
		p.marginal_cost,
		...players.flatMap((n) => {
			const r = p.players[n];
			return [r?.revenue, r?.costs, r?.profit, r?.money];
		}),
		...gens.flatMap((id) => [p.gens[id]?.offer, p.gens[id]?.mw])
	]);
	const csv = [header, ...rows].map((row) => row.map(cell).join(',')).join('\n');
	const link = document.createElement('a');
	link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
	link.download = `${name.replace(/[^\w-]+/g, '_')}.csv`;
	link.click();
	URL.revokeObjectURL(link.href);
}
