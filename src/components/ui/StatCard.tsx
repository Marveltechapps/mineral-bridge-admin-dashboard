import type { ReactNode } from 'react';
import { Card } from './Card';
import { Text, type TextTone } from './Text';

/**
 * "LABEL / big number / sub-line" card used in every 4-up stat grid
 * (vault, listings, LC, collaboration, academy, financial, analytics).
 */
export function StatCard({
  label,
  value,
  sub,
  subTone = 'ink2',
  onClick,
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  subTone?: TextTone;
  onClick?: () => void;
}) {
  return (
    <Card lift padding={18} onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Text size={10.5} weight={800} ls={1.1} tone="ink3">
        {label}
      </Text>
      <Text font="display" size={27} weight={700} ls={-0.8} tone="ink" lh={1}>
        {value}
      </Text>
      <Text size={11.5} weight={600} tone={subTone}>
        {sub}
      </Text>
    </Card>
  );
}
