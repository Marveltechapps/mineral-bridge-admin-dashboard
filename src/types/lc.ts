export type LcStage = 'Requested' | 'Issued' | 'Shipped' | 'Docs presented' | 'Paid';

export interface LetterOfCredit {
  id: string;
  applicant: string;
  beneficiary: string;
  goods: string;
  amount: number;
  bank: string;
  status: LcStage;
  expiry: string;
  /** Days until expiry (negative once settled, null before issuance). */
  days: number | null;
  discrepancies: string[];
  order: string;
}
