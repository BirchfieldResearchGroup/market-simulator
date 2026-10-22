import { emptyGame, type GameView, type Period, type ServerMessage } from '../../shared/game';
import { now } from './clock';

type Snapshot = GameView & { periods: Period[] };
type StateMessage = Extract<ServerMessage, { type: 'state' }>;

const initial = (): Snapshot => ({ ...emptyGame(), load: null, now: 0, periods: [] });

class Game {
	state = $state<Snapshot>(initial());
	playerCount = $derived(Object.keys(this.state.players).length);
	active = $derived(this.state.state === 'running' || this.state.state === 'completed');
	#offset = 0;

	get secondsLeft(): number | null {
		const { state, auto_advance, advance_time } = this.state;
		if (state !== 'running' || !auto_advance) return null;
		return Math.max(0, Math.ceil((advance_time - now() - this.#offset) / 1000));
	}

	apply({ state, periods, cleared }: StateMessage) {
		this.#offset = state.now - Date.now();
		const previous = this.state.periods;
		this.state = {
			...state,
			periods:
				periods ??
				(cleared ? [...previous.filter((p) => p.number !== cleared.number), cleared] : previous)
		};
	}

	setClients(clients: string[]) {
		this.state.clients = clients;
	}

	reset() {
		this.state = initial();
	}
}

export const game = new Game();
