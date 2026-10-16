import { useSyncExternalStore } from 'react';

type Listener = () => void;
type Updater<S> = Partial<S> | ((state: S) => Partial<S>);

export interface Store<S> {
  getState: () => S;
  setState: (patch: Updater<S>) => void;
  subscribe: (listener: Listener) => () => void;
}

/** Minimal external store; components subscribe to slices via useStore(selector). */
export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    getState: () => state,
    setState: (patch) => {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStoreSelector<S, T>(store: Store<S>, selector: (state: S) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
