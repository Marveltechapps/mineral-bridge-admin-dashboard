import type { Course } from '@/types/academy';

export const CATEGORIES: Array<{ category: string; courses: Course[] }> = [
  { category: 'Getting Started', courses: [{ title: 'How Mineral Bridge works', lessons: 4, status: 'Published', certified: true }, { title: 'Setting up your account tier', lessons: 3, status: 'Published', certified: false }] },
  { category: 'Selling Safely', courses: [{ title: 'Preparing a consignment', lessons: 5, status: 'Published', certified: true }, { title: 'Sample collection and sealing', lessons: 4, status: 'Published', certified: true }] },
  { category: 'Quality & Grading', courses: [{ title: 'Reading an assay certificate', lessons: 6, status: 'Published', certified: true }, { title: 'Grades, forms and moisture', lessons: 4, status: 'Draft', certified: false }] },
  { category: 'Compliance & Documentation', courses: [{ title: 'Permits and licences by tier', lessons: 5, status: 'Published', certified: true }, { title: 'Keeping documents current', lessons: 3, status: 'Published', certified: false }] },
  { category: 'Ground Safety', courses: [{ title: 'Site safety for artisanal miners', lessons: 6, status: 'Published', certified: true }, { title: 'Mercury-free processing basics', lessons: 4, status: 'Published', certified: true }] },
  { category: 'Using Auctions', courses: [{ title: 'How vault auctions work', lessons: 3, status: 'Published', certified: false }, { title: 'Bidding strategy and reserves', lessons: 2, status: 'Draft', certified: false }] },
];

export const COMPLETION: Array<{ title: string; rate: number; tiers: [number, number, number] }> = [
  { title: 'How Mineral Bridge works', rate: 86, tiers: [91, 88, 74] },
  { title: 'Preparing a consignment', rate: 72, tiers: [78, 71, 62] },
  { title: 'Reading an assay certificate', rate: 58, tiers: [49, 61, 71] },
  { title: 'Permits and licences by tier', rate: 64, tiers: [52, 66, 81] },
  { title: 'Site safety for artisanal miners', rate: 81, tiers: [88, 79, 41] },
  { title: 'How vault auctions work', rate: 44, tiers: [31, 43, 68] },
];

export const TIER_COLORS = ['var(--line4)', '#6B7290', '#C8962F'];

export const ACADEMY_STATS = [
  { label: 'ENROLMENTS', value: '5,214', sub: '+312 this month' },
  { label: 'AVG COMPLETION', value: '67%', sub: '+4 pts vs Q2' },
  { label: 'CERTIFIED TRACKS', value: '2', sub: 'Selling Safely, Ground Safety' },
  { label: 'CERTIFICATES ISSUED', value: '1,108', sub: '214 in Sep 2026' },
];
