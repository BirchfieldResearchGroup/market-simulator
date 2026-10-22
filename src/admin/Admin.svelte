<script lang="ts">
	import Chart from '../components/Chart.svelte';
	import Connection from '../components/Connection.svelte';
	import CsvButton from '../components/CsvButton.svelte';
	import Screen from '../components/Screen.svelte';
	import { deleteMarket, pollMarkets } from '../lib/api.svelte';
	import { MARKET_SERIES } from '../lib/chart';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';
	import Controls from './Controls.svelte';
	import CreateModal from './CreateModal.svelte';
	import MarketSidebar from './MarketSidebar.svelte';
	import PlayerModal from './PlayerModal.svelte';
	import Players from './Players.svelte';
	import SettingsModal from './SettingsModal.svelte';

	const list = pollMarkets(15_000);
	let creating = $state(false);
	let configuring = $state(false);
	let inspecting = $state<string | null>(null);

	async function created(name: string) {
		creating = false;
		await list.refresh();
		session.join(name);
	}

	async function remove() {
		const market = session.market;
		configuring = false;
		session.leave();
		if (market) await deleteMarket(market);
		await list.refresh();
	}
</script>

<div class="grid items-start gap-6 md:grid-cols-[17rem_1fr]">
	<MarketSidebar
		markets={list.markets}
		onrefresh={list.refresh}
		oncreate={() => (creating = true)}
	/>
	<section class="min-w-0">
		{#if !session.market}
			<Screen
				icon="list"
				title="Select a market"
				message="Choose a market from the sidebar or create a new one."
			/>
		{:else}
			<Connection>
				<div class="stagger flex flex-col gap-6">
					<Controls onsettings={() => (configuring = true)} />
					<Players onselect={(name: string) => (inspecting = name)} />
					{#if game.active}
						<Chart title="Market history" periods={game.state.periods} series={MARKET_SERIES} />
						<CsvButton />
					{/if}
				</div>
			</Connection>
		{/if}
	</section>
</div>

{#if creating}
	<CreateModal onclose={() => (creating = false)} oncreated={created} />
{/if}
{#if configuring}
	<SettingsModal onclose={() => (configuring = false)} ondelete={remove} />
{/if}
{#if inspecting}
	<PlayerModal player={inspecting} onclose={() => (inspecting = null)} />
{/if}
