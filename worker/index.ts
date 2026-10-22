import * as v from 'valibot';
import { NewMarket } from '../shared/schema';
import { createAdminToken, isPassword, verifyAdminToken } from './auth';
import type { Env } from './env';

export { MarketRegistry } from './registry';
export { MarketRoom } from './room';

const Login = v.object({ password: v.string() });

const status = (code: number) => new Response(null, { status: code });

async function body<T extends v.GenericSchema>(request: Request, schema: T) {
	const result = v.safeParse(schema, await request.json().catch(() => null));
	return result.success ? result.output : null;
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const route = `${request.method} ${url.pathname}`;
		const isAdmin = () =>
			verifyAdminToken(request.headers.get('Authorization')?.slice(7), env.ADMIN_PASSWORD);

		if (route === 'GET /api/ws') {
			const market = url.searchParams.get('market');
			if (request.headers.get('Upgrade') !== 'websocket' || !market) return status(400);
			return env.MARKET_ROOM.getByName(market).fetch(request);
		}

		if (route === 'POST /api/login') {
			const login = await body(request, Login);
			if (!login || !(await isPassword(login.password, env.ADMIN_PASSWORD))) return status(401);
			return Response.json({ key: await createAdminToken(env.ADMIN_PASSWORD) });
		}

		if (route === 'GET /api/markets') {
			const markets = await env.MARKET_REGISTRY.getByName('global').list(
				await isAdmin(),
				url.searchParams.get('uin')
			);
			return Response.json(markets);
		}

		if (route === 'POST /api/markets') {
			if (!(await isAdmin())) return status(401);
			const market = await body(request, NewMarket);
			if (!market) return status(400);
			const created = await env.MARKET_ROOM.getByName(market.name).create(market.options);
			return status(created ? 201 : 409);
		}

		if (request.method === 'DELETE' && url.pathname.startsWith('/api/markets/')) {
			if (!(await isAdmin())) return status(401);
			const name = decodeURIComponent(url.pathname.slice('/api/markets/'.length));
			await env.MARKET_ROOM.getByName(name).destroy();
			return status(204);
		}

		return status(404);
	}
} satisfies ExportedHandler<Env>;
