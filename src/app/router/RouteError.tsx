import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { isApiError } from '@/lib/apiClient';

/**
 * What a desk sees when a route throws.
 *
 * Without an `errorElement` React Router shows its own developer screen —
 * stack trace, white background, no way back — to whoever is on shift. This
 * says what failed in the console's own voice and offers the two useful moves:
 * try the screen again, or go back to the overview.
 *
 * Reloading rather than resetting is deliberate: the store is in an unknown
 * state after a thrown render, so starting the route clean is the honest
 * recovery.
 */
export function RouteError() {
  const error = useRouteError();

  let heading = 'This screen could not be loaded';
  let detail = 'Something failed while rendering. The desk data is unaffected.';

  if (isApiError(error)) {
    heading =
      error.status === 401
        ? 'Your session has ended'
        : error.status === 403
          ? 'This account cannot open that screen'
          : 'This screen could not be loaded';
    detail = error.message || (error.status ? `${error.status} — Request failed` : 'The operations API could not be reached');
  } else if (isRouteErrorResponse(error)) {
    heading = `${error.status} — ${error.statusText}`;
    detail = 'That address does not match a console screen.';
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <div role="alert" className="routeError">
      <h1>{heading}</h1>
      <p>{detail}</p>
      <div className="routeErrorActions">
        <button type="button" onClick={() => window.location.reload()}>
          Try this screen again
        </button>
        <a href="/overview">Back to overview</a>
      </div>
    </div>
  );
}

export default RouteError;
