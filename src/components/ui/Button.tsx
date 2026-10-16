import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import type { IconName } from '@/constants/icons';
import styles from './Button.module.css';
import { Icon } from './Icon';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'secondaryInk'
  | 'secondaryBrand'
  | 'outline'
  | 'outlineLift'
  | 'success'
  | 'dangerSoft'
  | 'warnSoft'
  | 'warnSolid'
  | 'gold'
  | 'goldNoBorder'
  | 'glass'
  | 'glassSubtle'
  | 'glassDanger'
  | 'glassGold'
  | 'muted'
  | 'link'
  | 'back'
  | 'quiet';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant;
  /** Height in px (design values range 30–48). */
  h?: number;
  /** Horizontal padding in px. */
  px?: number;
  /** Corner radius in px. */
  r?: number;
  /** Font size in px. */
  fs?: number;
  fw?: 700 | 800;
  gap?: number;
  block?: boolean;
  icon?: IconName;
  iconSize?: number;
  /** Icon placed after the label instead of before it. */
  iconEnd?: IconName;
  /** Suppress the hover treatment (the design leaves some buttons without one). */
  noHover?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Button covering every button treatment in the design, sized with exact pixel values. */
export function Button({
  variant = 'secondary',
  h,
  px,
  r = 12,
  fs = 12.5,
  fw,
  gap,
  block,
  icon,
  iconSize = 14,
  iconEnd,
  noHover,
  className,
  style,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const cls = [styles.btn, styles[variant], block && styles.block, noHover && styles.static, className].filter(Boolean).join(' ');
  const s: CSSProperties = {
    height: h,
    padding: px !== undefined ? `0 ${px}px` : h ? undefined : 0,
    borderRadius: r,
    fontSize: fs,
    fontWeight: fw,
    gap,
    ...style,
  };
  return (
    <button type={type} className={cls} style={s} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={iconSize} />}
    </button>
  );
}

/** "← Back to …" link used at the top of every detail view. */
export function BackButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="back" fs={12.5} icon="arrowLeft" iconSize={15} onClick={onClick}>
      {children}
    </Button>
  );
}
