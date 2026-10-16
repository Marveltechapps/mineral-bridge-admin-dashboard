import type { Tone } from '@/constants/tones';

export type LotStatus = 'Listed' | 'In vault' | 'In auction' | 'Reserved' | 'Shipped';

export interface Lot {
  id: string;
  mineral: string;
  qty: string;
  grade: string;
  src: string;
  status: LotStatus;
  tone: Tone;
  days: number;
}
