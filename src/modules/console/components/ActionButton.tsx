import { sx } from '../../../lib/sx';
import type { ActionVM } from '../../../types/console';

/** A console button whose look (primary, secondary, danger, success, locked) comes from the engine. */
export function ActionButton({ action }: { action: ActionVM }) {
  return <button type="button" onClick={action.go} style={sx(action.style)}>{action.label}</button>;
}

export function ActionButtons({ actions }: { actions: ActionVM[] }) {
  return <>{actions.map((a, i) => <ActionButton key={i} action={a} />)}</>;
}
