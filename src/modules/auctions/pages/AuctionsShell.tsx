import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TabBar } from '@/components/ui/Tabs';
import { ROUTES } from '@/constants/routes';
import { useEffect, useState } from 'react';
import { isDemoMode } from '@/lib/apiClient';
import { LIVE, UPCOMING, getAuctionCounts } from '@/services/auctions';
import layout from '@/styles/layout.module.css';

export default function AuctionsShell() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<{ live: number; upcoming: number; ended: number } | null>(null);
  useEffect(() => {
    if (isDemoMode()) return;
    const ac = new AbortController();
    getAuctionCounts(ac.signal).then((next) => {
      if (!ac.signal.aborted) setCounts(next);
    }).catch(() => undefined);
    return () => ac.abort();
  }, []);
  const demo = isDemoMode();
  return (
    <div className={layout.page}>
      <TabBar
        label="Auction views"
        tabs={[
          { label: demo ? `Live · ${LIVE.length}` : counts ? `Live · ${counts.live}` : 'Live', to: ROUTES.auctions },
          { label: demo ? `Upcoming · ${UPCOMING.length}` : counts ? `Upcoming · ${counts.upcoming}` : 'Upcoming', to: ROUTES.auctionsUpcoming },
          { label: demo ? 'Ended · 38' : counts ? `Ended · ${counts.ended}` : 'Ended', to: ROUTES.auctionsEnded },
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
