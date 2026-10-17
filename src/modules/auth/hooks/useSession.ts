import { createStore, useStoreSelector } from '@/store/createStore';
import { STAFF_ACCOUNTS } from '@/services/auth';
import type { AuthStage, StaffAccount } from '@/types/auth';

interface SessionState {
  stage: AuthStage;
  roleIndex: number;
  authError: string | null;
  credsOpen: boolean;
  challengeId: string | null;
  liveAccount: StaffAccount | null;
  maskedDestination: string | null;
  otpChannel: string | null;
  otpExpiresAt: string | null;
  resendAvailableAt: string | null;
}

const STORAGE_KEY = 'mb-session';

function load(): SessionState {
  const fallback: SessionState = {
    stage: 'login',
    roleIndex: 0,
    authError: null,
    credsOpen: false,
    challengeId: null,
    liveAccount: null,
    maskedDestination: null,
    otpChannel: null,
    otpExpiresAt: null,
    resendAvailableAt: null,
  };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    const stage = parsed.stage;
    const roleIndex = typeof parsed.roleIndex === 'number' && STAFF_ACCOUNTS[parsed.roleIndex] ? parsed.roleIndex : 0;
    if (stage === 'app' || stage === 'locked' || stage === 'otp' || stage === 'out' || stage === 'login') {
      return {
        ...fallback,
        stage,
        roleIndex,
        challengeId: typeof parsed.challengeId === 'string' ? parsed.challengeId : null,
        maskedDestination: typeof parsed.maskedDestination === 'string' ? parsed.maskedDestination : null,
        otpChannel: typeof parsed.otpChannel === 'string' ? parsed.otpChannel : null,
        otpExpiresAt: typeof parsed.otpExpiresAt === 'string' ? parsed.otpExpiresAt : null,
        resendAvailableAt: typeof parsed.resendAvailableAt === 'string' ? parsed.resendAvailableAt : null,
      };
    }
  } catch {
    /* storage unavailable */
  }
  return fallback;
}

const emptySession: SessionState = {
  stage: 'login',
  roleIndex: 0,
  authError: null,
  credsOpen: false,
  challengeId: null,
  liveAccount: null,
  maskedDestination: null,
  otpChannel: null,
  otpExpiresAt: null,
  resendAvailableAt: null,
};

export const sessionStore = createStore<SessionState>(typeof window === 'undefined' ? emptySession : load());

sessionStore.subscribe(() => {
  const { stage, roleIndex } = sessionStore.getState();
  try {
    const state = sessionStore.getState();
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        stage,
        roleIndex,
        challengeId: state.challengeId,
        maskedDestination: state.maskedDestination,
        otpChannel: state.otpChannel,
        otpExpiresAt: state.otpExpiresAt,
        resendAvailableAt: state.resendAvailableAt,
      }),
    );
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
  const live = useSessionState((s) => s.liveAccount);
  const account = live ?? STAFF_ACCOUNTS[index] ?? STAFF_ACCOUNTS[0];
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
  toLiveOtp(
    challengeId: string,
    account: StaffAccount,
    delivery?: { maskedDestination?: string; channel?: string; expiresAt?: string; resendAvailableAt?: string },
  ) {
    sessionStore.setState({
      challengeId,
      liveAccount: account,
      authError: null,
      stage: 'otp',
      maskedDestination: delivery?.maskedDestination ?? null,
      otpChannel: delivery?.channel ?? null,
      otpExpiresAt: delivery?.expiresAt ?? null,
      resendAvailableAt: delivery?.resendAvailableAt ?? null,
    });
  },
  noteResend(delivery: { maskedDestination?: string; resendAvailableAt?: string }) {
    sessionStore.setState({
      maskedDestination: delivery.maskedDestination ?? sessionStore.getState().maskedDestination,
      resendAvailableAt: delivery.resendAvailableAt ?? null,
      authError: null,
    });
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
