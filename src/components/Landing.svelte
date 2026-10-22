<script lang="ts">
	import * as v from 'valibot';
	import { PlayerIdentity } from '../../shared/schema';
	import { login } from '../lib/api.svelte';
	import { session } from '../lib/session.svelte';
	import MarketList from './MarketList.svelte';

	let instructor = $state(false);
	let name = $state('');
	let uin = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	async function signIn(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		if (!instructor) {
			const identity = v.safeParse(PlayerIdentity, { name, uin });
			if (identity.success) session.signIn({ role: 'participant', ...identity.output });
			else
				error =
					'Names use letters, numbers, spaces, hyphens or underscores (20 max). UINs are letters and numbers.';
			return;
		}
		busy = true;
		try {
			const key = await login(password);
			if (key) session.signIn({ role: 'admin', key });
			else error = 'Incorrect password.';
		} catch {
			error = 'Could not reach the server. Try again.';
		}
		busy = false;
	}
</script>

<div class="animate-in mx-auto grid max-w-5xl items-start gap-8 md:grid-cols-[23rem_1fr]">
	<form class="card p-6" onsubmit={signIn}>
		<h2 class="mb-1 text-xl">{instructor ? 'Instructor sign in' : 'Sign in'}</h2>
		<p class="mb-5 text-sm text-text-muted">
			{instructor ? 'Enter the instructor password.' : 'Enter your name and UIN to get started.'}
		</p>
		{#if error}<p class="alert mb-4" role="alert">{error}</p>{/if}
		{#if instructor}
			<label class="mb-5 block">
				<span class="form-label">Password</span>
				<input class="form-input" type="password" bind:value={password} required />
			</label>
		{:else}
			<label class="mb-4 block">
				<span class="form-label">Name</span>
				<input
					class="form-input"
					bind:value={name}
					maxlength={20}
					autocomplete="off"
					placeholder="e.g. Jordan Smith"
					required
				/>
			</label>
			<label class="mb-5 block">
				<span class="form-label">UIN</span>
				<input
					class="form-input"
					bind:value={uin}
					maxlength={20}
					autocomplete="off"
					placeholder="e.g. 123456789"
					required
				/>
			</label>
		{/if}
		<button class="btn btn-primary w-full" disabled={busy}
			>{busy ? 'Signing in…' : 'Sign in'}</button
		>
		<button
			type="button"
			class="mt-4 w-full text-center text-xs text-text-muted hover:text-maroon"
			onclick={() => {
				instructor = !instructor;
				error = '';
			}}
		>
			{instructor ? 'Student sign in' : 'Instructor sign in'}
		</button>
	</form>

	<section>
		<h2 class="mb-1 text-xl">Available markets</h2>
		<p class="mb-4 text-sm text-text-muted">Sign in to join a market.</p>
		<MarketList />
	</section>
</div>
