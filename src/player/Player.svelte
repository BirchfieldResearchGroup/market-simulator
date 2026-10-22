<script lang="ts">
	import Chart from '../components/Chart.svelte';
	import Connection from '../components/Connection.svelte';
	import CsvButton from '../components/CsvButton.svelte';
	import MarketList from '../components/MarketList.svelte';
	import { playerSeries } from '../lib/chart';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';
	import Lobby from './Lobby.svelte';
	import Offers from './Offers.svelte';
	import Results from './Results.svelte';
	import Scorecard from './Scorecard.svelte';
	import Status from './Status.svelte';

	const series = $derived(playerSeries(session.name));
</script>

{#snippet history()}
	<Chart title="Your results by period" periods={game.state.periods} {series} hideMw />
{/snippet}

{#if !session.market}
	<div class="animate-in mx-auto max-w-2xl">
		<h2 class="mb-1 text-2xl">Available markets</h2>
		<p class="mb-5 text-sm text-text-muted">Join a market, or rejoin a game in progress.</p>
		<MarketList joinable />
	</div>
{:else}
	<Connection>
		<div class="grid items-start gap-8 md:grid-cols-[17.5rem_1fr]">
			<Status />
			<div class="stagger @container flex min-w-0 flex-col gap-6">
				{#if game.state.state === 'forming'}
					<Lobby />
				{:else}
					{#if game.state.state === 'completed'}<Results />{/if}
					<div class="grid items-start gap-6 @2xl:grid-cols-[1fr_16rem]">
						{#if game.state.state === 'running'}<Offers />{:else}{@render history()}{/if}
						<Scorecard />
					</div>
					{#if game.state.state === 'running'}{@render history()}{/if}
					<CsvButton />
				{/if}
			</div>
		</div>
	</Connection>
{/if}
