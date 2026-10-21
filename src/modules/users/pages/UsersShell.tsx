import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TabBar } from '@/components/ui/Tabs';
import { ROUTES } from '@/constants/routes';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { useLiveList } from '@/hooks/useLiveList';
import { isDemoMode } from '@/lib/apiClient';
import { formatAuthError } from '@/services/auth';
import { TIER_REQUESTS, getTierRequests } from '@/services/users';
import layout from '@/styles/layout.module.css';

export default function UsersShell() {
  const done = useConsole((s) => s.tierDone);
  const requests = useLiveList(getTierRequests, TIER_REQUESTS);
  const open = requests.rows.filter((t) => !done[t.name]).length;
  return (
    <div className={layout.page}>
      <TabBar
        label="User views"
        tabs={[
          { label: 'All users', to: ROUTES.users },
          { label: `Tier change requests · ${open}`, to: ROUTES.usersTiers },
        ]}
        actions={
          <Button variant="secondary" h={36} px={14} r={12} icon="download" onClick={() => {
            if (isDemoMode()) {
              consoleActions.notify('User list exported as CSV');
              return;
            }
            const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
            void fetch(`${base}/admin/v1/users/export`, { credentials: 'include' })
              .then(async (res) => {
                if (!res.ok) throw new Error('The user list was not exported.');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'users.csv';
                link.click();
                URL.revokeObjectURL(url);
                consoleActions.notify('User list exported as CSV');
              })
              .catch((err: unknown) => consoleActions.notify(formatAuthError(err, 'The user list was not exported.')));
          }}>
            Export list
          </Button>
        }
      />
      <Outlet />
    </div>
  );
}
