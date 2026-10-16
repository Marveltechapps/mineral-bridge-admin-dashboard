import type { KycSubmission, TrackedDoc } from '@/types/verification';

export const KYC: KycSubmission[] = [
  {
    id: 'KYC-7741',
    org: 'Athi River Refinery Ltd',
    person: 'Sarah Ochieng',
    tier: 3,
    submitted: 'Submitted 2 h ago',
    status: 'In review',
    tone: 'blue',
    docs: [
      { name: 'National ID', ref: 'ID 30118842', status: 'VERIFIED', tone: 'green' },
      { name: 'Import/export permit', ref: 'IP-KE-11209', status: 'IN REVIEW', tone: 'blue' },
      { name: 'KYB pack — directors & UBO', ref: 'KYB-2026-0441', status: 'IN REVIEW', tone: 'blue' },
      { name: 'Certificate of incorporation', ref: 'CI-KE-889120', status: 'VERIFIED', tone: 'green' },
    ],
  },
  {
    id: 'KYC-7738',
    org: 'Kilimapesa Mining Co-op',
    person: 'Peter Mutiso',
    tier: 2,
    submitted: 'Submitted 6 h ago',
    status: 'In review',
    tone: 'blue',
    docs: [
      { name: 'National ID', ref: 'ID 24409118', status: 'VERIFIED', tone: 'green' },
      { name: 'Group registration number', ref: 'GRP-KP-2288', status: 'IN REVIEW', tone: 'blue' },
    ],
  },
  { id: 'KYC-7736', org: 'Individual seller', person: 'Mary Wekesa', tier: 1, submitted: 'Submitted 9 h ago', status: 'In review', tone: 'blue', docs: [{ name: 'National ID', ref: 'ID 33820014', status: 'IN REVIEW', tone: 'blue' }] },
  {
    id: 'KYC-7731',
    org: 'Njoro Metals Ltd',
    person: 'Simon Kamau',
    tier: 3,
    submitted: 'Submitted 1 day ago',
    status: 'Expiring docs',
    tone: 'amber',
    docs: [
      { name: 'National ID', ref: 'ID 21980043', status: 'VERIFIED', tone: 'green' },
      { name: 'Export permit', ref: 'EP-KE-71002', status: 'EXPIRING', tone: 'amber' },
      { name: 'KYB pack — directors & UBO', ref: 'KYB-2026-0428', status: 'VERIFIED', tone: 'green' },
    ],
  },
  { id: 'KYC-7724', org: 'Individual seller', person: 'Grace Cheruiyot', tier: 1, submitted: 'Submitted 3 days ago', status: 'Rejected', tone: 'red', docs: [{ name: 'National ID', ref: 'Name mismatch vs application', status: 'REJECTED', tone: 'red' }] },
];

export const KYC_FILTERS = ['All tiers', 'Tier 1 · ID only', 'Tier 2 · + group reg', 'Tier 3 · + permits & KYB', 'Overdue SLA'] as const;

export const TRACKED_DOCS: TrackedDoc[] = [
  { type: 'Export permit', ref: 'EP-KE-88412', holder: 'Mombasa Metals Exchange', tier: 'Tier 3', expires: '02 Oct 2026', days: 21, status: 'EXPIRING', tone: 'amber' },
  { type: 'Proof of address', ref: 'UTIL-99120', holder: 'Rift Valley Minerals Ltd', tier: 'Tier 2', expires: '02 Oct 2026', days: 21, status: 'EXPIRING', tone: 'amber' },
  { type: 'Export permit', ref: 'EP-KE-71002', holder: 'Njoro Metals Ltd', tier: 'Tier 3', expires: '14 Oct 2026', days: 33, status: 'EXPIRING', tone: 'amber' },
  { type: 'Mining lease certificate', ref: 'ML-KE-29840', holder: 'Mombasa Metals Exchange', tier: 'Tier 3', expires: '28 Nov 2026', days: 78, status: 'VERIFIED', tone: 'green' },
  { type: 'National ID', ref: 'ID 24409118', holder: 'Kilimapesa Mining Co-op', tier: 'Tier 2', expires: '19 Jan 2027', days: 130, status: 'IN REVIEW', tone: 'blue' },
  { type: 'Mining lease certificate', ref: 'ML-KE-33180', holder: 'Nyanza Smelting Ltd', tier: 'Tier 3', expires: '04 Mar 2027', days: 174, status: 'VERIFIED', tone: 'green' },
  { type: 'Export permit', ref: 'EP-KE-90221', holder: 'Samburu Aggregates', tier: 'Tier 3', expires: '21 Jun 2027', days: 283, status: 'VERIFIED', tone: 'green' },
  { type: 'National ID', ref: 'ID 28844172', holder: 'Rift Valley Minerals Ltd', tier: 'Tier 2', expires: '14 Mar 2031', days: 1645, status: 'VERIFIED', tone: 'green' },
  { type: 'Proof of address', ref: 'UTIL-77004', holder: 'Grace Cheruiyot', tier: 'Tier 1', expires: 'Expired 04 Sep 2026', days: -7, status: 'REJECTED', tone: 'red' },
];

export const EXPIRY_FILTERS = ['All documents', 'Expired', 'Under 30 days', 'Under 90 days', 'In review'] as const;
