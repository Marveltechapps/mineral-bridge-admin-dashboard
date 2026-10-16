import { memo } from 'react';

/** Area + line chart of the focused rate (geometry identical to the design's SVG). */
export const RateChart = memo(function RateChart({ hist, label }: { hist: number[]; label: string }) {
  const min = Math.min(...hist) * 0.994;
  const max = Math.max(...hist) * 1.006;
  const pts = hist.map((v, i) => [(i / (hist.length - 1)) * 660 + 20, 170 - ((v - min) / (max - min)) * 140]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L680 180 L20 180 Z`;
  return (
    <svg viewBox="0 0 700 200" width="100%" height={200} preserveAspectRatio="none" role="img" aria-label={label}>
      <defs>
        <linearGradient id="rateFill" x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0%" style={{ stopColor: 'var(--chFill)', stopOpacity: 0.16 }} />
          <stop offset="100%" style={{ stopColor: 'var(--chFill)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={20} x2={680} y1={30 + i * 46.7} y2={30 + i * 46.7} style={{ stroke: 'var(--chGrid)' }} strokeWidth={1} />
      ))}
      <path d={area} fill="url(#rateFill)" />
      <path d={line} fill="none" style={{ stroke: 'var(--chLine)' }} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => {
        const last = i === pts.length - 1;
        return (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={last ? 5 : 3}
            style={{ fill: last ? 'var(--chGold)' : 'var(--chDot)', stroke: last ? 'var(--chDot)' : 'var(--chLine)' }}
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
});
