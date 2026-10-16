import type { CSSProperties, ElementType, ReactNode } from 'react';

export type TextTone =
  | 'ink'
  | 'ink2'
  | 'ink3'
  | 'brand'
  | 'info'
  | 'ok'
  | 'warn'
  | 'err'
  | 'goldInk'
  | 'gold'
  | 'white'
  | 'white60'
  | 'white58'
  | 'white62'
  | 'inherit';

const TONE: Record<TextTone, string | undefined> = {
  ink: 'var(--ink)',
  ink2: 'var(--ink2)',
  ink3: 'var(--ink3)',
  brand: 'var(--brandInk)',
  info: 'var(--infoInk)',
  ok: 'var(--okInk)',
  warn: 'var(--warnInk)',
  err: 'var(--errInk)',
  goldInk: 'var(--goldInk)',
  gold: '#F3D27A',
  white: '#fff',
  white60: 'rgba(255,255,255,.6)',
  white58: 'rgba(255,255,255,.58)',
  white62: 'rgba(255,255,255,.62)',
  inherit: undefined,
};

export interface TextProps {
  as?: ElementType;
  size?: number;
  weight?: 400 | 500 | 600 | 700 | 800;
  tone?: TextTone;
  /** Letter spacing in px (the design specifies it in px). */
  ls?: number;
  lh?: number | string;
  font?: 'display' | 'mono';
  align?: 'left' | 'right' | 'center';
  nowrap?: boolean;
  ellipsis?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
}

/**
 * Typography primitive. The design specifies every text run with explicit
 * size/weight/colour values; this keeps those values exact while routing
 * colour through theme tokens.
 */
export function Text({
  as: Tag = 'span',
  size,
  weight,
  tone,
  ls,
  lh,
  font,
  align,
  nowrap,
  ellipsis,
  className,
  style,
  children,
  id,
}: TextProps) {
  const s: CSSProperties = {
    fontSize: size,
    fontWeight: weight,
    color: tone ? TONE[tone] : undefined,
    letterSpacing: ls !== undefined ? `${ls}px` : undefined,
    lineHeight: lh,
    fontFamily: font === 'display' ? "'Poppins'" : font === 'mono' ? 'var(--font-mono)' : undefined,
    textAlign: align,
    whiteSpace: nowrap || ellipsis ? 'nowrap' : undefined,
    overflow: ellipsis ? 'hidden' : undefined,
    textOverflow: ellipsis ? 'ellipsis' : undefined,
    ...style,
  };
  return (
    <Tag className={className} style={s} id={id}>
      {children}
    </Tag>
  );
}

/** Uppercase section label ("eyebrow") used above most cards in the design. */
export function Eyebrow({
  children,
  ls = 1.2,
  size = 10.5,
  tone = 'ink3',
  style,
  as,
}: {
  children: ReactNode;
  ls?: number;
  size?: number;
  tone?: TextTone;
  style?: CSSProperties;
  as?: ElementType;
}) {
  return (
    <Text as={as} size={size} weight={800} ls={ls} tone={tone} style={style}>
      {children}
    </Text>
  );
}
