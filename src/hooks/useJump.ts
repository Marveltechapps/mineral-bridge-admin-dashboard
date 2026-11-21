import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { consoleActions } from '@/store/consoleStore';

/**
 * Resolves free text (an activity line, audit record, notification) to the
 * screen that owns the referenced record. Same rules and precedence as the
 * design's jump() helper.
 */
export function resolveJump(text: string): string {
  const t = String(text);
  const order = t.match(/MB-(?:SELL|BUY)-\d+/)?.[0];
  const lot = t.match(/MBV-\d{4}-\d+/)?.[0];
  const auc = t.match(/AUC-\d{4}-\d+/)?.[0];
  const dsp = t.match(/DSP-\d{4}-\d+/)?.[0];
  const tkt = t.match(/TKT-\d+/)?.[0];
  const stl = t.match(/STL-\d{4}-\d+/)?.[0];
  const mbl = t.match(/MBL-\d{4}-\d+/)?.[0];

  if (mbl) return ROUTES.listing(mbl);
  if (/catalog|listing/i.test(t)) return ROUTES.listings;
  if (order) return ROUTES.order(order);
  if (lot) return ROUTES.lot(lot);
  if (auc) return ROUTES.auctionMonitor(auc);
  if (dsp) return ROUTES.dispute(dsp);
  if (tkt) return ROUTES.support;
  if (stl) return ROUTES.financial;
  if (/KYC|permit|document|expir/i.test(t)) return /expir/i.test(t) ? ROUTES.verificationExpiry : ROUTES.verification;
  if (/Tier change|tier change/.test(t)) return ROUTES.usersTiers;
  if (/rate|offer/i.test(t)) return /offer/i.test(t) ? ROUTES.pricingOffers : ROUTES.pricing;
  if (/consignment|intake/i.test(t)) return ROUTES.ordersIntake;
  if (/Academy|lesson/i.test(t)) return ROUTES.academy;
  if (/carrier|hub|capacity|Carrier/i.test(t)) return ROUTES.partners;
  if (/settlement|escrow/i.test(t)) return ROUTES.financial;
  if (/ticket/i.test(t)) return ROUTES.support;
  return ROUTES.audit;
}

export function useJump() {
  const navigate = useNavigate();
  return useCallback(
    (text: string) => {
      consoleActions.set({ drawer: null, editing: {}, allocMode: 'catalog' });
      navigate(resolveJump(text));
    },
    [navigate],
  );
}
