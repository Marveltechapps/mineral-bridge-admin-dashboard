import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TabBar } from '@/components/ui/Tabs';
import { ROUTES } from '@/constants/routes';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { TIER_REQUESTS } from '@/services/users';
import layout from '@/styles/layout.module.css';

export default function UsersShell() {
  const done = useConsole((s) => s.tierDone);
  const open = TIER_REQUESTS.filter((t) => !done[t.name]).length;
  return (
    <div className={layout.page}>
      <TabBar
        label="User views"
        tabs={[
          { label: 'All users', to: ROUTES.users },
          { label: `Tier change requests · ${open}`, to: ROUTES.usersTiers },
        ]}
        actions={
          <Button variant="secondary" h={36} px={14} r={12} icon="download" onClick={() => consoleActions.notify('User list exported as CSV')}>
            Export list
          </Button>
        }
      />
      <Outlet />
    </div>
  );
}
