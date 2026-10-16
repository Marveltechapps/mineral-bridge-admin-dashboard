import { useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { consoleActions, useConsole } from '@/store/consoleStore';

/**
 * Renders the global form drawer requested by any screen via
 * consoleActions.openDrawer(). Field defaults, CTA labels and confirmation
 * messages come from the requesting screen (same configs as the design).
 */
export function DrawerHost() {
  const drawer = useConsole((s) => s.drawer);
  const close = useCallback(() => consoleActions.closeDrawer(), []);
  if (!drawer) return null;

  const submit = () => {
    consoleActions.closeDrawer();
    consoleActions.notify(drawer.done);
  };
  const saveDraft = () => {
    consoleActions.closeDrawer();
    consoleActions.notify(drawer.draft || 'Saved as a draft');
  };

  return (
    <Modal
      title={drawer.title}
      sub={drawer.sub}
      onClose={close}
      footer={
        <>
          <Button variant="primary" h={46} r={13} fs={13.5} onClick={submit}>
            {drawer.cta}
          </Button>
          <Button variant="secondary" h={40} r={13} fs={12.5} onClick={saveDraft}>
            {drawer.secondary || 'Save as draft'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{ display: 'contents' }}
      >
        {drawer.fields.map((f) => {
          const hint = f.hint || `Enter ${f.label.toLowerCase()}`;
          return (
            <label key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text size={11} weight={800} ls={0.7} tone="ink2">
                {f.label}
              </Text>
              {f.kind === 'area' ? (
                <TextArea rows={4} defaultValue={f.value || ''} placeholder={hint} fs={13} fw={500} />
              ) : (
                <Input h={44} r={12} px={14} fs={13.5} defaultValue={f.value || ''} placeholder={hint} />
              )}
              <Text size={10.5} weight={600} tone="ink3">
                {hint}
              </Text>
            </label>
          );
        })}
      </form>
    </Modal>
  );
}
