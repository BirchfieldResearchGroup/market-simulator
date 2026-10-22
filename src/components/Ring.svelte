<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		value,
		color = 'var(--color-maroon)',
		children
	}: { value: number; color?: string; children: Snippet } = $props();

	const percent = $derived(Math.min(100, Math.max(0, value * 100)));
</script>

<div class="relative size-16 shrink-0">
	<svg viewBox="0 0 64 64" class="size-16 -rotate-90" aria-hidden="true">
		<circle
			cx="32"
			cy="32"
			r="27"
			fill="none"
			stroke="var(--color-border-light)"
			stroke-width="3"
		/>
		<circle
			cx="32"
			cy="32"
			r="27"
			fill="none"
			stroke={color}
			stroke-width="3.5"
			stroke-linecap="round"
			pathLength="100"
			stroke-dasharray="{percent} 100"
			class="transition-[stroke-dasharray,stroke] duration-300"
		/>
	</svg>
	<div class="absolute inset-0 flex items-center justify-center font-mono">
		{@render children()}
	</div>
</div>
