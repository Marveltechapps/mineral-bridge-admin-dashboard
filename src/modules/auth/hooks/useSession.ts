import { createStore, useStoreSelector } from '@/store/createStore';
import { STAFF_ACCOUNTS } from '@/services/auth';
import type { AuthStage, StaffAccount } from '@/types/auth';

interface SessionState {
  stage: AuthStage;
  roleIndex: number;
  authError: string | null;
  credsOpen: boolean;
}

const STORAGE_KEY = 'mb-session';

function load(): SessionState {
  const fallback: SessionState = { stage: 'login', roleIndex: 0, authError: null, credsOpen: false };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    const stage = parsed.stage;
    const roleIndex = typeof parsed.roleIndex === 'number' && STAFF_ACCOUNTS[parsed.roleIndex] ? parsed.roleIndex : 0;
    if (stage === 'app' || stage === 'locked' || stage === 'otp' || stage === 'out' || stage === 'login') {
      return { ...fallback, stage, roleIndex };
    }
  } catch {
    /* storage unavailable */
  }
  return fallback;
}

export const sessionStore = createStore<SessionState>(typeof window === 'undefined' ? { stage: 'login', roleIndex: 0, authError: null, credsOpen: false } : load());

sessionStore.subscribe(() => {
  const { stage, roleIndex } = sessionStore.getState();
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, roleIndex }));
  } catch {
    /* storage unavailable */
  }
});

export function useSessionState<T>(selector: (s: SessionState) => T): T {
  return useStoreSelector(sessionStore, selector);
}

export interface SessionView {
  account: StaffAccount;
  first: string;
  lockedAt: string;
}

export function useCurrentAccount(): SessionView {
  const index = useSessionState((s) => s.roleIndex);
  const account = STAFF_ACCOUNTS[index] ?? STAFF_ACCOUNTS[0];
  return { account, first: account.name.split(' ')[0], lockedAt: '18 Sep 2026 · 16:42 EAT' };
}

export const sessionActions = {
  setError(authError: string | null) {
    sessionStore.setState({ authError });
  },
  toggleCreds() {
    sessionStore.setState((s) => ({ credsOpen: !s.credsOpen }));
  },
  toOtp(roleIndex: number) {
    sessionStore.setState({ roleIndex, authError: null, stage: 'otp' });
  },
  verify() {
    sessionStore.setState({ stage: 'app', authError: null, credsOpen: false });
  },
  backToLogin() {
    sessionStore.setState({ stage: 'login', authError: null });
  },
  lock() {
    sessionStore.setState({ stage: 'locked' });
  },
  unlock() {
    sessionStore.setState({ stage: 'app' });
  },
  signOut() {
    sessionStore.setState({ stage: 'out' });
  },
  signInAgain() {
    sessionStore.setState({ stage: 'login', authError: null });
  },
};
