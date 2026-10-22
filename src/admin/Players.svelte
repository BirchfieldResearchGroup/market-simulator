<script lang="ts">
	import { hasSubmitted, standings } from '../../shared/game';
	import { money, plural, tone } from '../lib/format';
	import { game } from '../lib/game.svelte';

	let { onselect }: { onselect: (name: string) => void } = $props();

	const g = $derived(game.state);
	const ranked = $derived(standings(g.players));
	const recent = $derived(g.periods.slice(-8));

	function sparkline(name: string) {
		const profits = recent.map((p) => p.players[name]?.profit ?? 0);
		if (profits.length < 2) return '';
		const scale = Math.max(1, ...profits.map(Math.abs));
		return profits
			.map((profit, i) => {
				const x = ((i * 60) / (profits.length - 1)).toFixed(1);
				const y = (12 - (profit / scale) * 10).toFixed(1);
				return `${i ? 'L' : 'M'}${x},${y}`;
			})
			.join(' ');
	}
</script>

<section class="card">
	<h3 class="card-header flex items-center justify-between">
		<span>Players</span>
		<span class="font-mono tracking-normal normal-case">{plural(ranked.length, 'player')}</span>
	</h3>
	{#if ranked.length === 0}
		<p class="px-6 py-10 text-center text-sm text-text-muted italic">No players have joined yet.</p>
	{:else}
		<ul class="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2.5 p-4">
			{#each ranked as [name, player], rank (name)}
				{@const online = !!g.clients?.includes(name)}
				{@const path = sparkline(name)}
				<li>
					<button
						class="flex w-full flex-col gap-1.5 rounded border border-border-light bg-surface p-3 text-left transition hover:border-maroon/40 hover:shadow-xs"
						onclick={() => onselect(name)}
					>
						<span class="flex items-start justify-between gap-2">
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{name}</span>
								<span class="block truncate font-mono text-micro text-text-muted">{player.uin}</span
								>
							</span>
							<span class="dot mt-1.5" class:dot-online={online}></span>
							<span class="sr-only">{online ? 'online' : 'offline'}</span>
						</span>
						{#if game.active}
							<span class="font-mono text-lg font-bold {tone(player.money)}">
								{money(player.money, true)}
							</span>
							<span class="flex items-center justify-between gap-2">
								{#if g.state === 'running'}
									{@const done = hasSubmitted(player, g)}
									<span class="badge {done ? 'badge-success' : 'badge-warning'}">
										{done ? 'Submitted' : 'Pending'}
									</span>
								{:else}
									<span class="label-micro">Rank #{rank + 1}</span>
								{/if}
								{#if path}
									<svg width="60" height="24" viewBox="0 0 60 24" aria-hidden="true">
										<path d={path} fill="none" stroke="var(--color-maroon)" stroke-width="1.5" />
									</svg>
								{/if}
							</span>
						{:else}
							<span class="text-xs text-text-muted italic">{online ? 'Ready' : 'Joined'}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>
