<script lang="ts">
	import type { Snippet } from 'svelte';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';
	import Screen from './Screen.svelte';

	let { children }: { children: Snippet } = $props();
</script>

{#if session.error}
	<Screen icon="warning" title="Disconnected" message={session.error}>
		<button class="btn btn-primary" onclick={() => session.leave()}>Back to markets</button>
	</Screen>
{:else if session.status === 'connecting' || game.state.state === 'uninitialized'}
	<Screen busy title="Joining {session.market}" message="Establishing connection…" />
{:else if session.stalled}
	<Screen busy title="Reconnecting to {session.market}" message="Connection lost. Retrying…">
		<button class="btn btn-secondary" onclick={() => session.leave()}>Back to markets</button>
	</Screen>
{:else}
	{#if session.status === 'reconnecting'}
		<div class="alert mb-4" role="status">
			<span class="spinner spinner-sm"></span>Reconnecting…
		</div>
	{/if}
	{@render children()}
{/if}
