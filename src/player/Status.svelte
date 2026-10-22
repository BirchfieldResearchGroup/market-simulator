<script lang="ts">
	import { hasSubmitted } from '../../shared/game';
	import Icon from '../components/Icon.svelte';
	import { money, mw, tone } from '../lib/format';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';

	const g = $derived(game.state);
	const me = $derived(g.players[session.name]);
	const seconds = $derived(game.secondsLeft);
</script>

<aside class="stagger flex flex-col gap-5 md:sticky md:top-8" aria-label="Your status">
	{#if game.active && me}
		<div class="card">
			<div
				class="flex items-center justify-between bg-gradient-to-r from-maroon to-maroon-dark px-4 py-2 text-text-inverse"
			>
				<span class="text-xs font-semibold tracking-brand uppercase opacity-70">
					{g.state === 'completed' ? 'Final rank' : 'Rank'}
				</span>
				<span>
					<span class="font-mono text-lg font-bold text-gold">#{g.rank}</span>
					<span class="text-xs opacity-70">of {game.playerCount}</span>
				</span>
			</div>
			<div class="px-4 py-4 text-center">
				<span class="block font-mono text-3xl font-bold {tone(me.money)}">
					{money(me.money, true)}
				</span>
				<span class="label-micro mt-2 block">Balance</span>
			</div>
		</div>
	{/if}

	<section class="card">
		<h3 class="card-header">Game</h3>
		<dl class="card-body text-sm">
			<div class="kv-row">
				<dt class="label-micro">Market</dt>
				<dd class="truncate font-mono">{session.market}</dd>
			</div>
			<div class="kv-row">
				<dt class="label-micro">Players</dt>
				<dd class="font-mono">{game.playerCount}</dd>
			</div>
			<div class="kv-row">
				<dt class="label-micro">Period</dt>
				<dd class="font-mono">{g.period} / {g.options.num_periods}</dd>
			</div>
			{#if g.state === 'running'}
				<div class="kv-row">
					<dt class="label-micro">Timer</dt>
					<dd class="font-mono {seconds !== null && seconds <= 10 ? 'font-bold text-danger' : ''}">
						{#if seconds === null}
							<Icon name="pause" size={14} class="inline text-text-muted" /> Paused
						{:else}
							{seconds}s
						{/if}
					</dd>
				</div>
				<div class="kv-row">
					<dt class="label-micro">Offers</dt>
					<dd>
						{#if hasSubmitted(me, g)}
							<span class="badge badge-success">Submitted</span>
						{:else}
							<span class="badge badge-warning">Pending</span>
						{/if}
					</dd>
				</div>
				<div class="kv-row">
					<dt class="label-micro">Forecast load</dt>
					<dd class="font-mono text-info">{mw(g.load)}</dd>
				</div>
			{/if}
			{#if g.periods.length}
				<div class="kv-row">
					<dt class="label-micro">Last load</dt>
					<dd class="font-mono">{mw(g.periods.at(-1)?.load)}</dd>
				</div>
			{/if}
		</dl>
	</section>
</aside>
