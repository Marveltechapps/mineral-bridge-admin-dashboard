import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TabBar } from '@/components/ui/Tabs';
import { ROUTES } from '@/constants/routes';
import { LIVE, UPCOMING } from '@/services/auctions';
import layout from '@/styles/layout.module.css';

export default function AuctionsShell() {
  const navigate = useNavigate();
  return (
    <div className={layout.page}>
      <TabBar
        label="Auction views"
        tabs={[
          { label: `Live · ${LIVE.length}`, to: ROUTES.auctions },
          { label: `Upcoming · ${UPCOMING.length}`, to: ROUTES.auctionsUpcoming },
          { label: 'Ended · 38', to: ROUTES.auctionsEnded },
        ]}
        actions={
          <Button variant="primary" h={36} px={14} r={12} icon="plus" onClick={() => navigate(ROUTES.auctionCreate)}>
            Create auction
          </Button>
        }
      />
      <Outlet />
    </div>
  );
}
