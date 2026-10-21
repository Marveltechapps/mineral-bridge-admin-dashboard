import { useEffect, useState } from 'react';
import { isDemoMode } from '@/lib/apiClient';
import { formatAuthError } from '@/services/auth';

export function useRemoteValue<T>(load: (signal?: AbortSignal) => Promise<T>) {
  const demoMode = isDemoMode();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (demoMode) return;
    const ac = new AbortController();
    setError(null);
    load(ac.signal)
      .then((next) => {
        if (!ac.signal.aborted) setData(next);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        setError(formatAuthError(err, 'Could not load this screen from the server.'));
      });
    return () => ac.abort();
  }, [demoMode, load, tick]);
  return { demoMode, data, error, loading: !demoMode && data === null && error === null, reload: () => setTick((n) => n + 1) };
}

export function useLiveList<T>(load: (signal?: AbortSignal) => Promise<readonly T[]>, demo: readonly T[]) {
  const demoMode = isDemoMode();
  const [rows, setRows] = useState<readonly T[] | null>(demoMode ? demo : null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (demoMode) return;
    const ac = new AbortController();
    setError(null);
    load(ac.signal)
      .then((next) => {
        if (!ac.signal.aborted) setRows(next);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        setRows([]);
        setError(formatAuthError(err, 'Could not load records from the server.'));
      });
    return () => ac.abort();
  }, [demoMode, load, tick]);

  return {
    rows: rows ?? [],
    loading: !demoMode && rows === null,
    error,
    reload: () => setTick((n) => n + 1),
  };
}
