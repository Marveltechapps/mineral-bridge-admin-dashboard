import { createContext, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createController } from '../engine/controller';
import { useConsoleStore } from '../../../store/consoleStore';
import { CONSOLE_DB_KEY, useConsoleDb } from './useConsoleDb';
import type { ConsoleController, ConsoleDb } from '../../../types/console';

export const ConsoleContext = createContext<ConsoleController | null>(null);

/** Creates the console controller once, wired to the store, the query cache and the router. */
export function useConsoleControllerInstance(): ConsoleController {
  const queryClient = useQueryClient();
  // useNavigate is stable in a data router, so the controller (and its form drafts) lives as long
  // as the console is mounted.
  const navigate = useNavigate();
  return useMemo(() => createController({
    getUi: () => useConsoleStore.getState(),
    setUi: patch => useConsoleStore.setState(patch),
    getDb: () => queryClient.getQueryData<ConsoleDb>(CONSOLE_DB_KEY),
    setDb: db => queryClient.setQueryData(CONSOLE_DB_KEY, db),
    navigate: path => { if (path !== window.location.pathname) void navigate(path); },
  }), [queryClient, navigate]);
}

/**
 * The console controller for a screen. Like the design, every state change re-renders the screen,
 * so callers subscribe to all UI state and to the data set.
 */
export function useConsole(): ConsoleController {
  const controller = useContext(ConsoleContext);
  if (!controller) throw new Error('useConsole must be used inside ConsoleRoot');
  useConsoleStore();
  useConsoleDb();
  return controller;
}
