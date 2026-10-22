<script lang="ts">
	let {
		label,
		value,
		sub,
		tone = ''
	}: { label: string; value: string; sub?: string; tone?: string } = $props();
</script>

<div class="min-w-0 px-3 py-2 text-center">
	<div class="truncate font-mono text-lg leading-tight font-bold {tone || 'text-text-primary'}">
		{value}
	</div>
	<div class="label-micro mt-0.5">{label}</div>
	{#if sub}<div class="truncate font-mono text-micro text-text-muted">{sub}</div>{/if}
</div>
