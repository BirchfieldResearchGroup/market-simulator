<script lang="ts">
	import type { MarketListItem } from '../../shared/game';
	import { pollMarkets } from '../lib/api.svelte';
	import { session } from '../lib/session.svelte';
	import Icon from './Icon.svelte';
	import PhaseBadge from './PhaseBadge.svelte';

	let { joinable = false }: { joinable?: boolean } = $props();

	const list = pollMarkets(5_000);

	function action(market: MarketListItem) {
		if (market.state === 'forming') return market.isMember ? 'Rejoin' : 'Join';
		if (!market.isMember) return null;
		return market.state === 'completed' ? 'View results' : 'Rejoin';
	}
</script>

<div class="mb-2 flex items-center justify-between gap-3">
	{#if list.failed}
		<p class="text-sm text-warning-text">Could not reach the server. Retrying automatically…</p>
	{:else}
		<span></span>
	{/if}
	<button class="btn btn-sm text-text-muted hover:text-maroon" onclick={list.refresh}>
		<Icon name="refresh" size={12} /> Refresh
	</button>
</div>

{#if !list.loaded}
	<div class="card px-8 py-12 text-center text-sm text-text-muted" role="status">
		Fetching available markets…
	</div>
{:else if list.markets.length === 0}
	<div class="card flex flex-col items-center px-8 py-12 text-center">
		<Icon name="list" size={32} class="mb-3 text-maroon opacity-20" />
		<h4 class="mb-1 text-lg text-text-secondary">No active markets</h4>
		<p class="max-w-xs text-sm text-text-muted">
			Ask your instructor to create a market; it will appear here.
		</p>
	</div>
{:else}
	<ul class="card divide-y divide-border-light">
		{#each list.markets as market (market.name)}
			{@const label = action(market)}
			<li class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-maroon-faint">
				<div class="flex min-w-0 items-center gap-3">
					<span class="truncate font-semibold">{market.name}</span>
					<PhaseBadge phase={market.state} />
				</div>
				<div class="flex shrink-0 items-center gap-4">
					<span class="flex items-center gap-1 font-mono text-sm text-text-muted">
						<Icon name="users" size={14} />
						{market.playerCount} / {market.maxPlayers}
					</span>
					{#if joinable}
						{#if label}
							<button
								class="btn btn-primary btn-sm min-w-16"
								aria-label="{label} {market.name}"
								onclick={() => session.join(market.name)}>{label}</button
							>
						{:else}
							<span class="w-16 text-center text-text-muted">—</span>
						{/if}
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}
