import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { vi } from 'vitest';

// The spreadsheet cases run in demo mode (empty API base). A developer's .env
// may point at a local API; that must not turn the bundled-data tests into
// network calls.
vi.stubEnv('VITE_API_BASE_URL', '');

/**
 * Every console route is `React.lazy` (see `@/app/router/router`), so the first
 * assertion after a render waits on a dynamic import, Suspense, and the page's
 * own first paint. Testing Library's default 1s async timeout is not enough for
 * that on a loaded machine, which made the route-level tests fail intermittently
 * while passing in isolation.
 *
 * The timeout is a ceiling, not a delay: a query that resolves sooner returns
 * sooner, so raising it costs nothing on a fast run and removes the flake on a
 * slow one.
 */
configure({ asyncUtilTimeout: 10_000 });
