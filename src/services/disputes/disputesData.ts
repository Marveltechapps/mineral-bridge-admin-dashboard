import type { Dispute } from '@/types/disputes';

export const DISPUTES: Dispute[] = [
  { id: 'DSP-2026-0071', link: 'MB-SELL-41640', type: 'Assay result contested', party: 'Rift Valley Minerals Ltd', status: 'Evidence review', tone: 'blue', days: 3, value: '$412,000' },
  { id: 'DSP-2026-0069', link: 'AUC-2026-0219', type: 'Suspicious bidding pattern', party: 'Njoro Metals Ltd', status: 'Compliance hold', tone: 'amber', days: 1, value: '$5,940,000' },
  { id: 'DSP-2026-0066', link: 'MB-BUY-38702', type: 'Short delivery on parcel', party: 'Baringo Trading Co', status: 'Awaiting counterparty', tone: 'gray', days: 6, value: '$188,400' },
  { id: 'DSP-2026-0061', link: 'MB-SELL-41498', type: 'Settlement delay claim', party: 'Kilimapesa Mining Co-op', status: 'Evidence review', tone: 'blue', days: 9, value: '$744,000' },
  { id: 'DSP-2026-0058', link: 'MB-BUY-38511', type: 'Damaged seal on arrival', party: 'Coast Bullion Partners', status: 'Resolved — credit issued', tone: 'green', days: 14, value: '$62,000' },
];

export const DISPUTE_FILTERS = ['All disputes', 'Evidence review', 'Compliance hold', 'Awaiting counterparty', 'Resolved'] as const;

export const THREAD: Array<{ from: 'seller' | 'admin'; who: string; text: string; time: string }> = [
  { from: 'seller', who: 'Joseph Kiptoo · Rift Valley Minerals Ltd', text: 'The assay puts us at 88.1% Au but our own pre-shipment test read 91.4%. We are asking for an independent re-assay before settlement.', time: '08 Sep 2026 · 10:12' },
  { from: 'admin', who: 'F. Wanjiru · Support Agent', text: 'Noted. Uploading the sealed sample chain-of-custody record and the lab worksheet for review.', time: '08 Sep 2026 · 11:40' },
  { from: 'seller', who: 'Joseph Kiptoo · Rift Valley Minerals Ltd', text: 'Our site test certificate is attached. Sample was taken from the same drum.', time: '08 Sep 2026 · 14:05' },
  { from: 'admin', who: 'G. Kioko · Trading Desk Manager', text: 'Sarova Assay Labs has agreed to a split-sample re-run at our cost. Result expected 12 Sep. Settlement is paused until then.', time: '09 Sep 2026 · 09:18' },
  { from: 'seller', who: 'Joseph Kiptoo · Rift Valley Minerals Ltd', text: 'Agreed, thank you. We will hold the remaining consignment until the result.', time: '09 Sep 2026 · 09:44' },
];

export const OUTCOMES = ['Independent re-assay ordered', 'Settlement adjusted', 'Credit issued to counterparty', 'Claim rejected'];
