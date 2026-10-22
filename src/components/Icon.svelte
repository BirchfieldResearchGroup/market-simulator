<script lang="ts">
	import { ICONS, type IconName } from '../lib/icons';

	let {
		name,
		size = 16,
		class: className = ''
	}: { name: IconName; size?: number; class?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 16 16"
	fill="currentColor"
	class="shrink-0 {className}"
	aria-hidden="true"
>
	{#each ICONS[name] as d (d)}
		<path {d} />
	{/each}
</svg>
