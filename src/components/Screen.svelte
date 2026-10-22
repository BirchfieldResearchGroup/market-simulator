<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconName } from '../lib/icons';
	import Icon from './Icon.svelte';

	let {
		title,
		message,
		icon,
		busy = false,
		children
	}: {
		title: string;
		message?: string;
		icon?: IconName;
		busy?: boolean;
		children?: Snippet;
	} = $props();
</script>

<div
	class="animate-in flex flex-col items-center px-6 py-14 text-center"
	role={busy ? 'status' : undefined}
>
	{#if busy}
		<div class="spinner mb-5"></div>
	{:else if icon}
		<div
			class="mb-5 flex size-12 items-center justify-center rounded-full bg-maroon-faint text-maroon"
		>
			<Icon name={icon} size={22} />
		</div>
	{/if}
	<h2 class="mb-2 text-2xl text-text-secondary">{title}</h2>
	{#if message}<p class="mb-6 max-w-sm text-sm text-text-muted">{message}</p>{/if}
	{@render children?.()}
</div>
