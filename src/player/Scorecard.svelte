<script lang="ts">
	import type { Period } from '../../shared/game';
	import Stat from '../components/Stat.svelte';
	import { average, money, mw, tone } from '../lib/format';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';

	const profit = (period: Period) => period.players[session.name]?.profit;
	const periods = $derived([...game.state.periods].reverse());
	const last = $derived(periods[0]);
</script>

<section class="card" aria-label="Period results">
	<h3 class="card-header">Period results</h3>
	{#if last}
		<div class="grid grid-cols-2 border-b border-border-light py-2">
			<Stat label="Clearing price" value={money(last.marginal_cost)} />
			<Stat label="Your profit" value={money(profit(last), true)} tone={tone(profit(last))} />
		</div>
		<div class="max-h-56 overflow-y-auto [&_td]:px-3 [&_td]:text-xs [&_th]:px-3">
			<table>
				<thead class="sticky top-0">
					<tr><th>#</th><th>Load</th><th>Price</th><th class="text-right">Profit</th></tr>
				</thead>
				<tbody>
					{#each periods as period (period.number)}
						<tr>
							<td class="text-text-muted">{period.number}</td>
							<td>{mw(period.load)}</td>
							<td>{money(period.marginal_cost)}</td>
							<td class="text-right {tone(profit(period))}">{money(profit(period), true)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<dl class="border-t border-border-light px-4 py-2.5 text-xs">
			<div class="kv-row">
				<dt class="label-micro">Avg price</dt>
				<dd class="font-mono">{money(average(periods.map((p) => p.marginal_cost)))}</dd>
			</div>
			<div class="kv-row">
				<dt class="label-micro">Avg profit</dt>
				<dd class="font-mono">{money(average(periods.map((p) => profit(p) ?? 0)), true)}</dd>
			</div>
		</dl>
	{:else}
		<p class="px-4 py-6 text-center text-sm text-text-muted italic">No periods cleared yet.</p>
	{/if}
</section>
