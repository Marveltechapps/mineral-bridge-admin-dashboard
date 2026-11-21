import { create } from 'zustand';
import { parseConsolePath } from '../constants/nav';
import type { ConsoleUiState } from '../types/console';

const opened = typeof window === 'undefined' ? null : parseConsolePath(window.location.pathname);

export const initialConsoleUiState: ConsoleUiState = {
  nav: opened?.nav ?? 'overview',
  orderId: opened?.orderId ?? null,
  auth: 'login',
  via: 'email',
  loginId: '',
  loginPassword: '',
  loginErr: '',
  pending: 0,
  code: '',
  codeErr: '',
  role: 0,
  rev: 0,
  tab: {},
  chip: {},
  sort: {},
  tablePage: {},
  q: '',
  drawer: null,
  toasts: [],
  theme: 'light',
  narrow: false,
  menu: false,
  reply: '',
};

/** Console UI state: sign-in step, active tab/chip/sort per screen, search, drawer, toasts, theme. */
export const useConsoleStore = create<ConsoleUiState>()(() => ({ ...initialConsoleUiState }));
