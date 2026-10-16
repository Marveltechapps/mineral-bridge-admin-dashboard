import type { CSSProperties, ElementType, ReactNode } from 'react';

export interface StackProps {
  as?: ElementType;
  dir?: 'row' | 'col';
  gap?: number | string;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
  flex?: CSSProperties['flex'];
  minW0?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Flexbox layout primitive mirroring the design's inline flex containers. */
export function Stack({
  as: Tag = 'div',
  dir = 'col',
  gap,
  align,
  justify,
  wrap,
  flex,
  minW0,
  className,
  style,
  children,
}: StackProps) {
  const s: CSSProperties = {
    display: 'flex',
    flexDirection: dir === 'col' ? 'column' : 'row',
    gap,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : undefined,
    flex,
    minWidth: minW0 ? 0 : undefined,
    ...style,
  };
  return (
    <Tag className={className} style={s}>
      {children}
    </Tag>
  );
}
