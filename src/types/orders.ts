import type { Stage } from '@/constants/tones';

export interface OrderRow {
  id: string;
  mineral: string;
  side: 'Buy' | 'Sell';
  party: string;
  qty: string;
  stage: Stage;
  days: number;
  agent: string;
  tier: number;
}

export interface OrderExtra {
  contact: string;
  phone: string;
  done: number;
  rate: string;
  value: string;
  origin: string;
  hub: string;
  carrier: string;
  dest: string;
  lab: string;
  escrow: string;
  opened: string;
  seal: string;
}

export interface IntakeItem {
  id: string;
  party: string;
  mineral: string;
  qty: string;
  grade: string;
  rate: string;
  suggested: string;
  docs: string[];
  photos: string;
}
