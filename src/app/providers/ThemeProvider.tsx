import { useEffect, type ReactNode } from 'react';
import { applyTheme, useConsole } from '@/store/consoleStore';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useConsole((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return <>{children}</>;
}
