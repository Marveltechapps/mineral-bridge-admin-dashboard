import type { Tone } from '@/constants/tones';

export interface Dispute {
  id: string;
  link: string;
  type: string;
  party: string;
  status: string;
  tone: Tone;
  days: number;
  value: string;
}
