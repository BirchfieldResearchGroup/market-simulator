<script lang="ts">
	import Admin from './admin/Admin.svelte';
	import Icon from './components/Icon.svelte';
	import Landing from './components/Landing.svelte';
	import { session } from './lib/session.svelte';
	import Player from './player/Player.svelte';

	session.restore();

	$effect(() => {
		if (!session.notice) return;
		const timer = setTimeout(() => (session.notice = null), 4000);
		return () => clearTimeout(timer);
	});
</script>

<a href="#main" class="skip-link">Skip to content</a>

<nav
	class="relative bg-gradient-to-br from-maroon to-maroon-dark text-text-inverse after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-gradient-to-r after:from-maroon-dark after:via-gold after:to-maroon-dark"
>
	<div class="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
		<a href="/" class="flex min-w-0 flex-col">
			<span class="font-display text-base font-bold sm:text-xl">Energy Market Simulator</span>
			<span class="hidden text-xs tracking-[0.1em] uppercase opacity-80 sm:block">
				Texas A&amp;M University
			</span>
		</a>
		{#if session.identity}
			<div class="flex shrink-0 items-center gap-3 text-sm sm:gap-4">
				<span class="flex items-center gap-2 opacity-90">
					<Icon name="user" class="max-sm:hidden" />
					<span class="max-w-24 truncate uppercase sm:max-w-60">{session.name}</span>
				</span>
				<button
					class="btn btn-sm border-text-inverse/20 bg-text-inverse/10 text-text-inverse hover:bg-text-inverse/20"
					onclick={() => session.logout()}>Log out</button
				>
			</div>
		{/if}
	</div>
</nav>

<main id="main" class="mx-auto max-w-[1440px] px-4 pt-8 pb-16 sm:px-6">
	{#if !session.identity}
		<Landing />
	{:else if session.identity.role === 'admin'}
		<Admin />
	{:else}
		<Player />
	{/if}
</main>

{#if session.notice}
	<div
		class="animate-in fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded bg-danger px-5 py-3 text-sm font-semibold text-text-inverse shadow-lg"
		role="alert"
	>
		{session.notice}
	</div>
{/if}
