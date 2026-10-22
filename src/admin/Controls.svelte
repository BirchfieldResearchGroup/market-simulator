<script lang="ts">
	import { PAYMENT_METHODS } from '../../shared/config';
	import { hasSubmitted } from '../../shared/game';
	import type { ClientMessage } from '../../shared/schema';
	import Bar from '../components/Bar.svelte';
	import Icon from '../components/Icon.svelte';
	import PhaseBadge from '../components/PhaseBadge.svelte';
	import Ring from '../components/Ring.svelte';
	import Stat from '../components/Stat.svelte';
	import { average, duration, money, mw } from '../lib/format';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';

	let { onsettings }: { onsettings: () => void } = $props();

	const g = $derived(game.state);
	const prices = $derived(g.periods.map((p) => p.marginal_cost));
	const capacity = $derived(Object.values(g.gens).reduce((sum, gen) => sum + gen.capacity, 0));
	const submitted = $derived(Object.values(g.players).filter((p) => hasSubmitted(p, g)).length);
	const seconds = $derived(game.secondsLeft);
	const urgent = $derived(seconds !== null && seconds <= 10);
	const heading = $derived(
		g.state === 'forming'
			? ['Lobby', `${game.playerCount} / ${g.options.max_participants} players`]
			: g.state === 'running'
				? ['Live', `Period ${g.period} of ${g.options.num_periods}`]
				: ['Complete', `${g.options.num_periods} periods played`]
	);

	let sent = $state(-1);
	const busy = $derived(sent === session.revision);

	function act(message: ClientMessage) {
		if (session.send(message)) sent = session.revision;
	}
</script>

<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border-light pb-3">
	<div class="flex min-w-0 items-center gap-3">
		<span class="h-5 w-1 shrink-0 rounded-full bg-gradient-to-b from-maroon to-gold"></span>
		<h2 class="truncate text-xl">{session.market}</h2>
		<button class="icon-btn" aria-label="Market settings" onclick={onsettings}>
			<Icon name="gear" />
		</button>
	</div>
	<PhaseBadge phase={g.state} />
</header>

<section class="card">
	<div
		class="flex items-center justify-between gap-4 bg-maroon px-4 py-2 text-xs text-text-inverse/80"
	>
		<span class="flex items-center gap-2 font-bold tracking-brand uppercase">
			<span class="dot {g.state === 'running' ? 'animate-pulse bg-success' : 'bg-gold'}"></span>
			{heading[0]}
		</span>
		<span class="font-mono">{heading[1]}</span>
	</div>

	<div class="flex flex-wrap items-center gap-4 p-4">
		{#if g.state === 'forming'}
			<Ring value={game.playerCount / g.options.max_participants} color="var(--color-gold)">
				<span class="text-lg font-bold">{game.playerCount}</span>
				<span class="text-xs text-text-muted">/{g.options.max_participants}</span>
			</Ring>
			<div class="flex min-w-40 flex-1 flex-col gap-2">
				<p class="font-display text-lg font-semibold">Players joining</p>
				<Bar value={game.playerCount / g.options.max_participants} label="Players joined" />
			</div>
			<button
				class="btn btn-primary"
				disabled={game.playerCount === 0 || busy}
				onclick={() => act({ type: 'startGame' })}
			>
				<Icon name="play" /> Start
			</button>
		{:else if g.state === 'running'}
			<Ring
				value={seconds === null ? 0 : seconds / g.options.auto_advance_time}
				color={urgent ? 'var(--color-danger)' : undefined}
			>
				{#if seconds === null}
					<Icon name="pause" class="text-text-muted" />
					<span class="sr-only">Paused</span>
				{:else}
					<span class="text-sm font-bold {urgent ? 'text-danger' : 'text-maroon'}">{seconds}s</span>
				{/if}
			</Ring>
			<div class="flex min-w-40 flex-1 flex-col gap-3">
				<div>
					<div class="mb-1.5 flex items-baseline justify-between">
						<span class="font-display text-lg font-semibold">Period {g.period}</span>
						<span class="font-mono text-xs text-text-muted">
							{Math.round((g.period / g.options.num_periods) * 100)}%
						</span>
					</div>
					<Bar value={g.period / g.options.num_periods} label="Period progress" />
				</div>
				<div class="rounded border border-border-light bg-cream px-3 py-2">
					<div class="mb-1 flex justify-between text-xs">
						<span class="font-semibold text-text-muted">Offers submitted</span>
						<span class="font-mono font-bold">{submitted} / {game.playerCount}</span>
					</div>
					<Bar
						value={submitted / game.playerCount}
						label="Offers submitted"
						fill={submitted === game.playerCount ? 'bg-success' : 'bg-maroon'}
					/>
				</div>
			</div>
			<div
				class="flex flex-col items-end gap-3 max-sm:w-full max-sm:flex-row max-sm:justify-between"
			>
				<label class="toggle">
					<input
						type="checkbox"
						role="switch"
						checked={g.auto_advance}
						onchange={() => act({ type: 'setAutoAdvance', enabled: !g.auto_advance })}
					/>
					Auto
				</label>
				<button
					class="btn btn-primary btn-sm"
					disabled={busy}
					onclick={() => act({ type: 'advancePeriod' })}
				>
					Advance <Icon name="next" size={12} />
				</button>
			</div>
		{:else}
			<span class="flex size-10 items-center justify-center rounded-full bg-gold-faint text-gold">
				<Icon name="check-circle" size={20} />
			</span>
			<div>
				<p class="text-sm font-semibold">Game complete</p>
				<p class="text-xs text-text-muted">All periods played. Review the results below.</p>
			</div>
		{/if}
	</div>

	{#if game.active}
		<div
			class="grid grid-cols-1 divide-border-light border-t border-border-light bg-cream sm:grid-cols-3 sm:divide-x"
		>
			<Stat
				label="Clearing price"
				value={money(prices.at(-1))}
				sub="avg {money(average(prices))} · peak {money(
					prices.length ? Math.max(...prices) : null
				)}"
			/>
			<Stat
				label={g.state === 'running' ? 'Forecast load' : 'Final load'}
				value={mw(g.load ?? g.periods.at(-1)?.load)}
				sub="of {mw(capacity)} capacity"
			/>
			{#if g.state === 'running'}
				<Stat
					label="Online"
					value="{g.clients?.length ?? 0} / {game.playerCount}"
					sub="{PAYMENT_METHODS[g.options.payment_method].short} · {duration(
						g.options.auto_advance_time
					)} timer"
				/>
			{:else}
				<Stat
					label="Players"
					value={String(game.playerCount)}
					sub={PAYMENT_METHODS[g.options.payment_method].label}
				/>
			{/if}
		</div>
	{/if}
</section>
