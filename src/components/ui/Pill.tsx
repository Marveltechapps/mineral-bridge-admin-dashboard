import type { CSSProperties, ReactNode } from 'react';
import type { Tone } from '@/constants/tones';
import styles from './Pill.module.css';

interface PillProps {
  tone: Tone;
  /** Overrides used by the design for larger/smaller pills (e.g. font-size:11.5px; padding:4px 11px). */
  fontSize?: number;
  padding?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** Uppercase status pill. */
export function Pill({ tone, fontSize, padding, style, children }: PillProps) {
  return (
    <span className={`${styles.pill} ${styles[tone]}`} style={{ fontSize, padding, ...style }}>
      {children}
    </span>
  );
}
