<script lang="ts">
	import { GEN_PRESETS, PAYMENT_METHODS } from '../../shared/config';
	import Icon from '../components/Icon.svelte';
	import { plural } from '../lib/format';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';

	const options = $derived(game.state.options);
	const steps = $derived([
		[
			'Your portfolio',
			`You own ${plural(GEN_PRESETS[options.gen_preset].units.length, 'generator')} with different capacities and costs.`
		],
		['Submit offers', 'Set a price ($/MWh) for each generator before the timer runs out.'],
		[
			'Market clearing',
			'Offers are dispatched cheapest-first until demand is met. The last accepted offer sets the clearing price.'
		],
		[
			'Earning profit',
			`${PAYMENT_METHODS[options.payment_method].description} Profit is revenue minus production cost.`
		]
	]);
</script>

<div class="flex max-w-2xl flex-col gap-6">
	<div class="flex items-center gap-3 rounded-lg border border-success/20 bg-success-bg px-5 py-4">
		<span class="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
			<Icon name="check" size={20} />
		</span>
		<div>
			<p class="text-sm font-semibold">You're in!</p>
			<p class="text-sm text-text-muted">Waiting for the instructor to start the game…</p>
		</div>
	</div>

	<section class="card border-t-3 border-t-gold">
		<h3 class="card-header">Players joined</h3>
		<div class="card-body">
			<ul class="flex flex-wrap gap-2.5">
				{#each Object.keys(game.state.players) as name (name)}
					<li
						class="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-cream px-3 py-1.5 text-sm font-medium"
					>
						{name}
						{#if name === session.name}<span class="text-xs text-text-muted">(you)</span>{/if}
					</li>
				{/each}
			</ul>
			<p class="mt-3 text-xs text-text-muted">
				{plural(game.playerCount, 'player')} of {options.max_participants} max
			</p>
		</div>
	</section>

	<section class="card border-t-3 border-t-maroon">
		<h3 class="card-header">How it works</h3>
		<ol class="card-body flex flex-col gap-4 text-sm text-text-muted">
			{#each steps as [title, text], i (title)}
				<li class="flex gap-3">
					<span
						class="flex size-6 shrink-0 items-center justify-center rounded-full bg-maroon text-xs font-bold text-text-inverse"
					>
						{i + 1}
					</span>
					<p><strong class="text-text-primary">{title}</strong> — {text}</p>
				</li>
			{/each}
			<li class="border-t border-border-light pt-3">
				<strong class="text-gold">Tip:</strong> Offer low to guarantee dispatch, or high for more profit
				per MWh, at the risk of not being selected.
			</li>
		</ol>
	</section>

	<button class="btn btn-secondary btn-sm self-center" onclick={() => session.leave()}>
		Leave market
	</button>
</div>
