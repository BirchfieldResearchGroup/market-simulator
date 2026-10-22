<script lang="ts">
	import Modal from './Modal.svelte';

	let {
		title,
		message,
		confirmLabel,
		onconfirm,
		oncancel
	}: {
		title: string;
		message: string;
		confirmLabel: string;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();
</script>

<Modal {title} size="sm" onclose={oncancel}>
	<p class="text-sm text-text-secondary">{message}</p>
	{#snippet footer()}
		<button class="btn btn-secondary" onclick={oncancel}>Cancel</button>
		<button class="btn btn-danger" onclick={onconfirm}>{confirmLabel}</button>
	{/snippet}
</Modal>
