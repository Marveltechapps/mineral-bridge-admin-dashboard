import type { Tone } from '@/constants/tones';

export interface ChainEvent {
  type: 'PASSPORT MINT' | 'CUSTODY TRANSFER' | 'LC EVENT' | 'BTC SETTLEMENT' | 'BITCOIN ANCHOR';
  ref: string;
  desc: string;
  hash: string;
  time: string;
  status: 'Confirmed' | 'Pending';
  tone: Tone;
}
