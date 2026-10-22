<script lang="ts">
	import { hasSubmitted } from '../../shared/game';
	import Icon from '../components/Icon.svelte';
	import { mw, price } from '../lib/format';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';

	const g = $derived(game.state);
	const gens = $derived(Object.values(g.gens));
	const submitted = $derived(hasSubmitted(g.players[session.name], g));

	let drafts = $state<Record<string, number | null>>({});
	let draftPeriod = 0;
	let sent = $state(-1);
	const busy = $derived(sent === session.revision);

	$effect.pre(() => {
		if (g.period === draftPeriod) return;
		draftPeriod = g.period;
		drafts = Object.fromEntries(gens.map((gen) => [gen.id, gen.offer]));
	});

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const cap = g.options.max_offer_price;
		const offers = Object.fromEntries(
			gens.map((gen) => [gen.id, Math.min(cap, Math.max(0, drafts[gen.id] ?? gen.offer))])
		);
		drafts = { ...offers };
		if (session.send({ type: 'submitOffers', period: g.period, offers })) sent = session.revision;
		else session.notice = 'Not connected. Your offers were not sent.';
	}
</script>

<form class="card" aria-label="Your generators" onsubmit={submit}>
	<h3 class="card-header flex items-center justify-between gap-3">
		<span>Generators</span>
		<button
			class="btn btn-sm {submitted
				? 'border-success bg-success text-text-inverse'
				: 'btn-primary'} tracking-normal normal-case"
			disabled={busy}
		>
			<Icon name="check" size={14} />
			{busy ? 'Sending…' : submitted ? 'Update offers' : 'Submit offers'}
		</button>
	</h3>
	<p
		class="border-b border-border-light px-4 py-2.5 text-sm {submitted
			? 'bg-success-bg text-success'
			: 'bg-gold-faint text-text-secondary'}"
		role="status"
	>
		{submitted
			? 'Offers submitted — you can update them until the period clears.'
			: `Set an offer for each generator ($0–${g.options.max_offer_price}/MWh).`}
	</p>
	<div class="overflow-x-auto">
		<table>
			<thead>
				<tr><th>Unit</th><th>Capacity</th><th>Cost</th><th>Offer ($/MWh)</th></tr>
			</thead>
			<tbody>
				{#each gens as gen (gen.id)}
					<tr>
						<td>{gen.id}</td>
						<td>{mw(gen.capacity)}</td>
						<td>{price(gen.cost)}</td>
						<td>
							<input
								class="form-input w-24 px-2 py-1 font-mono"
								type="number"
								min="0"
								max={g.options.max_offer_price}
								step="any"
								aria-label="Offer for {gen.id}"
								bind:value={drafts[gen.id]}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</form>
