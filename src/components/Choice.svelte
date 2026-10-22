<script lang="ts" generics="T extends string">
	let {
		label,
		options,
		value = $bindable()
	}: { label: string; options: { value: T; label: string; hint?: string }[]; value?: T } = $props();

	const id = $props.id();
</script>

<div>
	<span class="form-label" {id}>{label}</span>
	<div
		role="radiogroup"
		aria-labelledby={id}
		class="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2"
	>
		{#each options as option (option.value)}
			<button
				type="button"
				role="radio"
				class="choice"
				aria-checked={value === option.value}
				onclick={() => (value = option.value)}
			>
				<span class="font-semibold">{option.label}</span>
				{#if option.hint}<span class="font-mono text-micro text-text-muted">{option.hint}</span
					>{/if}
			</button>
		{/each}
	</div>
</div>
