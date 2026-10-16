import type { CSSProperties } from 'react';
import { consoleActions, useConsole } from '@/store/consoleStore';

/**
 * Port of the design's editGate(): a read-only form section that flips into
 * edit mode, with matching field styles and the blue "EDITING" badge.
 */
export function useEditGate(key: string, doneMsg: string) {
  const on = useConsole((s) => !!s.editing[key]);
  const field: CSSProperties = {
    height: 42,
    borderRadius: 12,
    padding: '0 13px',
    fontSize: 13,
    fontWeight: 700,
    width: '100%',
    border: `1px solid ${on ? 'var(--line3)' : 'var(--line)'}`,
    background: on ? 'var(--surf)' : 'var(--surf2)',
    color: on ? 'var(--ink)' : 'var(--ink2)',
    cursor: on ? 'text' : 'default',
    transition: 'border-color .18s ease, background .18s ease, color .18s ease',
  };
  const small: CSSProperties = { ...field, height: 40, cursor: undefined };
  return {
    on,
    off: !on,
    readOnly: !on,
    edit: () => consoleActions.setEditing(key, true),
    cancel: () => consoleActions.setEditing(key, false),
    save: () => {
      consoleActions.setEditing(key, false);
      consoleActions.notify(doneMsg);
    },
    field,
    small,
  };
}
