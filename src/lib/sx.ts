import type { CSSProperties } from 'react';

// The console engine describes dynamic styles (pills, active tabs, table grids…) as CSS
// declaration strings, exactly as the design writes them. sx() turns one into a React style
// object. Results are cached because the same strings repeat on every row and render.

const cache = new Map<string, CSSProperties>();
const MAX_ENTRIES = 5000;

const toKey = (prop: string) =>
  prop.startsWith('--') ? prop : prop.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_m, ch: string) => ch.toUpperCase());

function parse(css: string): CSSProperties {
  const style: Record<string, string> = {};
  let depth = 0, quote = '', start = 0;
  const take = (end: number) => {
    const decl = css.slice(start, end), colon = decl.indexOf(':');
    if (colon > 0) {
      const prop = decl.slice(0, colon).trim(), value = decl.slice(colon + 1).trim();
      if (prop && value) style[toKey(prop)] = value;
    }
    start = end + 1;
  };
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (quote) { if (ch === '\\') i++; else if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) take(i);
  }
  take(css.length);
  return style as CSSProperties;
}

export function sx(css: string | null | undefined): CSSProperties | undefined {
  if (!css) return undefined;
  let style = cache.get(css);
  if (!style) {
    if (cache.size >= MAX_ENTRIES) cache.clear();
    style = parse(css);
    cache.set(css, style);
  }
  return style;
}
