import type { ChangeEvent, SyntheticEvent } from 'react';
import type { ConsoleIconName } from '../constants/nav';

/**
 * Shapes shared by the console engine and its React components. The engine builds these view
 * models (including each element's style string, as drawn in the design); components render them.
 */

/** Records the console works on (orders, customers, lots, auctions, refunds, audit…). */
export type ConsoleDb = Record<string, unknown>;

export type Go = (event?: SyntheticEvent) => void;
export type Change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

export type Theme = 'light' | 'dark';
export type AllocMode = 'catalog' | 'auction' | 'reserve';
export type RateRange = '12W' | '6M' | '1Y';

export interface Toast { id: number; text: string }
export interface Notice { id: number; text: string }
export interface DrawerRef { type: string; id: unknown }

/** A drawer field: [label, default value, hint, kind]. Mirrors the design's drawer config. */
export interface DrawerField {
  label: string;
  value?: string;
  hint?: string;
  kind?: 'text' | 'area';
}

export interface DrawerConfig {
  title: string;
  sub: string;
  fields: DrawerField[];
  cta: string;
  done: string;
  draft?: string;
  secondary?: string;
  /** Persists the drawer when a live API is configured. Absent in demo mode. */
  onSubmit?: (values: Record<string, string>, draft: boolean) => Promise<string>;
}

/**
 * Sort cursor shared by the console engine (column index `i`) and list tables (column key `k`).
 * Direction is 1 or -1.
 */
export interface SortState {
  i?: number;
  k?: string | null;
  d: number;
}

/** UI state kept in the Zustand store. */
export interface ConsoleUiState {
  auth: 'login' | 'code' | 'app';
  via: 'email' | 'whatsapp';
  loginId: string;
  loginPassword: string;
  loginErr: string;
  pending: number;
  code: string;
  codeErr: string;
  role: number;
  rev: number;
  tab: Record<string, string>;
  chip: Record<string, string>;
  sort: Record<string, SortState>;
  tablePage: Record<string, number>;
  q: string;
  drawer: DrawerRef | null;
  toasts: Toast[];
  theme: 'light' | 'dark';
  narrow: boolean;
  menu: boolean;
  reply: string;
  /** Current screen and open order. The URL mirrors these (/<nav> or /<nav>/<orderId>). */
  nav: string;
  orderId: string | null;
}

/** What the controller reads and writes outside itself. */
export interface ConsolePorts {
  getUi(): ConsoleUiState;
  setUi(patch: Partial<ConsoleUiState>): void;
  getDb(): ConsoleDb | undefined;
  setDb(db: ConsoleDb): void;
  /** Mirrors the current screen into the URL. */
  navigate(path: string): void;
}

/** The `c` object the engine calls: merged state plus the design's component methods. */
export interface ConsoleController {
  readonly state: ConsoleUiState & { db: ConsoleDb | undefined; back: string };
  form: Record<string, unknown>;
  setState(patch: object | ((state: ConsoleController['state']) => object)): void;
  toast(text: string): void;
  commit(message?: string): void;
  go(nav: string, extra?: object): void;
  openOrder(id: string): void;
  openDrawer(type: string, id: unknown, nav?: string): void;
  applyTheme(theme: 'light' | 'dark'): void;
  startLogin(): void;
  resendCode(): void;
  verify(): void;
  signOut(): void;
}

// ---------- shared pieces ----------
export interface ActionVM { label: string; style: string; go: Go }
export interface ChoiceVM { label: string; style: string; go: Go; value?: string }

export interface InputVM {
  label: string;
  value: string;
  set: Change;
  isText: boolean;
  isArea: boolean;
  isChoice?: boolean;
  isSelect?: boolean;
  choices?: ChoiceVM[];
}

// ---------- sign-in ----------
export interface SignInVM {
  loginStep: boolean;
  codeStep: boolean;
  lg: {
    tabE: string; tabW: string; viaEmail: Go; viaWa: Go;
    fieldLabel: string; placeholder: string; id: string; setId: Change;
    showPassword: boolean; password: string; setPassword: Change;
    err: string; errStyle: string; go: Go; submit: string;
    accounts: { role: string; id: string; go: Go }[];
  };
  cd: {
    sent: string; who: string; role: string; code: string; set: Change;
    err: string; errStyle: string; verify: Go; back: Go; resend: Go;
  };
}

// ---------- shell ----------
export interface NavItemVM { key: string; label: string; icon: ConsoleIconName; badge: string; badgeStyle: string; style: string; go: Go }
export interface ShellVM {
  me: { key: string; label: string; name: string; email: string; initials: string; first: string };
  sd: { wide: boolean; style: string; groups: { label: string; items: NavItemVM[] }[] };
  hd: {
    title: string; sub: string; q: string; setQ: Change;
    theme: Go; themeIcon: ConsoleIconName; themeText: string; themeLabel: string;
    menu: boolean; toggleMenu: Go; signOut: Go;
  };
  screenKey: string;
}

// ---------- list pages ----------
export interface KpiVM { label: string; value: string | number; sub: string; subStyle: string; style: string; go: Go }
export interface TabVM { label: string; style: string; go: Go }
export interface CellVM { text: string; sub: string; style: string; subStyle: string; wrapStyle: string; hasBtns: boolean; btns: ActionVM[] }
export interface RowVM { cells: CellVM[]; go: Go; style: string }
export interface ColVM { label: string; arrow: string; go: Go; style: string }
export interface TableVM {
  title: string; hasTitle: boolean; head: string; cols: ColVM[]; rows: RowVM[];
  empty: boolean; emptyText: string; count: string;
  hasPager?: boolean; pagerPrev?: Go; pagerNext?: Go;
}
export interface MiniVM { title: string; items: { t: string; s: string; go: Go; act: Go; btn: string }[] }
export interface SettingsVM {
  groups: { title: string; items: { label: string; value: string; set: Change; ro?: boolean }[] }[];
  methods: { label: string; on: string; style: string; go: Go }[];
  note: string;
  save: ActionVM;
  reset: ActionVM;
}
export interface PageVM {
  hasKpis: boolean; kpis: KpiVM[];
  hasTabs: boolean; tabs: TabVM[];
  hasChipsOrTools: boolean; chips: TabVM[]; tools: ActionVM[];
  isSettings: boolean; settings: SettingsVM;
  hasTable: boolean; table: TableVM;
  hasMinis: boolean; minis: MiniVM[];
}

// ---------- order detail ----------
export interface PhaseVM { label: string; sub: string; mark: string; dotStyle: string; lineStyle: string; labelStyle: string }
export interface StepVM { label: string; owner: string; meta: string; note: string; hasNote: boolean; dotStyle: string; labelStyle: string }
export interface InfoCardVM {
  title: string;
  rows: { k: string; v: string }[];
  list: { t: string; s: string; r: string; go: Go; style: string }[];
}
export interface NegotiationVM {
  key: string; count: string; current: string; empty: boolean; offerHint: string;
  msgs: { wrap: string; bubble: string; text: string; hasOffer: boolean; offer: string; offerStyle: string; meta: string; metaStyle: string }[];
  setText: Change; setOffer: Change; acts: ActionVM[];
}
export interface OrderDetailVM {
  id: string; kind: string; kindStyle: string; status: string; statusStyle: string; sub: string; value: string; stepCount: string;
  phaseGrid: string; phases: PhaseVM[]; steps: StepVM[]; cards: InfoCardVM[];
  next: {
    key: string; title: string; owner: string; toneStyle: string; role: string; hasRole: boolean; age: string; ageStyle: string;
    note: string; hasNote: boolean; hasFields: boolean; fields: InputVM[]; acts: ActionVM[]; signedAs: string;
  };
  hasNego?: boolean; nego?: NegotiationVM;
  cust: { name: string; business: string; country: string; contact: string; kyc: string; kycStyle: string; go: Go };
  hasManage?: boolean; manage?: ActionVM[];
  back: Go; backLabel: string;
}

// ---------- drawer ----------
export interface DrawerItemVM {
  t: string; s: string; r: string; rStyle: string; go: Go; style: string;
  hasImg: boolean; imgStyle: string; hasPh: boolean; phText: string; hasBtns: boolean; btns: ActionVM[];
}
export interface DrawerVM {
  open: boolean; key: string; pill: string; pillStyle: string; title: string; sub: string;
  hasPreview: boolean; hasPreviewImg: boolean; previewStyle: string; hasPreviewPh: boolean; previewPh: string;
  hasFields: boolean; fields: { k: string; v: string }[];
  hasText: boolean; text: string;
  sections: { title: string; items: DrawerItemVM[] }[];
  hasReply: boolean; replies: { label: string; go: Go }[]; replyText: string; setReply: Change;
  hasInputs: boolean; inputs: InputVM[];
  actions: ActionVM[];
  close: Go;
}
