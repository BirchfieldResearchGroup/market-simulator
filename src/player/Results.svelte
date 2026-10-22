<script lang="ts">
	import { PAYMENT_METHODS } from '../../shared/config';
	import Icon from '../components/Icon.svelte';
	import Stat from '../components/Stat.svelte';
	import { average, money, plural, tone } from '../lib/format';
	import { game } from '../lib/game.svelte';
	import type { IconName } from '../lib/icons';
	import { session } from '../lib/session.svelte';

	const MEDALS = ['bg-gold', 'bg-silver', 'bg-bronze'];

	const g = $derived(game.state);
	const me = $derived(g.players[session.name]);
	const results = $derived(
		g.periods.map((p) => ({ number: p.number, profit: p.players[session.name]?.profit ?? 0 }))
	);
	const profit = $derived(results.reduce((sum, r) => sum + r.profit, 0));
	const wins = $derived(results.filter((r) => r.profit > 0).length);
	const best = $derived(results.reduce((a, b) => (b.profit > a.profit ? b : a), results[0]));
	const worst = $derived(results.reduce((a, b) => (b.profit < a.profit ? b : a), results[0]));
	const medal = $derived(MEDALS[(g.rank ?? 0) - 1]);
</script>

{#snippet highlight(icon: IconName, label: string, detail: string, value: string, color: string)}
	<div class="card px-4 py-3">
		<div class="mb-2 flex items-center gap-1.5">
			<Icon name={icon} size={14} class="text-text-muted" />
			<span class="label-micro">{label}</span>
		</div>
		<div class="flex items-baseline justify-between gap-2">
			<span class="text-sm font-semibold text-text-secondary">{detail}</span>
			<span class="truncate font-mono font-bold {color}">{value}</span>
		</div>
	</div>
{/snippet}

{#if me && results.length}
	<section class="animate-in overflow-hidden rounded-lg shadow" aria-label="Game results">
		<div
			class="flex flex-col gap-6 bg-gradient-to-br from-maroon to-maroon-dark p-6 text-text-inverse sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="min-w-0">
				<p class="text-micro font-bold tracking-brand text-gold uppercase">Market complete</p>
				<h3 class="mt-2 text-3xl font-bold break-words text-text-inverse">{session.market}</h3>
				<p class="mt-1 text-sm opacity-60">
					{plural(results.length, 'period')} · {plural(game.playerCount, 'player')} ·
					{PAYMENT_METHODS[g.options.payment_method].label}
				</p>
			</div>
			<div class="flex flex-col items-center gap-1.5">
				<span
					class="flex size-16 items-center justify-center rounded-full font-mono text-2xl font-extrabold {medal
						? `${medal} text-text-primary`
						: 'border border-text-inverse/20 bg-text-inverse/10'}"
				>
					#{g.rank}
				</span>
				<span class="text-micro font-semibold tracking-brand uppercase opacity-60">
					of {plural(game.playerCount, 'player')}
				</span>
			</div>
		</div>
		<div class="grid grid-cols-2 bg-surface py-3 sm:grid-cols-4">
			<Stat label="Final balance" value={money(me.money)} tone={tone(me.money)} />
			<Stat label="Net profit" value={money(profit, true)} tone={tone(profit)} />
			<Stat label="Avg profit" value={money(average(results.map((r) => r.profit)), true)} />
			<Stat
				label="Win rate"
				value="{Math.round((wins / results.length) * 100)}%"
				sub="{wins} of {results.length} profitable"
			/>
		</div>
	</section>

	<div class="grid gap-3 sm:grid-cols-3">
		{@render highlight(
			'trophy',
			'Best period',
			`Period ${best.number}`,
			money(best.profit, true),
			tone(best.profit)
		)}
		{@render highlight(
			'warning',
			'Worst period',
			`Period ${worst.number}`,
			money(worst.profit, true),
			tone(worst.profit)
		)}
		{@render highlight(
			'chart',
			'Avg clearing price',
			plural(results.length, 'period'),
			money(average(g.periods.map((p) => p.marginal_cost))),
			'text-info'
		)}
	</div>
{/if}
