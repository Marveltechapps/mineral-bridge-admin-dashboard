<<<<<<< HEAD
# Mineral Bridge — Operations Console (React)

React + TypeScript implementation of the **Mineral Bridge Admin Dashboard** design
(`Mineral Bridge Admin Dashboard.dc.html` from Claude Design). The original design
bundle is kept in [`design-src/`](design-src/) and is the reference for every
visual test in this repository.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5190
```

Sign in with one of the staff test accounts the design exposes on the sign-in
screen (**Show staff test credentials → click to fill**), then press
**Verify and open console** on the 2FA step (the code is pre-filled).

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 5190 |
| `npm run build` | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | Serve the production build on port 4173 |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint (typescript-eslint, react-hooks) |
| `npm test` | Vitest + React Testing Library unit/component tests |
| `npm run test:e2e` | Playwright end-to-end tests at 5 viewports (uses local Chrome) |

Visual-fidelity tooling (needs the dev server **and** the design server running):

```bash
node tests/visual/serve-design.mjs          # original design on :5181
node tests/visual/compare.mjs                 # pixel-diff every screen vs the original (1440×900)
node tests/visual/compare.mjs --dark          # same, dark theme
node tests/visual/responsive.mjs              # overflow audit + screenshots at 1440/1366/768/390/320
```

## Stack

React 18.3 · TypeScript 5.6 (strict) · Vite 5 · React Router 6 (data router, lazy-loaded routes) · TanStack React Query 5 ·
CSS Modules + design tokens · Vitest + React Testing Library · Playwright.
No UI or icon libraries: the design's own icon geometry (`src/constants/icons.ts`)
and its embedded font files (Plus Jakarta Sans, Poppins — `src/assets/fonts/`) are used.

## Architecture

The layout follows the `mineral-bridge-admin-dashboard` starter: features go in
`src/modules/<feature>/{pages,components,hooks}`, services in `src/services/<feature>/`,
shared types in `src/types/<feature>.ts`, and app providers and routing in `src/app/`.

```
src/
├── app/
│   ├── providers/           QueryProvider (React Query), ThemeProvider (applies light/dark)
│   └── router/router.tsx    Route objects + createBrowserRouter (all pages lazy-loaded)
├── assets/fonts/            Original woff2 files extracted from the design bundle
├── components/ui/           Button, Input/Field/TextArea, Modal (drawer), Loader, Card,
│                            DataTable (+SortHead/DataRow), Chip, Pill, Tabs, Toggle,
│                            StatCard, Text/Stack primitives, Icon, misc tiles
├── constants/               icons, nav (sidebar + page titles), routes, tones
├── hooks/                   Shared hooks: useEditGate, useJump (record resolver),
│                            useConsoleNav, useConsoleData
├── layouts/
│   ├── AdminLayout/         AdminLayout (auth guard + shell), Sidebar, Header (search, theme,
│   │                        bell, account menu), DrawerHost, Toasts
│   └── AuthLayout/          AuthLayout (stage guard)
├── lib/                     apiClient (env-driven fetch wrapper), endpoints, queryClient,
│                            collection (search/sort/money helpers)
├── modules/<feature>/       pages/ · components/ · hooks/ · *.module.css
│   auth, overview, orders, vault, listings, pricing, auctions, lc, collab, chain,
│   users, verification, disputes, academy, marketing, partners, support, audit,
│   financial, analytics, settings, profile
├── services/<feature>/      <feature>Data.ts (demo fixtures) · <feature>Service.ts (API calls
│                            with demo fallback) · index.ts
├── store/                   Tiny external store (useSyncExternalStore) for console UI state
├── styles/                  tokens.css (design tokens, light + dark), global.css, fonts.css,
│                            layout.module.css (shared responsive grids)
├── types/                   console.ts, auth.ts, <feature>.ts (domain models)
└── main.tsx
tests/
├── unit/                    Vitest + RTL
├── e2e/                     Playwright
└── visual/                  Pixel-diff + responsive audit scripts
```

**Styling.** Every colour, gradient and shadow in the design is a token in
`src/styles/tokens.css` (copied from the design's `:root` / `[data-theme="dark"]`
blocks). Components use CSS Modules; one-off typography uses the `Text` primitive with
the design's exact pixel values and token colours.

**State.** Session (auth stage, signed-in role) lives in `modules/auth/hooks/useSession`
and is persisted to `sessionStorage`. Console UI state (search query, filter chips,
sort columns, drawer, toasts, in-session decisions such as approved offers) lives in
`store/consoleStore.ts`. Theme is persisted to `localStorage` (`mb-theme`) exactly as
in the design.

## Screens and routes

| Area | Routes |
| --- | --- |
| Auth | `/login`, `/verify` (2FA), `/locked`, `/signed-out` |
| Overview | `/overview` |
| Orders | `/orders`, `/orders/intake`, `/orders/:orderId` |
| Vault & Inventory | `/vault`, `/vault/:lotId` (catalog / auction / reserve allocation panels) |
| Catalog Listings | `/listings`, `/listings/:listingId` |
| Pricing & Rates | `/pricing`, `/pricing/offers` |
| Auctions | `/auctions`, `/auctions/upcoming`, `/auctions/ended`, `/auctions/create`, `/auctions/live/:id`, `/auctions/ended/:id` |
| LC & Payments | `/lc` (inline LC review panel) |
| Collaboration | `/collab` (inline negotiation panel) |
| Blockchain Monitor | `/chain` |
| Users & Accounts | `/users`, `/users/tiers`, `/users/:userId` |
| Verification & Compliance | `/verification`, `/verification/expiry` |
| Disputes | `/disputes`, `/disputes/:disputeId` |
| Academy | `/academy`, `/academy/analytics` |
| Marketing · Partners · Audit · Financial · Analytics · Profile | `/marketing`, `/partners`, `/audit`, `/financial`, `/analytics`, `/profile` |
| Settings | `/settings`, `/settings/platform`, `/settings/btc` |

Console routes redirect to `/login` without a session; locking returns to the
screen you locked on after unlocking.

## Responsive behaviour

The design ships one desktop frame (`min-width: 1440px`, preview 1440×1000). Smaller
layouts were derived without changing the visual language:

| Width | Behaviour |
| --- | --- |
| ≥ 1280 | Identical to the design |
| < 1280 | Detail screens use a 1.5fr / 1fr split; 5- and 6-up KPI rows become 3-up |
| < 1100 | Overview activity/side panels and several 3-column cards stack |
| < 1024 | Sidebar becomes an off-canvas drawer opened from a header menu button; detail side rails stop being sticky and move below the main column; 4-up stat grids become 2-up; data tables keep their column proportions and scroll horizontally **inside their card** |
| < 860 | Header search moves to its own full-width row |
| < 768 | Tabs scroll horizontally with actions above them; pipeline/route trackers scroll inside their card; two-column forms stack |
| < 480 | Metric tiles stack, bid feed rows wrap, page gutter 16 px |
| < 360 | Stat tiles single column |

Verified: no page-level horizontal overflow on any of the 43 routes at 1440×900,
1366×768, 768×1024, 390×844 or 320×568 (`tests/visual/responsive.mjs`, and the
Playwright overflow test).

## Design fidelity — how it was verified

`tests/visual/compare.mjs` renders the **original design bundle** and the React app in
the same state (it drives the design's own component state, and the matching React
route/store state), screenshots both in Chrome at 1440×900 with reduced motion, and
pixel-diffs them with `pixelmatch` (threshold 0.1).

- 62 states covered: every screen and sub-view, auth screens, the account menu,
  notification panel, form drawer, sign-in error and credentials panel, edit modes.
- Light theme: every state 0.00–0.15 % differing pixels; dark theme: same range.
- The remaining differences are sub-pixel anti-aliasing (Chrome renders some text
  grayscale vs. subpixel depending on compositing layers); element positions match to
  0.01 px where measured (`tests/visual/measure.mjs`).

## Backend integration

There is no backend in this repository. With `VITE_API_BASE_URL` empty (default) the
console runs on demo fixtures (`src/services/*/<feature>Data.ts`) and **every action is local
only**: approvals, stage advances, toggles, drawer submissions and exports update
in-memory state and show the design's confirmation toast, but nothing is persisted or
sent anywhere. `src/lib/endpoints.ts` lists the endpoint each action needs and
`src/lib/apiClient.ts` is the env-driven client to wire them to. Each
`src/services/<feature>/<feature>Service.ts` already exposes the list reads (for example
`getOrders()`), returning the fixtures in demo mode and calling the API otherwise; to move
a screen onto live data, add a `useQuery` hook in `modules/<feature>/hooks/` that calls the
service, as in the reference starter. Specifically needing a
backend: sign-in/SSO/2FA/unlock, all list data, CSV/statement/audit exports, every
create/approve/reject/advance/flag/release action, passport verification and anchoring.

Authentication is a **demo**: the six staff accounts and their passwords come from the
design (it displays them on the sign-in screen). Replace `authenticateDemo()` with the
real identity provider before any production use.

## Known deviations from the design

| Item | Reason |
| --- | --- |
| Header menu button + off-canvas sidebar below 1024 px | The design has no mobile frame; needed for navigation on small screens |
| Visible keyboard focus rings (inputs: blue border + soft ring) | The design defines none; required for keyboard accessibility |
| Session survives page reloads | Needed for real URLs/deep links; the design resets on reload |
| Profile shows the signed-in account (design hard-codes Grace Kioko) | Identical for the default account |
| Profile notification switches are interactive | They are static graphics in the design |
| Dispute "Outcome" is a real `<select>` styled like the design's static field | Makes the control functional; pixel diff unchanged |
| Dispute "Linked record" opens the referenced record type (e.g. an auction) | The design always opens the Orders screen |
| Account menu "My profile" / "Settings & roles" render without icons | Matches the rendered design (its icon references are undefined there) |
| Some static design toggles (trust device, assay-to-buyers, Tier 3 only) stay display-only | They have no behaviour in the design |
=======
# mineral-bridge-admin-dashboard

React + Vite + TypeScript starter following the structure of `selorg-admin-dashboard` in the Selorg Application reference. Includes a small sample feature demonstrating file and folder conventions.

```sh
npm install
cp .env.example .env
npm run dev
```

Admin: http://localhost:5173. Vite forwards `/api` to `VITE_API_URL`. For deployment, configure the hosting server to proxy `/api` to the service and serve `index.html` for SPA routes.

Features go in `src/modules/<feature>/{pages,components,hooks}`. Services go in `src/services/<feature>/`. Components use `.tsx` and optional `.module.css`; helpers and stores use `.ts`. App providers and routing live in `src/app/`.

Run `npm run typecheck` to check TypeScript. Dependencies must be installed in this repository first.

## Sample files

The sample feature reads `GET /api/samples` from the service. Start the service before using the sample screens. Open `/samples`.
>>>>>>> origin/sudharsan/dev-min
