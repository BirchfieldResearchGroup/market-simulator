<script lang="ts">
	import {
		GEN_PRESETS,
		LOAD_PROFILES,
		NUMBER_OPTIONS,
		PAYMENT_METHODS,
		type NumberOption
	} from '../../shared/config';
	import type { GameOptions } from '../../shared/schema';
	import Choice from '../components/Choice.svelte';
	import { plural } from '../lib/format';

	let { options = $bindable(), disabled = false }: { options: GameOptions; disabled?: boolean } =
		$props();

	const numbers = Object.keys(NUMBER_OPTIONS) as NumberOption[];

	function choices<T extends Record<string, { label: string }>>(
		record: T,
		hint?: (item: T[keyof T]) => string
	) {
		return (Object.keys(record) as (keyof T & string)[]).map((value) => ({
			value,
			label: record[value].label,
			hint: hint?.(record[value])
		}));
	}

	function clamp(key: NumberOption) {
		const { min, max } = NUMBER_OPTIONS[key];
		options[key] = Math.min(max, Math.max(min, Math.round(Number(options[key]) || min)));
	}
</script>

<fieldset {disabled} class="flex flex-col gap-5">
	<div class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
		{#each numbers as key (key)}
			{@const spec = NUMBER_OPTIONS[key]}
			<label>
				<span class="form-label">{spec.label}</span>
				<input
					class="form-input font-mono"
					type="number"
					min={spec.min}
					max={spec.max}
					step="1"
					bind:value={options[key]}
					onchange={() => clamp(key)}
				/>
				{#if 'hint' in spec}<span class="hint">{spec.hint}</span>{/if}
			</label>
		{/each}
	</div>
	<div>
		<Choice
			label="Payment method"
			options={choices(PAYMENT_METHODS, (method) => method.short)}
			bind:value={options.payment_method}
		/>
		<p class="hint">{PAYMENT_METHODS[options.payment_method].description}</p>
	</div>
	<Choice
		label="Generator portfolio"
		options={choices(GEN_PRESETS, (preset) => plural(preset.units.length, 'unit'))}
		bind:value={options.gen_preset}
	/>
	<Choice
		label="Demand profile"
		options={choices(LOAD_PROFILES)}
		bind:value={options.load_profile}
	/>
</fieldset>
