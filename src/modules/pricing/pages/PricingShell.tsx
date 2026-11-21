import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { PulseDot } from '@/components/ui/Misc';
import { TabBar } from '@/components/ui/Tabs';
import { ROUTES } from '@/constants/routes';
import { consoleActions } from '@/store/consoleStore';
import layout from '@/styles/layout.module.css';

export default function PricingShell() {
  return (
    <div className={layout.page}>
      <TabBar
        label="Pricing views"
        tabs={[
          { label: 'Live rate table', to: ROUTES.pricing },
          { label: 'Firm offer approvals', to: ROUTES.pricingOffers },
        ]}
        actions={
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, letterSpacing: '.6px', color: 'var(--okInk)' }}>
              <PulseDot />
              FEED LIVE · SYNCED 2 MIN AGO
            </span>
            <Button variant="secondary" h={36} px={14} r={12} icon="download" onClick={() => consoleActions.notify('Rate table exported as CSV')}>
              Export rates
            </Button>
          </>
        }
      />
      <Outlet />
    </div>
  );
}
