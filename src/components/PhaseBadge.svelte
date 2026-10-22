<script lang="ts">
	import type { Phase } from '../../shared/game';
	import { PHASES } from '../lib/format';

	let { phase, short = false }: { phase: Phase; short?: boolean } = $props();
</script>

<span class="badge {PHASES[phase].badge}">{short ? PHASES[phase].short : PHASES[phase].label}</span>
