# mineral-bridge-admin-dashboard

React + Vite + TypeScript starter following the structure of `selorg-admin-dashboard` in the Selorg Application reference. Includes a small sample feature demonstrating file and folder conventions, and the Mineral Bridge admin console.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Admin: http://localhost:5173. The browser calls `/v2`, `/admin`, and `/api` on the dashboard origin. The dev server proxies those paths to the Mineral Bridge API using `API_PORT` or `API_PROXY_TARGET` from `.env.local`. Those values are not part of the production bundle. For deployment, configure the hosting server to proxy the same paths to the API and serve `index.html` for SPA routes.

Features go in `src/modules/<feature>/{pages,components,hooks}`. Services go in `src/services/<feature>/`. Components use `.tsx` and optional `.module.css`; helpers and stores use `.ts`. App providers and routing live in `src/app/`.

Run `npm run typecheck` to check TypeScript. Dependencies must be installed in this repository first.

## Admin console

`/` opens the console. Sign in at `/signin` with any demo admin account (click one to fill it), then any 4-digit code. The role you pick decides which actions are unlocked.

| Path | Screen |
| --- | --- |
| `/signin` | Two-step sign-in (email or WhatsApp, then a 4-digit code) |
| `/<screen>` | `overview`, `orders`, `buy`, `sell`, `auctions`, `customers`, `support`, `notifications`, `catalogue`, `inventory`, `inspections`, `logistics`, `payments`, `refunds`, `documents`, `audit`, `settings` |
| `/<screen>/<order id>` | Buy order or sell request detail, opened from that screen |

How it is built:

- `src/modules/console/engine/` holds the console's business logic from the design: seed data, the buy/sell stage engine, permissions, and the builders that turn state into view models (each element's style comes with it, as drawn in the design). Modules load in order from `engine/index.ts`; later ones extend earlier builders.
- `src/modules/console/components/` and `pages/` are the React components that render those view models. Static styles are CSS modules; the engine's dynamic styles (pills, active tabs, table grids) go through `src/lib/sx.ts`.
- `src/layouts/ConsoleLayout/` holds `ConsoleRoot` (data loading, theme, breakpoint, toasts) and `ConsoleLayout` (sidebar, header, drawer, sign-in guard).
- State: UI state, including the current screen, is in the Zustand store `src/store/consoleStore.ts`; the URL mirrors the screen. Records are loaded through `src/services/console` into TanStack Query.
- Data: the console runs on a seeded sample data set (Nigeria / pan-Africa) built in the browser. Operator actions edit it in memory and reset on reload. Replace `getConsoleDb()` in `src/services/console/consoleService.ts` with `apiRequest` calls when the service exposes these records.
- Uploading an `.xlsx` master sheet loads SheetJS from `cdn.sheetjs.com` on demand. CSV uploads need nothing extra.
- Theme choice is saved in `localStorage` (`mb4-theme`). Below 1280px the sidebar collapses to icons.

## Sample files

The sample feature reads `GET /api/samples` from the service. Start the service before using the sample screens. Open `/samples`.
