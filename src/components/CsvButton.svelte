<script lang="ts">
	import { downloadCsv } from '../lib/csv';
	import { game } from '../lib/game.svelte';
	import { session } from '../lib/session.svelte';
	import Icon from './Icon.svelte';
</script>

<button
	class="btn btn-secondary self-start"
	onclick={() => downloadCsv(game.state.periods, session.market ?? 'market')}
>
	<Icon name="download" /> Download CSV
</button>
