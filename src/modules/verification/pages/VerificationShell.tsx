import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TabBar } from '@/components/ui/Tabs';
import { ROUTES } from '@/constants/routes';
import { useLiveList } from '@/hooks/useLiveList';
import { isDemoMode } from '@/lib/apiClient';
import { consoleActions } from '@/store/consoleStore';
import { KYC, TRACKED_DOCS, getKycSubmissions, getTrackedDocuments } from '@/services/verification';
import layout from '@/styles/layout.module.css';

export default function VerificationShell() {
  const navigate = useNavigate();
  const kyc = useLiveList(getKycSubmissions, KYC);
  const docs = useLiveList(getTrackedDocuments, TRACKED_DOCS);
  const kycCount = isDemoMode() ? 27 : kyc.rows.length;
  const docCount = isDemoMode() ? 9 : docs.rows.length;
  return (
    <div className={layout.page}>
      <TabBar
        label="Compliance views"
        tabs={[
          { label: `KYC queue · ${kycCount}`, to: ROUTES.verification },
          { label: `Document expiry monitor · ${docCount}`, to: ROUTES.verificationExpiry },
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
