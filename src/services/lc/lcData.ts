import type { Tone } from '@/constants/tones';
import type { LcStage, LetterOfCredit } from '@/types/lc';

export const LC_STAGES = ['Requested', 'Issued', 'Shipped', 'Docs presented', 'Paid'] as const satisfies readonly LcStage[];

export const LC_STAGE_TONE: Record<LcStage, Tone> = {
  Requested: 'gray',
  Issued: 'blue',
  Shipped: 'violet',
  'Docs presented': 'amber',
  Paid: 'green',
};

export const LCS: LetterOfCredit[] = [
  { id: 'LC-2026-0422', applicant: 'Athi River Refinery Ltd', beneficiary: 'Kilimapesa Mining Co-op', goods: 'Gold Concentrate · 7.2 kg', amount: 492840, bank: 'KCB Bank Kenya', status: 'Docs presented', expiry: '30 Oct 2026', days: 9, discrepancies: [], order: 'MB-SELL-41877' },
  { id: 'LC-2026-0418', applicant: 'Coast Bullion Partners', beneficiary: 'Rift Valley Minerals Ltd', goods: 'Gold Concentrate · 18.4 kg', amount: 1174000, bank: 'KCB Bank Kenya', status: 'Docs presented', expiry: '14 Oct 2026', days: 4, discrepancies: ['Bill of lading dated after latest shipment date', 'Assay certificate weight 18.21 kg vs 18.4 kg invoiced'], order: 'MB-SELL-41982' },
  { id: 'LC-2026-0415', applicant: 'Athi River Refinery Ltd', beneficiary: 'Machakos Mining SME', goods: 'Platinum Sponge · 42 kg', amount: 1312080, bank: 'Equity Bank', status: 'Shipped', expiry: '19 Oct 2026', days: 9, discrepancies: [], order: 'MB-BUY-38904' },
  { id: 'LC-2026-0412', applicant: 'Mombasa Metals Exchange', beneficiary: 'Nyanza Smelting Ltd', goods: 'Copper Cathode · 64 t', amount: 629760, bank: 'Standard Chartered KE', status: 'Issued', expiry: '02 Nov 2026', days: 23, discrepancies: [], order: 'MB-SELL-41903' },
  { id: 'LC-2026-0409', applicant: 'Eldoret Assay Holdings', beneficiary: 'Samburu Aggregates', goods: 'Lithium Spodumene · 112 t', amount: 142016, bank: 'NCBA Bank', status: 'Docs presented', expiry: '12 Oct 2026', days: 2, discrepancies: ['Certificate of origin missing issuing chamber stamp'], order: 'MB-SELL-41918' },
  { id: 'LC-2026-0405', applicant: 'Coast Bullion Partners', beneficiary: 'Turkana Gold SACCO', goods: 'Silver Bullion · 640 kg', amount: 721920, bank: 'Absa Bank Kenya', status: 'Paid', expiry: '28 Sep 2026', days: -12, discrepancies: [], order: 'MB-SELL-41940' },
  { id: 'LC-2026-0401', applicant: 'Baringo Trading Co', beneficiary: 'Kilimapesa Mining Co-op', goods: 'Gold Concentrate · 7.2 kg', amount: 492840, bank: 'KCB Bank Kenya', status: 'Requested', expiry: '—', days: null, discrepancies: [], order: 'MB-SELL-41877' },
  { id: 'LC-2026-0398', applicant: 'Athi River Refinery Ltd', beneficiary: 'Kakamega Artisanal Group', goods: 'Tantalite (Coltan) · 2.8 t', amount: 143360, bank: 'Equity Bank', status: 'Issued', expiry: '17 Oct 2026', days: 7, discrepancies: [], order: 'MB-SELL-41964' },
  { id: 'LC-2026-0394', applicant: 'Nyanza Smelting Ltd', beneficiary: 'Rift Valley Minerals Ltd', goods: 'Cobalt Hydroxide · 18 t', amount: 613800, bank: 'Stanbic Bank Kenya', status: 'Shipped', expiry: '15 Oct 2026', days: 5, discrepancies: ['Insurance certificate covers 100% not the required 110% of invoice'], order: 'MB-BUY-38871' },
  { id: 'LC-2026-0390', applicant: 'Mombasa Metals Exchange', beneficiary: 'Machakos Mining SME', goods: 'Platinum Sponge · 11 kg', amount: 343640, bank: 'Absa Bank Kenya', status: 'Paid', expiry: '21 Sep 2026', days: -19, discrepancies: [], order: 'MB-SELL-41889' },
  { id: 'LC-2026-0386', applicant: 'Coast Bullion Partners', beneficiary: 'Turkana Gold SACCO', goods: 'Tin Ingot · 36 t', amount: 1173600, bank: 'Standard Chartered KE', status: 'Docs presented', expiry: '11 Oct 2026', days: 1, discrepancies: ['Packing list gross weight does not match bill of lading', 'Invoice beneficiary name differs from LC', 'Late presentation — 23 days after shipment'], order: 'MB-BUY-38860' },
];

export const LC_STATS = [
  { label: 'OPEN LCS', value: '8', sub: '$5.85M outstanding' },
  { label: 'EXPIRING ≤ 7 DAYS', value: '5', sub: '2 within 48 hours' },
  { label: 'WITH DISCREPANCIES', value: '4', sub: '7 open items to resolve' },
  { label: 'PAID THIS MONTH', value: '$1.07M', sub: '2 LCs settled' },
];

export const LC_FILTERS = ['All LCs', 'Requested', 'Issued', 'Shipped', 'Docs presented', 'Paid', 'Expiring ≤ 7 days', 'With discrepancies'] as const;

export const isExpiring = (l: LetterOfCredit) => l.days !== null && l.days >= 0 && l.days <= 7 && l.status !== 'Paid';

/** Document check list for an LC: status depends on stage and which documents the bank flagged. */
export function lcDocuments(l: LetterOfCredit) {
  const idx = LC_STAGES.indexOf(l.status);
  const d = l.discrepancies.join(' ').toLowerCase();
  return ['Commercial invoice', 'Bill of lading', 'Certificate of origin', 'Assay certificate', 'Insurance certificate', 'Packing list'].map((name) => {
    const key = (name.split(' ')[0] ?? name).toLowerCase();
    const flagged = d.indexOf(key) >= 0 || (key === 'commercial' && d.indexOf('invoice') >= 0);
    const status = idx < 3 ? (idx < 2 ? 'Not required yet' : 'Awaiting') : flagged ? 'Discrepant' : 'Compliant';
    const tone: Tone = status === 'Compliant' ? 'green' : status === 'Discrepant' ? 'red' : 'gray';
    return { name, status, tone };
  });
}
