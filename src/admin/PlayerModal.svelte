<script lang="ts">
	import ConfirmDialog from '../components/ConfirmDialog.svelte';
	import Modal from '../components/Modal.svelte';
	import { money, mw, price, tone } from '../lib/format';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';

	let { player: name, onclose }: { player: string; onclose: () => void } = $props();

	const g = $derived(game.state);
	const player = $derived(g.players[name]);
	const gens = $derived(Object.values(g.gens).filter((gen) => gen.owner === name));
	const online = $derived(!!g.clients?.includes(name));
	let amount = $state<number | null>(null);
	let kicking = $state(false);

	$effect(() => {
		if (!player) onclose();
	});

	const reward = (value: number) =>
		session.send({ type: 'rewardPlayer', player: name, amount: value });

	function kick() {
		session.send({ type: 'kickPlayer', player: name });
		onclose();
	}
</script>

<Modal title={name} subtitle={player ? `UIN ${player.uin}` : undefined} size="lg" {onclose}>
	<div class="mb-5 flex flex-wrap items-center justify-between gap-4">
		<span class="flex items-center gap-2 text-sm text-text-muted">
			<span class="dot" class:dot-online={online}></span>{online ? 'Online' : 'Offline'}
		</span>
		{#if game.active}
			<span class="font-mono text-2xl font-bold {tone(player?.money)}"
				>{money(player?.money, true)}</span
			>
		{/if}
	</div>

	{#if game.active}
		<form
			class="mb-5 flex flex-wrap items-center gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				if (amount) reward(amount);
				amount = null;
			}}
		>
			<input
				class="form-input w-28 font-mono"
				type="number"
				step="any"
				placeholder="Amount"
				aria-label="Balance adjustment"
				bind:value={amount}
			/>
			<button class="btn btn-primary btn-sm">Adjust balance</button>
			{#each [100, 500, -100] as preset (preset)}
				<button
					type="button"
					class="btn btn-secondary btn-sm font-mono"
					onclick={() => reward(preset)}
				>
					{money(preset, true)}
				</button>
			{/each}
		</form>
	{:else if g.state === 'forming'}
		<button class="btn btn-danger btn-sm mb-5" onclick={() => (kicking = true)}>
			Remove from game
		</button>
	{/if}

	{#if gens.length}
		<h3 class="label-micro mb-2">Generators</h3>
		<div class="mb-5 overflow-x-auto rounded border border-border-light">
			<table>
				<thead><tr><th>Unit</th><th>Capacity</th><th>Cost</th><th>Offer</th></tr></thead>
				<tbody>
					{#each gens as gen (gen.id)}
						<tr>
							<td>{gen.id}</td>
							<td>{mw(gen.capacity)}</td>
							<td>{price(gen.cost)}</td>
							<td>{price(gen.offer)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if g.periods.length}
		<h3 class="label-micro mb-2">Period history</h3>
		<div class="max-h-72 overflow-auto rounded border border-border-light">
			<table>
				<thead>
					<tr
						><th>#</th><th>Load</th><th>Price</th><th>Revenue</th><th>Profit</th><th>Balance</th
						></tr
					>
				</thead>
				<tbody>
					{#each g.periods as period (period.number)}
						{@const result = period.players[name]}
						<tr>
							<td>{period.number}</td>
							<td>{mw(period.load)}</td>
							<td>{money(period.marginal_cost)}</td>
							<td>{money(result?.revenue)}</td>
							<td class={tone(result?.profit)}>{money(result?.profit, true)}</td>
							<td>{money(result?.money)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</Modal>

{#if kicking}
	<ConfirmDialog
		title="Remove player"
		message="Remove {name} from the game? They will be disconnected."
		confirmLabel="Remove"
		onconfirm={kick}
		oncancel={() => (kicking = false)}
	/>
{/if}
