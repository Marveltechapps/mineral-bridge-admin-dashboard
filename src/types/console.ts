export type Theme = 'light' | 'dark';

export interface SortState {
  k: string | null;
  d: 1 | -1;
}

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
}

export interface Notice {
  id: number;
  text: string;
}

export type AllocMode = 'catalog' | 'auction' | 'reserve';
export type RateRange = '12W' | '6M' | '1Y';
