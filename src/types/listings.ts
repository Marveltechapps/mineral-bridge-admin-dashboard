import type { Tone } from '@/constants/tones';

export interface Listing {
  id: string;
  lot: string;
  mineral: string;
  grade: string;
  qtyTotal: string;
  qtyLeft: string;
  price: string;
  value: string;
  status: 'Live' | 'Paused' | 'Scheduled' | 'Sold out' | 'Draft' | 'Ended';
  tone: Tone;
  access: string;
  views: number;
  enquiries: number;
  listed: string;
  featured: boolean;
}
