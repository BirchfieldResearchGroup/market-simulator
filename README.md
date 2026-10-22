# Power Market Simulator

Classroom electricity market. Students own generator portfolios and submit price offers each period; the market clears by merit order. Rules and economics are in [docs/GAME_GUIDE.md](docs/GAME_GUIDE.md).

## Develop

```bash
npm install
cp .dev.vars.example .dev.vars   # set ADMIN_PASSWORD
npm run dev                      # app + Worker + Durable Objects on one local server
```

| Command            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `npm run check`    | Type-check the app and the Worker              |
| `npm run lint`     | ESLint and Prettier                            |
| `npm run format`   | Apply Prettier                                 |
| `npm test`         | Game engine unit tests                         |
| `npm run test:e2e` | Browser tests against a local production build |

## Deploy

GitHub Actions deploys `main` after all tests pass, using the repository secrets `CLOUDFLARE_API_TOKEN` (account-owned token with Workers edit access) and `CLOUDFLARE_ACCOUNT_ID`.

Set the instructor password once:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

## Layout

| Path      | Contents                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| `shared/` | Types, presets, option limits and message schemas used by both sides                                       |
| `worker/` | API router, `MarketRoom` (one Durable Object per market), `MarketRegistry` (market list), pure game engine |
| `src/`    | Svelte single-page app: `admin/`, `player/`, shared `components/`, `lib/` state and API                    |

Each market's Durable Object keeps one alarm: the next auto-advance while a game runs, otherwise deletion after 48 hours without activity.
