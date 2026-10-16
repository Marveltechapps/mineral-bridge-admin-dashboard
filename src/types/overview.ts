import type { Tone } from '@/constants/tones';
import type { IconName } from '@/constants/icons';

export interface ActivityItem {
  text: string;
  meta: string;
  time: string;
  icon: IconName;
  tone: Tone;
}

export type QueueTarget = 'verification' | 'pricing' | 'orders' | 'vault' | 'disputes';

export type InkKey = 'ok' | 'warn' | 'err' | 'info' | 'mute' | 'gold';
