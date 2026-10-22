<script lang="ts">
	import * as v from 'valibot';
	import { GameOptionsSchema } from '../../shared/schema';
	import ConfirmDialog from '../components/ConfirmDialog.svelte';
	import Icon from '../components/Icon.svelte';
	import Modal from '../components/Modal.svelte';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';
	import OptionsForm from './OptionsForm.svelte';

	let { onclose, ondelete }: { onclose: () => void; ondelete: () => void } = $props();

	const g = $derived(game.state);
	const editable = $derived(g.state === 'forming');
	let options = $state($state.snapshot(game.state.options));
	const dirty = $derived(JSON.stringify(options) !== JSON.stringify(g.options));
	let deleting = $state(false);
	let copied = $state(false);

	function save() {
		const snapshot = $state.snapshot(options);
		if (v.is(GameOptionsSchema, snapshot))
			session.send({ type: 'updateOptions', options: snapshot });
		else session.notice = 'Some settings are out of range.';
	}

	async function copyLink() {
		const url = `${location.origin}/?market=${encodeURIComponent(session.market ?? '')}`;
		await navigator.clipboard.writeText(url);
		copied = true;
	}
</script>

<Modal title={session.market ?? ''} subtitle="Market settings" size="lg" {onclose}>
	<section class="mb-6 flex flex-col gap-2 border-b border-border-light pb-5">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<label class="toggle">
				<input
					type="checkbox"
					role="switch"
					checked={g.visibility === 'public'}
					onchange={() =>
						session.send({
							type: 'setVisibility',
							visibility: g.visibility === 'public' ? 'unlisted' : 'public'
						})}
				/>
				Listed in the market browser
			</label>
			<button class="btn btn-secondary btn-sm" onclick={copyLink}>
				<Icon name="link" />
				{copied ? 'Link copied' : 'Copy join link'}
			</button>
		</div>
		<p class="hint">Unlisted markets are hidden from students; share the join link instead.</p>
	</section>

	{#if !editable}
		<p class="alert mb-5">Game settings are locked once the game starts.</p>
	{/if}
	<OptionsForm bind:options disabled={!editable} />

	{#snippet footer()}
		<button class="btn btn-danger mr-auto" onclick={() => (deleting = true)}>
			<Icon name="trash" /> Delete market
		</button>
		{#if editable}
			<button class="btn btn-primary" disabled={!dirty} onclick={save}>Save changes</button>
		{/if}
	{/snippet}
</Modal>

{#if deleting}
	<ConfirmDialog
		title="Delete market"
		message="Permanently delete {session.market} and all of its data? Connected students will be disconnected."
		confirmLabel="Delete market"
		onconfirm={ondelete}
		oncancel={() => (deleting = false)}
	/>
{/if}
