import type { Tone } from '@/constants/tones';

export interface Account {
  name: string;
  org: string;
  email: string;
  tier: 1 | 2 | 3;
  status: 'Verified' | 'In review' | 'Expiring' | 'Rejected';
  tone: Tone;
  orders: number;
  joined: string;
}
