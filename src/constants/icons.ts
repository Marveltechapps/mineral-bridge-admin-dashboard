/**
 * Icon geometry copied from the design's ICONS table. Every icon is drawn on a
 * 24×24 grid with a 2px round stroke (see components/ui/Icon.tsx).
 */
type IconShape =
  | readonly ['path', string]
  | readonly ['circle', number, number, number]
  | readonly ['rect', number, number, number, number];

export const ICONS = {
  grid: [['rect', 3, 3, 7, 7], ['rect', 14, 3, 7, 7], ['rect', 14, 14, 7, 7], ['rect', 3, 14, 7, 7]],
  orders: [['path', 'M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4'], ['path', 'M9 3h6v4H9z'], ['path', 'M8 12h8'], ['path', 'M8 16h5']],
  vault: [['path', 'M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z'], ['path', 'M3.3 7L12 12l8.7-5'], ['path', 'M12 22V12']],
  pricing: [['path', 'M23 6l-9.5 9.5-5-5L1 18'], ['path', 'M17 6h6v6']],
  auctions: [['path', 'M14 11l-8.5 8.5a2.1 2.1 0 0 1-3-3L11 8'], ['path', 'M12 6l6 6'], ['path', 'M9 3l12 12'], ['path', 'M14 21h7']],
  users: [['path', 'M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'], ['circle', 9.5, 7, 4], ['path', 'M22 21v-2a4 4 0 0 0-3-3.87']],
  shield: [['path', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'], ['path', 'M9 11.5l2.2 2.2L15.5 9.5']],
  dispute: [['path', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'], ['path', 'M12 8v3'], ['path', 'M12 14h.01']],
  academy: [['path', 'M2 3.5h6a4 4 0 0 1 4 4V21a3 3 0 0 0-3-3H2z'], ['path', 'M22 3.5h-6a4 4 0 0 0-4 4V21a3 3 0 0 1 3-3h7z']],
  marketing: [['path', 'M3 11l16-6v14L3 14z'], ['path', 'M3 11v3'], ['path', 'M11.5 17.5a3 3 0 0 1-5.6-1.4']],
  partners: [['path', 'M1 4h14v12H1z'], ['path', 'M15 8h4l4 4v4h-8z'], ['circle', 5.5, 18.5, 2.2], ['circle', 18.5, 18.5, 2.2]],
  support: [['path', 'M3 18v-6a9 9 0 0 1 18 0v6'], ['path', 'M21 19a2 2 0 0 1-2 2h-2v-7h4z'], ['path', 'M3 19a2 2 0 0 0 2 2h2v-7H3z']],
  audit: [['path', 'M8 6h13'], ['path', 'M8 12h13'], ['path', 'M8 18h13'], ['path', 'M3 6h.01'], ['path', 'M3 12h.01'], ['path', 'M3 18h.01']],
  financial: [['path', 'M12 2v20'], ['path', 'M17 5.5H9.8a3.3 3.3 0 0 0 0 6.6h4.4a3.3 3.3 0 0 1 0 6.6H6']],
  analytics: [['path', 'M18 20V9'], ['path', 'M12 20V4'], ['path', 'M6 20v-7'], ['path', 'M3 20h18']],
  settings: [['circle', 12, 12, 3], ['path', 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.05A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.33-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.05A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v0a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.05a1.7 1.7 0 0 0-1.55 1z']],
  profile: [['path', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'], ['circle', 12, 7, 4]],
  chain: [['path', 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'], ['path', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71']],
  lc: [['rect', 3, 5, 18, 14], ['path', 'M3 10h18'], ['path', 'M7 15h4']],
  collab: [['circle', 9, 7, 4], ['path', 'M3 21v-2a4 4 0 0 1 4-4h4'], ['path', 'M16 11l2 2 4-4']],
  search: [['circle', 11, 11, 8], ['path', 'M21 21l-4.3-4.3']],
  moon: [['path', 'M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z']],
  sun: [['circle', 12, 12, 4.2], ['path', 'M12 2v2'], ['path', 'M12 20v2'], ['path', 'M4.9 4.9l1.4 1.4'], ['path', 'M17.7 17.7l1.4 1.4'], ['path', 'M2 12h2'], ['path', 'M20 12h2'], ['path', 'M4.9 19.1l1.4-1.4'], ['path', 'M17.7 6.3l1.4-1.4']],
  bell: [['path', 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9'], ['path', 'M13.7 21a2 2 0 0 1-3.4 0']],
  up: [['path', 'M12 19V5'], ['path', 'M5 12l7-7 7 7']],
  down: [['path', 'M12 5v14'], ['path', 'M19 12l-7 7-7-7']],
  check: [['path', 'M20 6L9 17l-5-5']],
  clock: [['circle', 12, 12, 9], ['path', 'M12 7v5l3 2']],
  flag: [['path', 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z'], ['path', 'M4 22v-7']],
  doc: [['path', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'], ['path', 'M14 2v6h6']],
  box: [['path', 'M21 16V8l-9-5-9 5v8l9 5z'], ['path', 'M3.3 7.5L12 12.5l8.7-5']],
  arrowRight: [['path', 'M5 12h14'], ['path', 'M12 5l7 7-7 7']],
  arrowLeft: [['path', 'M19 12H5'], ['path', 'M12 19l-7-7 7-7']],
  plus: [['path', 'M12 5v14'], ['path', 'M5 12h14']],
  edit: [['path', 'M11 4H4v16h16v-7'], ['path', 'M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z']],
  download: [['path', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'], ['path', 'M7 10l5 5 5-5'], ['path', 'M12 15V3']],
  filter: [['path', 'M4 4h16l-6 7v7l-4-2v-5z']],
  eye: [['path', 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z'], ['circle', 12, 12, 3]],
  pause: [['path', 'M8 5v14'], ['path', 'M16 5v14']],
  x: [['path', 'M18 6L6 18'], ['path', 'M6 6l12 12']],
  send: [['path', 'M22 2L11 13'], ['path', 'M22 2l-7 20-4-9-9-4z']],
  sort: [['path', 'M8 9l4-4 4 4'], ['path', 'M16 15l-4 4-4-4']],
  // Responsive-only addition: the design has no mobile frames, so the
  // collapsed sidebar needs a menu trigger. Same stroke style as the set above.
  menu: [['path', 'M4 6h16'], ['path', 'M4 12h16'], ['path', 'M4 18h16']],
} as const satisfies Record<string, readonly IconShape[]>;

export type IconName = keyof typeof ICONS;
