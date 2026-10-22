import { standings, type GameState, type GameView, type Period, type Role } from '../shared/game';
import { forecastLoad } from './engine';

const ownedBy = (game: GameState, name: string) => (id: string) => game.gens[id]?.owner === name;

export function viewFor(game: GameState, role: Role, name: string): GameView {
	const view = {
		...game,
		load: game.state === 'running' ? forecastLoad(game) : null,
		now: Date.now()
	};
	if (role === 'admin') return view;
	const owned = ownedBy(game, name);
	return {
		...view,
		players: Object.fromEntries(
			Object.entries(game.players).map(([key, player]) => [
				key,
				key === name ? { ...player, uin: '' } : { uin: '', money: 0, last_offer_time: 0 }
			])
		),
		gens: Object.fromEntries(Object.entries(game.gens).filter(([id]) => owned(id))),
		rank: standings(game.players).findIndex(([key]) => key === name) + 1
	};
}

export function periodFor(period: Period, game: GameState, role: Role, name: string): Period {
	if (role === 'admin') return period;
	const owned = ownedBy(game, name);
	const own = period.players[name];
	return {
		...period,
		players: own ? { [name]: own } : {},
		gens: Object.fromEntries(Object.entries(period.gens).filter(([id]) => owned(id)))
	};
}
