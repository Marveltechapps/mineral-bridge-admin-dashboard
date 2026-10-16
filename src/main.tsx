import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { router } from '@/app/router/router';
import '@/styles/global.css';

if (import.meta.env.DEV) {
  // Test hook for the visual-diff and e2e harnesses (stripped from production builds).
  void Promise.all([import('@/store/consoleStore'), import('@/modules/auth/hooks/useSession')]).then(([c, s]) => {
    (window as unknown as { __mb: unknown }).__mb = { consoleStore: c.consoleStore, sessionStore: s.sessionStore };
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
);
