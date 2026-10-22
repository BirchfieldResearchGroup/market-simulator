<script lang="ts">
	import { untrack } from 'svelte';
	import type { Period } from '../../shared/game';
	import { AXES, Chart, type Series } from '../lib/chart';
	import Icon from './Icon.svelte';

	let {
		title,
		periods,
		series,
		hideMw = false
	}: { title: string; periods: Period[]; series: Series[]; hideMw?: boolean } = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart<'bar' | 'line', (number | null)[], number> | undefined;

	$effect(() => {
		const css = getComputedStyle(document.documentElement);
		const token = (name: string) => css.getPropertyValue(`--${name}`).trim();
		const font = { family: token('font-body'), size: 12, weight: 600 } as const;
		const mono = { family: token('font-mono'), size: 11 };
		const muted = token('color-text-muted');
		const lines = untrack(() => series);
		const axes = [...new Set(lines.map((s) => s.axis))];
		const visible = axes.filter((axis) => !(hideMw && axis === 'mw'));

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: [],
				datasets: lines.map((s) => {
					const color = token(`color-${s.color}`);
					return {
						type: s.bar ? 'bar' : 'line',
						label: s.label,
						data: [],
						yAxisID: s.axis,
						order: s.bar ? 1 : 0,
						borderColor: color,
						backgroundColor: s.bar ? `${color}40` : s.fill ? `${color}14` : 'transparent',
						borderWidth: s.bar ? 1 : 2.5,
						borderRadius: s.bar ? 3 : 0,
						borderDash: s.dashed ? [6, 3] : [],
						fill: s.fill,
						tension: 0.3,
						pointRadius: 3,
						pointBackgroundColor: color
					};
				})
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { intersect: false, mode: 'index' },
				plugins: {
					legend: {
						position: 'top',
						align: 'end',
						labels: { font, color: token('color-text-secondary'), usePointStyle: true }
					},
					tooltip: {
						backgroundColor: token('color-text-primary'),
						bodyFont: mono,
						padding: 10,
						callbacks: {
							title: ([item]) => `Period ${item.label}`,
							label: (item) =>
								`${item.dataset.label}: ${AXES[lines[item.datasetIndex].axis].tooltip(item.parsed.y)}`
						}
					}
				},
				scales: {
					x: {
						title: { display: true, text: 'Period', font, color: muted },
						ticks: { font: mono, color: muted, maxRotation: 0, autoSkipPadding: 8 },
						grid: { display: false },
						border: { display: false }
					},
					...Object.fromEntries(
						axes.map((axis) => [
							axis,
							{
								type: 'linear' as const,
								display: visible.includes(axis),
								position: AXES[axis].position,
								beginAtZero: true,
								title: { display: true, text: AXES[axis].title, font, color: muted },
								ticks: {
									font: mono,
									color: muted,
									precision: 0,
									callback: (v: number | string) => AXES[axis].tick(Number(v))
								},
								grid: { display: axis === visible[0], color: 'rgb(0 0 0 / 0.04)' },
								border: { display: false }
							}
						])
					)
				}
			}
		});
		return () => chart?.destroy();
	});

	$effect(() => {
		const labels = periods.map((p) => p.number);
		const data = series.map((s) => periods.map((p) => s.value(p) ?? null));
		if (!chart) return;
		chart.data.labels = labels;
		chart.data.datasets.forEach((dataset, i) => (dataset.data = data[i]));
		chart.update();
	});
</script>

<section class="card" aria-label={title}>
	<h3 class="card-header">{title}</h3>
	<div class="card-body">
		{#if periods.length === 0}
			<div class="flex h-64 flex-col items-center justify-center text-center">
				<Icon name="chart" size={40} class="text-gold opacity-30" />
				<p class="mt-3 text-sm text-text-muted">Data appears as periods clear.</p>
			</div>
		{/if}
		<div class="relative h-[clamp(15rem,30vw,22rem)]" class:hidden={periods.length === 0}>
			<canvas bind:this={canvas} aria-hidden="true"></canvas>
		</div>
		<table class="sr-only">
			<caption>{title}</caption>
			<thead>
				<tr>
					<th scope="col">Period</th>
					{#each series as s (s.label)}<th scope="col">{s.label}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each periods as period (period.number)}
					<tr>
						<td>{period.number}</td>
						{#each series as s (s.label)}<td>{s.value(period) ?? '—'}</td>{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
