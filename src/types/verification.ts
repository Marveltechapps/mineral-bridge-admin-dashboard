import type { Tone } from '@/constants/tones';

export interface KycSubmission {
  id: string;
  org: string;
  person: string;
  tier: 1 | 2 | 3;
  submitted: string;
  status: string;
  tone: Tone;
  overdue?: boolean;
  docs: Array<{
    id?: string;
    name: string;
    ref: string;
    status: string;
    tone: Tone;
    fileId?: string;
    side?: string;
    mimeType?: string;
    rejectionReason?: string;
  }>;
}

export interface TrackedDoc {
  type: string;
  ref: string;
  holder: string;
  tier: string;
  expires: string;
  days: number;
  status: string;
  tone: Tone;
}
