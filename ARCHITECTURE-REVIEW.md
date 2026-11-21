# Admin Console Architecture Review

**Date:** 2026-10-15

| | Path | What it is |
|---|---|---|
| **A — the architecture file** | `C:\js\min-clone\mineral-bridge-admin-dashboard-main` | Vite + React scaffold. **91 lines**, one `sample` module, 3 placeholder folders. |
| **B — the design file** | `C:\js\mineralbridge-full\mineralbridge-dashboard` | The real console. **13,998 lines**, 190 files, **~20 modules**, 18 services, 19 UI primitives. |

---

## 1. Verdict: right — and it is the only one of the three scaffolds that is

This is a different answer from the web and mobile reviews, and it is worth
being precise about why.

**A's structure is correct, and B follows it.** Twelve of A's thirteen folders
are in active use in B, with the same meaning:

| A declares | B uses it for | Followed |
|---|---|---|
| `src/app/providers/` | `QueryProvider`, `ThemeProvider` | yes |
| `src/app/router/` | the route table | yes |
| `src/components/ui/` | 19 primitives — Button, Card, Chip, DataTable, Input, Modal, Pill, Tabs, Toggle, StatCard… | yes |
| `src/components/tables/` | — `DataTable` went into `ui/` instead | **the one exception** |
| `src/constants/` | `nav`, `routes`, `icons`, `tones` | yes |
| `src/hooks/` | `useConsoleData`, `useConsoleNav`, `useEditGate`, `useJump` | yes |
| `src/layouts/AdminLayout/` | shell, header, sidebar, drawers, toasts (+ an `AuthLayout` A does not have) | yes |
| `src/lib/` | `apiClient`, `queryClient`, `endpoints`, `collection` | yes |
| `src/modules/<feature>/{pages,components,hooks}` | ~20 modules, same shape | yes |
| `src/services/<feature>/{index,xService}` | 18 services, same shape, plus an `xData` fixture per service | yes |
| `src/store/` | `createStore`, `consoleStore` | yes |
| `src/styles/tokens.css` | the full token set | yes |
| `src/types/` | 15 domain type files | yes |

A 91-line skeleton whose folder meanings survived to 13,998 lines and 20
business domains without reorganisation is a **sound** layout. Unlike the web
scaffold (which specified Next.js for a Vite app) and the mobile scaffold (whose
"navigation" was a `useState` boolean), nothing here had to be discarded.
**Keep it, and keep following it.**

**But A is a skeleton with defects, and following it literally propagated two of
them.** That is the real finding of this review: where B diverged from A it
improved on it, and where B copied A faithfully it copied A's mistakes. Both are
now fixed — see §4.

---

## 2. Where B improved on A unprompted

These are A's flaws that B did not inherit. They are also the measure of how far
B is ahead.

| A's flaw | What B did instead |
|---|---|
| **`@/` alias declared in two configs, used 0 times** — every import deep-relative | **587 aliased imports, zero `../../`.** Exemplary; the one thing B should be copied *for*. |
| **Design tokens: 2 CSS variables**, and `Card.module.css` hardcodes `white` and `#dfe4eb` anyway | A full token set in `tokens.css` — surfaces, lines, ink, brand, semantic tones, shadows — with light/dark via `ThemeProvider` |
| **`zustand` declared as a dependency, 0 imports** | No zustand; a hand-rolled `createStore` on `useSyncExternalStore`, so selectors subscribe narrowly |
| **No tests at all** (and `tsconfig.node.json` references a `vitest.config.ts` that does not exist) | Vitest unit tests, Playwright e2e, plus a visual/responsive tooling suite |
| **No auth, in an admin dashboard** | A full auth module: login, 2FA verify, locked, signed-out, six staff roles with scopes, session persisted to `sessionStorage` |
| **`<header>` and `<nav>` nested *inside* `<main>`** — broken landmarks | `<aside>`, `<nav aria-label="Primary">`, `<header>` and `<main id="main">` as proper siblings |
| **Every route statically imported** | Every route `React.lazy`, so the build emits a chunk per screen (284 kB entry, pages loaded on demand) |
| `src/components/tables/` left empty | `DataTable` built, with sticky proportions and horizontal scroll |

B also carries things A has no concept of: `lib/endpoints.ts` documenting the
whole backend surface, an `xData` fixture beside every service so the console
runs without a backend, and an edit-gate (`useEditGate`, `EditGateActions`,
`EditingBadge`) for read-only roles.

---

## 3. Where following A hurt

Two of A's defects reached B unchanged, because B followed A exactly:

1. **`src/lib/queryClient.ts` was `new QueryClient()`** — byte-identical to A's,
   including the comment-free bareness. No `staleTime`, no retry rule. With the
   defaults, **every** query retries three times, so a desk whose session had
   expired would fire four requests before the sign-in screen appeared, and a
   rejected desk action would be replayed against a backend that had already
   refused it.
2. **No `errorElement` on any route.** B did add a `path: '*'` redirect that A
   lacks, so an unknown URL is handled — but a *thrown* route still showed React
   Router's raw developer screen, stack trace and all, to whoever was on shift.

A third is B's own: its `apiClient` is better than A's (A throws a bare
`new Error`), but it carried three real bugs of its own. §4.

---

## 4. What was changed in B

### 4.1 The test suite was failing before any change

`npm test` reported **2 of 18 failing** in `tests/unit/flows.test.tsx`
(`Unable to find role="table" and name "Orders"`), while the same file passed in
isolation.

Cause: **every route is `React.lazy`**, so the first assertion after a render
waits on a dynamic import, Suspense and the page's first paint — but
`tests/unit/setup.ts` set no Testing Library timeout, leaving the 1 s default,
and `vite.config.ts` set no `testTimeout`, leaving 5 s.

Fixed by raising both: `asyncUtilTimeout: 10_000` in the setup file and
`testTimeout: 30_000` in the Vitest config. A timeout is a ceiling, not a delay
— a query that resolves sooner still returns sooner — so a fast run is
unaffected. **18/18 now pass, and 40/40 with the new tests.**

This is a structural consequence of lazy routes, not a flaky test to be
re-run until green.

### 4.2 `apiClient` — three real bugs

**Caller headers destroyed the merged headers.** `init` was spread *after* the
merged `headers` object:

```ts
fetch(url, {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', ...init.headers },
  ...init,                       // ← replaced the whole merged object
  signal: controller.signal,
})
```

Any caller passing a header of its own silently dropped `Content-Type`, so a
POST to the operations API would have been rejected for it. `init` is now spread
first, so the merged headers, credentials and signal cannot be clobbered — while
a caller that deliberately sets `Content-Type` still wins.

**An already-aborted signal was ignored.** Cancellation relied on
`init.signal?.addEventListener('abort', …)`, which never fires for a signal that
was already aborted when the request started — so such a request ran to its full
15-second timeout instead of stopping. Now checked directly.

**An empty body threw a raw `SyntaxError`.** `res.json()` was called
unconditionally, so a `204` from an advance-stage or mark-read endpoint rejected
with a parse error rather than an `ApiError`. Empty and no-content responses now
resolve to `undefined`.

### 4.3 `ApiError` can now distinguish failures

It carried `message` and `status` only, so the console could not tell *session
expired* (401) from *role not permitted* (403) from *order already advanced*
(409) from *invalid price* (422) without matching on message text.

It now carries `status`, a machine-readable `code` and per-field `fields` for a
422 — **with the same constructor signature as the web and mobile clients**, so
all three front ends now handle one backend identically. Added with it: client
codes for demo mode, timeout, network failure and malformed body; tolerant
parsing of `{ code, message, fields }`, `{ error: { … } }`, `{ detail }` and the
`{ price: ['…'] }` array spelling; and a real status preserved when a proxy
returns HTML.

`isDemoMode` became a function so it reflects the environment when called rather
than at import, which is also what makes the layer testable.

### 4.4 A query policy, set once

`src/lib/queryClient.ts` now sets `staleTime: 30s`, `refetchOnWindowFocus: false`,
and a retry predicate that retries only what repeating can fix — a `5xx`, or a
network/timeout failure that never reached the server — and never a 401, 403,
404, 409 or 422. **Mutations never retry at all**: advancing an order or
releasing a payment twice is worse than reporting the failure once.

### 4.5 A route error boundary

`src/app/router/RouteError.tsx`, attached as `errorElement` to all five top-level
branches. It names what failed in the console's own voice — distinguishing an
expired session, a forbidden screen and an unreachable API — and offers the two
useful moves, retry or back to overview. Styled with plain selectors in
`global.css` rather than a CSS module, so the boundary still renders if a module
fails to load.

### 4.6 Tests

`tests/unit/apiClient.test.ts`, **21 tests**: demo mode serving the fixture with
no request, header merging (including the §4.2 defect and a deliberate
override), `204` with no body, caller cancellation, an already-aborted signal,
timeout winning when the caller never aborts, every error shape including 401 vs
403 vs 409 and both spellings of field errors, and the retry policy proving it
never repeats a 401/403/404/409/422 and does repeat a 5xx or a transport failure.

**Verification:** typecheck clean, ESLint clean, **40 tests passing**,
`npm run build` succeeds (284 kB entry, a chunk per route). No module, page,
component or style file was touched beyond the error-boundary CSS.

---

## 5. What remains in B

1. **Nothing fetches.** All 18 services call `apiRequestOrDemo`, which returns
   the bundled `xData` fixture while `VITE_API_BASE_URL` is empty. The client is
   ready and tested; no screen has yet been pointed at a backend.
2. **Auth is demo-only, by design and clearly labelled.** `authService.ts` holds
   six staff accounts with plaintext `demoPassword` values — the design itself
   exposes them in a "Show staff test credentials" panel, so they are not
   secrets, and the file says a production build must replace
   `authenticateDemo()` with the real identity provider. But the console has
   **no token, no `Authorization` header and no refresh**, and role scopes are
   enforced only in the browser. The web client now has that plumbing
   (`src/lib/auth/`); this one should match, and **every** desk action must be
   authorised server-side.
3. **Session state lives in `sessionStorage`.** Fine for a stage flag; it must
   not become where a credential is kept.
4. **A stray file at the repo root**: `Mineral Bridge Admin Dashboard (1).html`.
   Most likely a download of the design; it belongs in `design-src/` or deleted.
5. **`src/components/tables/` from A was never created here** and `DataTable`
   lives in `ui/`. That is the better call — worth deleting the folder from A
   rather than adding it to B.
6. **Prettier is absent and ESLint is flat-config 9** — fine, but the three
   front ends still disagree on tooling versions (this one Vite 5.4 / React 18.3,
   A is on Vite 6 / React 19).

---

## 6. Summary

**The architecture file is right.** Of the three scaffolds reviewed in this
project it is the only one that is: its folder vocabulary is sound, the real
console follows twelve of its thirteen folders with the same meanings, and
nothing in it had to be thrown away. The web scaffold specified the wrong
framework; the mobile scaffold's navigation was a placeholder its own README
disowned. This one got the shape right.

**It is still only a 91-line skeleton, and following it literally carried two of
its defects into production code** — a `QueryClient` with no policy, so a dead
session would fire four requests and a refused desk action would be replayed,
and no route error boundary, so a thrown screen showed a stack trace to whoever
was on shift. Both are fixed, along with three genuine bugs in the console's own
`apiClient` and a test suite that was failing before any of this started because
lazy routes outran the default 1-second async timeout.

Where the console diverged from the scaffold it was right to: 587 aliased
imports against the scaffold's zero, a real token system against two CSS
variables, a real store instead of an unused `zustand` dependency, correct
landmarks instead of a `<header>` inside `<main>`, per-route code splitting, and
an auth module and test suite the scaffold has no trace of.

So: **follow it for structure, do not trust it for implementation, and treat
anything it leaves bare — the query client, the error boundary, the API client —
as a decision still to be made rather than a default to inherit.** The one gap
that matters most now is real authentication; the web client has it, and this
console handles money.
