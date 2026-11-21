import { Icon } from '@/components/ui/Icon';
import { useConsole } from '@/store/consoleStore';

/** Bottom-right confirmation toasts (auto-dismiss after 3.2s). */
export function Toasts() {
  const notices = useConsole((s) => s.notices);
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 26,
        bottom: 26,
        left: 26,
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {notices.map((n) => (
        <div
          key={n.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '12px 16px',
            borderRadius: 14,
            background: '#1E2A5A',
            color: '#fff',
            boxShadow: '0 16px 34px rgba(20,26,46,.26)',
            maxWidth: 380,
            animation: 'mbToastIn .28s cubic-bezier(.2,.8,.2,1)',
            pointerEvents: 'auto',
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              background: 'rgba(22,163,74,.26)',
              color: '#7FE3A1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="check" size={15} />
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{n.text}</span>
        </div>
      ))}
    </div>
  );
}
