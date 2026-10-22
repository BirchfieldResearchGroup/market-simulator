<script lang="ts">
	import * as v from 'valibot';
	import { DEFAULT_OPTIONS } from '../../shared/config';
	import { NewMarket, type GameOptions } from '../../shared/schema';
	import Choice from '../components/Choice.svelte';
	import Modal from '../components/Modal.svelte';
	import { createMarket } from '../lib/api.svelte';
	import { duration } from '../lib/format';
	import OptionsForm from './OptionsForm.svelte';

	const LENGTHS = {
		quick: { label: 'Quick', max_participants: 4, num_periods: 12, auto_advance_time: 60 },
		standard: { label: 'Standard', max_participants: 6, num_periods: 24, auto_advance_time: 180 },
		extended: { label: 'Extended', max_participants: 10, num_periods: 48, auto_advance_time: 120 }
	};
	type Length = keyof typeof LENGTHS;

	let { onclose, oncreated }: { onclose: () => void; oncreated: (name: string) => void } = $props();

	const id = $props.id();
	let name = $state('');
	let options = $state<GameOptions>({ ...DEFAULT_OPTIONS });
	let error = $state('');
	let busy = $state(false);

	const FIELDS = ['max_participants', 'num_periods', 'auto_advance_time'] as const;

	const length = $derived(
		(Object.keys(LENGTHS) as Length[]).find((key) =>
			FIELDS.every((field) => LENGTHS[key][field] === options[field])
		)
	);

	function applyLength(key: Length | undefined) {
		if (key) for (const field of FIELDS) options[field] = LENGTHS[key][field];
	}

	async function create(event: SubmitEvent) {
		event.preventDefault();
		const market = v.safeParse(NewMarket, { name, options: $state.snapshot(options) });
		if (!market.success) {
			error =
				'Use letters, numbers, spaces, hyphens or underscores for the name, and valid settings.';
			return;
		}
		busy = true;
		const status = await createMarket(market.output.name, market.output.options).catch(() => 0);
		busy = false;
		if (status === 201) oncreated(market.output.name);
		else
			error =
				status === 409 ? 'A market with that name already exists.' : 'Could not create the market.';
	}
</script>

<Modal title="Create market" size="lg" {onclose}>
	<form {id} class="flex flex-col gap-5" onsubmit={create}>
		{#if error}<p class="alert" role="alert">{error}</p>{/if}
		<label>
			<span class="form-label">Market name</span>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="form-input"
				bind:value={name}
				maxlength={40}
				autocomplete="off"
				placeholder="e.g. Spring 2026 Section 501"
				required
				autofocus
			/>
		</label>
		<Choice
			label="Session length"
			options={(Object.keys(LENGTHS) as Length[]).map((key) => ({
				value: key,
				label: LENGTHS[key].label,
				hint: `${LENGTHS[key].num_periods} × ${duration(LENGTHS[key].auto_advance_time)}`
			}))}
			bind:value={() => length, applyLength}
		/>
		<OptionsForm bind:options />
	</form>
	{#snippet footer()}
		<span class="mr-auto text-sm text-text-muted">
			Estimated <strong class="font-display text-lg text-maroon">
				{duration(options.num_periods * options.auto_advance_time)}
			</strong>
		</span>
		<button class="btn btn-secondary" onclick={onclose}>Cancel</button>
		<button class="btn btn-primary" form={id} disabled={busy}>Create market</button>
	{/snippet}
</Modal>
