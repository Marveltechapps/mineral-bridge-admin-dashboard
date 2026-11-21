import type { Tone } from '@/constants/tones';

export interface Negotiation {
  id: string;
  miner: string;
  trader: string;
  goods: string;
  ask: number;
  offer: number;
  rounds: number;
  status: 'Awaiting miner' | 'Awaiting trader' | 'Terms agreed' | 'Stalled';
  tone: Tone;
  last: string;
  history: Array<['Trader' | 'Miner', number]>;
}
