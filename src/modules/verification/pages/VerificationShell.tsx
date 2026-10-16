import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TabBar } from '@/components/ui/Tabs';
import { ROUTES } from '@/constants/routes';
import { consoleActions } from '@/store/consoleStore';
import layout from '@/styles/layout.module.css';

export default function VerificationShell() {
  const navigate = useNavigate();
  return (
    <div className={layout.page}>
      <TabBar
        label="Compliance views"
        tabs={[
          { label: 'KYC queue · 27', to: ROUTES.verification },
          { label: 'Document expiry monitor · 9', to: ROUTES.verificationExpiry },
        ]}
        actions={
          <Button
            variant="secondary"
            h={36}
            px={14}
            r={12}
            icon="filter"
            onClick={() => {
              consoleActions.set((s) => ({ filters: { ...s.filters, verTier: 'Overdue SLA' } }));
              consoleActions.notify('Filtered to submissions past the 48 h SLA');
              navigate(ROUTES.verification);
            }}
          >
            SLA view
          </Button>
        }
      />
      <Outlet />
    </div>
  );
}
