import type { Tone } from '@/constants/tones';

export interface Account {
  id?: string;
  name: string;
  org: string;
  email: string;
  tier: 1 | 2 | 3;
  status: 'Verified' | 'In review' | 'Expiring' | 'Rejected' | 'Suspended';
  tone: Tone;
  orders: number;
  joined: string;
}
