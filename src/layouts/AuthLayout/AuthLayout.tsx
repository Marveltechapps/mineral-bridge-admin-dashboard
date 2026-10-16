import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';
import { ROUTES } from '@/constants/routes';
import { useSessionState } from '@/modules/auth/hooks/useSession';
import type { AuthStage } from '@/types/auth';

const HOME: Record<AuthStage, string> = {
  login: ROUTES.login,
  otp: ROUTES.verify,
  app: ROUTES.overview,
  locked: ROUTES.locked,
  out: ROUTES.signedOut,
};

/**
 * Wraps the auth screens (sign in, 2FA, locked, signed out). Each screen is only
 * reachable in its own session stage; any other stage is redirected to where it belongs.
 */
export function AuthLayout({ stage }: { stage: AuthStage }) {
  const current = useSessionState((s) => s.stage);
  const location = useLocation();
  if (current !== stage) {
    // Unlocking returns to the screen the console was locked on.
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={current === 'app' && from ? from : HOME[current]} replace />;
  }
  return (
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  );
}
