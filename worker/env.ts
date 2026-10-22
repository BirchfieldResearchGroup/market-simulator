import type { MarketRegistry } from './registry';
import type { MarketRoom } from './room';

export interface Env {
	MARKET_ROOM: DurableObjectNamespace<MarketRoom>;
	MARKET_REGISTRY: DurableObjectNamespace<MarketRegistry>;
	ADMIN_PASSWORD: string;
}
