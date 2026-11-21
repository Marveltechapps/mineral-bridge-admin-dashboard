/** Blue "EDITING" badge shown next to a section title while its edit gate is open. */
export function EditingBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'var(--tBlue)',
        color: 'var(--infoInk)',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '.7px',
      }}
    >
      EDITING
    </span>
  );
}
