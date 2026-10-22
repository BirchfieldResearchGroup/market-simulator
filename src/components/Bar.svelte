<script lang="ts">
	let {
		value,
		label,
		fill = 'bg-gradient-to-r from-maroon to-gold'
	}: { value: number; label: string; fill?: string } = $props();

	const fraction = $derived(Math.min(1, Math.max(0, value || 0)));
</script>

<div
	class="h-1.5 overflow-hidden rounded-full bg-border-light"
	role="progressbar"
	aria-label={label}
	aria-valuenow={Math.round(fraction * 100)}
	aria-valuemin={0}
	aria-valuemax={100}
>
	<div
		class="h-full origin-left rounded-full transition-transform duration-300 {fill}"
		style:transform="scaleX({fraction})"
	></div>
</div>
