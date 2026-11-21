# mineral-bridge-admin-dashboard

React + Vite + TypeScript starter following the structure of `selorg-admin-dashboard` in the Selorg Application reference. Includes a small sample feature demonstrating file and folder conventions, and the Mineral Bridge admin console.

The dashboard dev server proxies `/v2`, `/admin`, and `/api` to the Mineral Bridge API. `API_BASE_URL` sets that origin. When it is unset, the default is `http://127.0.0.1:5001`. The value is read only by Vite and is not part of the production bundle. For deployment, configure the hosting server to proxy the same paths to the API and serve `index.html` for SPA routes.

The dev server starts even when the API is down and prints the commands below. A request then returns `503` `api/unavailable` with the same steps. If a different application is already listening on that origin, Vite exits and does not proxy to it. A Mineral Bridge API is recognized only when `GET /health` returns `200` `{"status":"ok","uptimeSeconds":<number>}` and `GET /v2/admin/me` with `X-Client: admin` returns `401` `{"code":"auth/session-expired"}`.

## Fresh clone

Node.js 20 or newer, npm, and Docker Desktop. Redis is not required. Leave `REDIS_URL` unset unless you are running more than one API process. The API does not open its port until MongoDB is connected, so start Mongo first.

From the repository root in PowerShell:

```powershell
cd mineralbridge-backend
Copy-Item .env.example .env
docker compose up -d --wait mongo
npm install
npm run seed
npm run dev
```

The API listens on `PORT` from `.env`. The example sets `5001`, which is also the code default: http://127.0.0.1:5001 . Health: `/health`. Readiness (Mongo): `/ready`. Docs: `/docs`.

In a second terminal:

```powershell
cd MB-Dashboard
Copy-Item .env.example .env.local
npm install
npm run dev
```

Dashboard: http://127.0.0.1:5173 . The dev server binds that IPv4 address so Windows does not send the browser to an IPv6-only listener. Change `API_BASE_URL` in `.env.local` when the API is not at `http://127.0.0.1:5001`. A shell variable of the same name overrides the file.

CMD, each window starting at the repository root, uses `copy` instead of `Copy-Item`:

```bat
cd mineralbridge-backend
copy .env.example .env
docker compose up -d --wait mongo
npm install
npm run seed
npm run dev
```

```bat
cd MB-Dashboard
copy .env.example .env.local
npm install
npm run dev
```

If PowerShell blocks `npm.ps1`, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use CMD.

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
