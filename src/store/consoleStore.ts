import { create } from 'zustand';
import type { AllocMode, ConsoleUiState, DrawerConfig, Notice, RateRange, SortState, Theme } from '../types/console';
import { parseConsolePath } from '../constants/nav';
import { createStore, useStoreSelector } from './createStore';

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

/** Default value of every filter-chip group (first chip of each list in the design). */
export const FILTER_DEFAULTS = {
  orderSide: 'All sides',
  orderStage: '',
  vaultStatus: 'All lots',
  listFilter: 'All listings',
  rateSource: 'All sources',
  aucFilter: 'All auctions',
  userFilter: 'All tiers',
  verTier: 'All tiers',
  expiryFilter: 'All documents',
  dsFilter: 'All disputes',
  partnerFilter: 'All partners',
  ticketFilter: 'All tickets',
  auditFilter: 'All actions',
  ledgerFilter: 'All settlements',
  lcFilter: 'All LCs',
  negFilter: 'All negotiations',
  bcFilter: 'All events',
} as const;

export type FilterKey = keyof typeof FILTER_DEFAULTS;

export interface ConsoleState {
  theme: Theme;
  query: string;
  filters: Record<FilterKey, string>;
  sorts: Record<string, SortState>;
  orderPage: number;
  notices: Notice[];
  drawer: DrawerConfig | null;
  editing: Record<string, boolean>;
  avatarOpen: boolean;
  bellOpen: boolean;
  navOpen: boolean;

  lcSel: string | null;
  negSel: string | null;
  kycOpen: string | null;
  rateFocus: string;
  rateRange: RateRange;
  createLot: string;
  allocMode: AllocMode;

  stageAdv: Record<string, number>;
  overrides: Record<string, boolean>;
  offerDone: Record<string, string>;
  kycDone: Record<string, string>;
  tierDone: Record<string, string>;
  toggles: Record<string, boolean>;
  access: Record<string, number>;
  paused: Record<string, boolean>;
  flagged: Record<string, boolean>;
  btcOn: Record<string, boolean>;
}

function readSavedTheme(): Theme {
  try {
    const saved = window.localStorage.getItem('mb-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable */
  }
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function initialConsoleState(): ConsoleState {
  return {
    theme: typeof window === 'undefined' ? 'light' : readSavedTheme(),
    query: '',
    filters: { ...FILTER_DEFAULTS },
    sorts: {},
    orderPage: 0,
    notices: [],
    drawer: null,
    editing: {},
    avatarOpen: false,
    bellOpen: false,
    navOpen: false,
    lcSel: null,
    negSel: null,
    kycOpen: 'KYC-7741',
    rateFocus: 'Gold Concentrate',
    rateRange: '12W',
    createLot: 'MBV-2026-0412',
    allocMode: 'catalog',
    stageAdv: {},
    overrides: {},
    offerDone: {},
    kycDone: {},
    tierDone: {},
    toggles: {},
    access: {},
    paused: {},
    flagged: {},
    btcOn: {},
  };
}

export const consoleStore = createStore<ConsoleState>(initialConsoleState());

export function useConsole<T>(selector: (s: ConsoleState) => T): T {
  return useStoreSelector(consoleStore, selector);
}

const set = consoleStore.setState;
const get = consoleStore.getState;

let noticeSeq = 0;

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

export const consoleActions = {
  notify(text: string) {
    const id = ++noticeSeq;
    set((s) => ({ notices: s.notices.concat([{ id, text }]) }));
    window.setTimeout(() => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })), 3200);
  },

  setTheme(theme: Theme) {
    try {
      window.localStorage.setItem('mb-theme', theme);
    } catch {
      /* storage unavailable */
    }
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme() {
    consoleActions.setTheme(get().theme === 'dark' ? 'light' : 'dark');
    set({ avatarOpen: false });
  },

  setQuery(query: string) {
    set({ query });
  },

  clearQuery() {
    set({ query: '', orderPage: 0 });
  },

  setFilter(key: FilterKey, value: string) {
    set((s) => ({ filters: { ...s.filters, [key]: value } }));
  },

  toggleSort(mod: string, key: string) {
    set((s) => {
      const cur = s.sorts[mod] ?? { k: null, d: 1 };
      const on = cur.k === key;
      const next: SortState = { k: key, d: on ? (cur.d === 1 ? -1 : 1) : 1 };
      return { sorts: { ...s.sorts, [mod]: next } };
    });
  },

  openDrawer(drawer: DrawerConfig) {
    set({ drawer, bellOpen: false, avatarOpen: false });
  },

  closeDrawer() {
    set({ drawer: null });
  },

  setEditing(key: string, on: boolean) {
    set((s) => ({ editing: { ...s.editing, [key]: on } }));
  },

  closeMenus() {
    set({ avatarOpen: false, bellOpen: false });
  },

  /** State reset applied when the user picks a module from the sidebar (design's nav item go()). */
  resetForNav() {
    set((s) => ({
      avatarOpen: false,
      bellOpen: false,
      navOpen: false,
      lcSel: null,
      negSel: null,
      filters: {
        ...s.filters,
        lcFilter: FILTER_DEFAULTS.lcFilter,
        negFilter: FILTER_DEFAULTS.negFilter,
        bcFilter: FILTER_DEFAULTS.bcFilter,
        listFilter: FILTER_DEFAULTS.listFilter,
      },
      orderPage: 0,
      drawer: null,
      editing: {},
    }));
  },

  /** Reset applied on sign-out → sign in again. */
  resetSession() {
    const theme = get().theme;
    consoleStore.setState({ ...initialConsoleState(), theme });
  },

  set: consoleStore.setState,
};
