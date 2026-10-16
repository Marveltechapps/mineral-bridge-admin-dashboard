import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  /** 18px (default, list cards) or 20px (detail cards) corner radius. */
  radius?: 18 | 20;
  padding?: CSSProperties['padding'];
  lift?: boolean;
  clip?: boolean;
  variant?: 'default' | 'dark' | 'dashed';
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Surface card used throughout the console (white card or navy gradient card). */
export function Card({
  radius = 18,
  padding,
  lift,
  clip,
  variant = 'default',
  onClick,
  ariaLabel,
  className,
  style,
  children,
}: CardProps) {
  const cls = [
    styles.card,
    radius === 20 && styles.r20,
    clip && styles.clip,
    lift && styles.lift,
    onClick && styles.clickable,
    variant === 'dark' && styles.dark,
    variant === 'dashed' && styles.dashed,
    padding !== undefined && styles.padResponsive,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const onKeyDown = onClick
    ? (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;
  return (
    <div
      className={cls}
      style={{ padding, ...style }}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
