export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'navy' | 'gold' | 'violet';

/**
 * Some design elements (activity icons, notification dots) use the light-theme
 * ink colour even in dark mode because the design reads from TONES, not
 * TONES_DARK. These maps reproduce that exactly.
 */
export const TONE_BG: Record<Tone, string> = {
  green: 'var(--tGreen)',
  blue: 'var(--tBlue)',
  amber: 'var(--tAmber)',
  red: 'var(--tRed)',
  gray: 'var(--surf3)',
  navy: 'var(--line)',
  gold: 'var(--tGold)',
  violet: 'var(--tViolet)',
};

export const TONE_INK_FIXED: Record<Tone, string> = {
  green: '#15803D',
  blue: '#2563EB',
  amber: '#B45309',
  red: '#DC2626',
  gray: '#6B7290',
  navy: '#1E2A5A',
  gold: '#8A6318',
  violet: '#6D28D9',
};

export const STAGES = [
  'Verification',
  'Pricing confirmation',
  'Agent visit',
  'Inspection & approval',
  'Payment released',
  'Custody transfer',
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_TONES: readonly Tone[] = ['gray', 'blue', 'violet', 'amber', 'green', 'navy'];

export const AGENT_NAMES: Record<string, string> = {
  FW: 'F. Wanjiru',
  JO: 'J. Otieno',
  DK: 'D. Kimani',
  GK: 'G. Kioko',
  AM: 'A. Mwangi',
  LA: 'L. Achieng',
  PN: 'P. Njoroge',
  SB: 'S. Barasa',
  RK: 'R. Kariuki',
};
