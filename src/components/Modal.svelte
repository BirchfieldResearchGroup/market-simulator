<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	const WIDTHS = { sm: '26rem', md: '38rem', lg: '48rem' };

	let {
		title,
		subtitle,
		size = 'md',
		onclose,
		children,
		footer
	}: {
		title: string;
		subtitle?: string;
		size?: keyof typeof WIDTHS;
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
	} = $props();

	const id = $props.id();
	let dialog: HTMLDialogElement;
	let pressedBackdrop = false;

	$effect(() => dialog.showModal());
</script>

<dialog
	bind:this={dialog}
	class="modal"
	style:--modal-width={WIDTHS[size]}
	aria-labelledby={id}
	{onclose}
	onpointerdown={(e) => (pressedBackdrop = e.target === dialog)}
	onclick={(e) => pressedBackdrop && e.target === dialog && dialog.close()}
>
	<header class="flex items-start justify-between gap-4 border-b border-border-light px-5 py-4">
		<div class="min-w-0">
			<h2 {id} class="truncate text-xl">{title}</h2>
			{#if subtitle}<p class="label-micro mt-0.5">{subtitle}</p>{/if}
		</div>
		<button class="icon-btn -mt-1 -mr-2" aria-label="Close" onclick={() => dialog.close()}>
			<Icon name="close" size={18} />
		</button>
	</header>
	<div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">{@render children()}</div>
	{#if footer}
		<footer
			class="flex flex-wrap items-center justify-end gap-3 border-t border-border-light px-5 py-3"
		>
			{@render footer()}
		</footer>
	{/if}
</dialog>
