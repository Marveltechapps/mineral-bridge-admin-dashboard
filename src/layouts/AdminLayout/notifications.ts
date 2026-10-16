import type { Tone } from '@/constants/tones';

export interface BellItem {
  text: string;
  meta: string;
  tone: Tone;
  /** Text passed to the jump resolver to open the related record. */
  target: string;
}

export const BELL_ITEMS: BellItem[] = [
  { text: '4 KYC reviews past SLA', meta: 'Compliance queue · oldest 3 days', tone: 'amber', target: 'KYC' },
  { text: 'AUC-2026-0219 flagged', meta: 'Linked-account bidding pattern', tone: 'red', target: 'AUC-2026-0219' },
  { text: '6 firm offers awaiting approval', meta: 'Assay in, offer not yet sent', tone: 'blue', target: 'offer' },
  { text: 'Export permit EP-KE-88412 expiring', meta: 'Mombasa Metals Exchange · 21 days', tone: 'amber', target: 'document expiring' },
  { text: 'Lot MBV-2026-0388 held 46 days', meta: 'Over the 45-day target', tone: 'gold', target: 'MBV-2026-0388' },
];
