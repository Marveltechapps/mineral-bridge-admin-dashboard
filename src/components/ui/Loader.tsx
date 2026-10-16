/**
 * Route-level fallback shown while a lazily loaded module chunk downloads.
 * Uses the design's mbSpin keyframe and brand colours.
 */
export function Loader({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 12,
          border: '2px solid var(--line2)',
          borderTopColor: 'var(--brandInk)',
          animation: 'mbSpin .8s linear infinite',
        }}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
