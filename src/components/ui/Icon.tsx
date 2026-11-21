import { memo } from 'react';
import { ICONS, type IconName } from '@/constants/icons';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** Stroke icon rendered exactly like the design's svg() helper. */
export const Icon = memo(function Icon({ name, size = 17, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name].map((shape, i) => {
        if (shape[0] === 'circle') return <circle key={i} cx={shape[1]} cy={shape[2]} r={shape[3]} />;
        if (shape[0] === 'rect') return <rect key={i} x={shape[1]} y={shape[2]} width={shape[3]} height={shape[4]} rx={2} />;
        return <path key={i} d={shape[1]} />;
      })}
    </svg>
  );
});
