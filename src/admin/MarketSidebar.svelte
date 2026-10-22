<script lang="ts">
	import type { MarketListItem } from '../../shared/game';
	import Icon from '../components/Icon.svelte';
	import PhaseBadge from '../components/PhaseBadge.svelte';
	import { plural } from '../lib/format';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';

	let {
		markets,
		onrefresh,
		oncreate
	}: { markets: MarketListItem[]; onrefresh: () => void; oncreate: () => void } = $props();

	const live = $derived(game.state.state !== 'uninitialized');

	const rows = $derived(
		markets.map((market) =>
			live && market.name === session.market
				? {
						...market,
						state: game.state.state,
						visibility: game.state.visibility,
						playerCount: game.playerCount,
						maxPlayers: game.state.options.max_participants
					}
				: market
		)
	);

	function select(name: string) {
		if (name !== session.market || session.error) session.join(name);
	}
</script>

<aside class="flex flex-col gap-3 md:sticky md:top-8">
	<div class="flex items-center justify-between">
		<h2 class="text-lg">Markets</h2>
		<button class="icon-btn" aria-label="Refresh markets" onclick={onrefresh}>
			<Icon name="refresh" size={14} />
		</button>
	</div>
	<ul class="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-0.5">
		{#each rows as market (market.name)}
			{@const selected = market.name === session.market}
			<li>
				<button
					class="flex w-full flex-col gap-1 rounded border px-3 py-2.5 text-left transition-colors {selected
						? 'border-maroon/40 bg-maroon-faint shadow-[inset_2px_0_0_var(--color-maroon)]'
						: 'border-border-light bg-surface hover:border-border'}"
					aria-current={selected}
					onclick={() => select(market.name)}
				>
					<span class="flex items-center justify-between gap-2">
						<span class="truncate text-sm font-semibold">{market.name}</span>
						<PhaseBadge phase={market.state} short />
					</span>
					<span class="font-mono text-xs text-text-muted">
						{plural(market.playerCount, 'player')} / {market.maxPlayers}
						{market.visibility === 'unlisted' ? '· unlisted' : ''}
					</span>
				</button>
			</li>
		{:else}
			<li class="px-4 py-8 text-center text-sm text-text-muted italic">No markets yet.</li>
		{/each}
	</ul>
	<button
		class="btn border-dashed border-border text-text-muted hover:border-maroon/40 hover:text-maroon"
		onclick={oncreate}
	>
		<Icon name="plus" /> New market
	</button>
</aside>
