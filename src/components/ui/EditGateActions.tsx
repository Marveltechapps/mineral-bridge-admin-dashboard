import { Button } from './Button';

/**
 * Edit / Cancel / Save buttons for a read-only section (design's editGate UI).
 * `h` is 34 for most sections and 36 for the Bitcoin settings card.
 */
export function EditGateActions({
  on,
  onEdit,
  onCancel,
  onSave,
  editLabel,
  h = 34,
  variantEdit = 'outline',
}: {
  on: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  editLabel: string;
  h?: number;
  variantEdit?: 'outline' | 'outlineLift';
}) {
  if (!on) {
    return (
      <Button variant={variantEdit} h={h} px={14} r={12} icon="edit" onClick={onEdit}>
        {editLabel}
      </Button>
    );
  }
  return (
    <>
      <Button variant="secondary" h={h} px={14} r={12} onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="success" h={h} px={14} r={12} icon="check" onClick={onSave}>
        Save changes
      </Button>
    </>
  );
}
