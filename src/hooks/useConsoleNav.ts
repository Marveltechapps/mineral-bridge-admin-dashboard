import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { consoleActions, type ConsoleState } from '@/store/consoleStore';

/**
 * Navigate to a route while applying the state patch the design's go()/h.*
 * helpers apply (close menus, reset query, preset a filter…).
 */
export function useConsoleNav() {
  const navigate = useNavigate();
  return useCallback(
    (to: string, patch?: Partial<ConsoleState>) => {
      consoleActions.set({ avatarOpen: false, bellOpen: false, navOpen: false, ...patch });
      navigate(to);
    },
    [navigate],
  );
}

/** Shorthand for the design's act(text): show a confirmation toast. */
export const notify = (text: string) => consoleActions.notify(text);
