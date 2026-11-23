// ---------------------------------------------------------------------------
// MOCK DATA — Moderation Queue
// TODO: replace all of this with real API data (report feed + moderation calls).
// ---------------------------------------------------------------------------
export type HazardType =
  | 'Pothole'
  | 'Flood'
  | 'Accident'
  | 'Debris'
  | 'Road'
  | 'Checkpoint'
  | 'Danger'
  | 'SOS';

export type ModerationReport = {
  id: string;
  hazard: HazardType;
  title: string;
  location: string;
  timeAgo: string; // e.g. '3m'
  reporter: string;
  approvals: number; // community upvotes — ✓ count on the card
  rejections: number; // community downvotes — ✕ count on the card
};

export type ModerationTabId = 'all' | HazardType;

export const HAZARD_TABS: { id: ModerationTabId; label: string }[] = [
  { id: 'all', label: 'All Hazard' },
  { id: 'Pothole', label: 'Pothole' },
  { id: 'Flood', label: 'Flood' },
  { id: 'Accident', label: 'Accident' },
  { id: 'Debris', label: 'Debris' },
  { id: 'Road', label: 'Road' },
  { id: 'Checkpoint', label: 'Checkpoint' },
  { id: 'Danger', label: 'Danger' },
  { id: 'SOS', label: 'SOS' },
];

/** Card tag labels per hazard type (per the design's tag copy) */
export const HAZARD_TAG_LABELS: Record<HazardType, string> = {
  Pothole: 'Pothole',
  Flood: 'Flood',
  Accident: 'Accident',
  Debris: 'Debris',
  Road: 'Road Works',
  Checkpoint: 'Checkpoint',
  Danger: 'Danger Zone',
  SOS: 'SOS',
};

// Report templates (order + counts);
// TODO: replace templates with real API data
const REPORT_TEMPLATES: Omit<ModerationReport, 'id'>[] = [
  { hazard: 'Accident', title: 'Multi-car pileup on Third Mainland', location: '3rd Ave & Market St', timeAgo: '3m', reporter: 'Tunde A.', approvals: 12, rejections: 0 },
  { hazard: 'Danger', title: 'Reports of armed activity', location: 'Ring Road, Exit 7', timeAgo: '8m', reporter: 'Aron', approvals: 6, rejections: 1 },
  { hazard: 'Pothole', title: 'Crater near school entrance', location: 'Riverside Crescent', timeAgo: '22m', reporter: 'Sara K.', approvals: 9, rejections: 0 },
  { hazard: 'Checkpoint', title: 'Unregistered police stop', location: 'Independence Blvd', timeAgo: '35m', reporter: 'Femi B.', approvals: 3, rejections: 4 },
  { hazard: 'Pothole', title: 'Crater near school entrance', location: 'Riverside Crescent', timeAgo: '22m', reporter: 'Sara K.', approvals: 9, rejections: 0 },
  { hazard: 'Debris', title: 'Tyre scraps across lane 2', location: 'Coastal Loop', timeAgo: '50m', reporter: 'Noah R.', approvals: 8, rejections: 3 },
  { hazard: 'Flood', title: 'Bridge underpass flooded 60cm', location: 'Independence Blvd', timeAgo: '54m', reporter: 'Nkechi L.', approvals: 14, rejections: 0 },
  { hazard: 'Danger', title: 'Reports of armed activity', location: 'Ring Road, Exit 7', timeAgo: '8m', reporter: 'Aron', approvals: 6, rejections: 1 },
  { hazard: 'Road', title: 'Lane closure for resurfacing', location: 'Old Toll Gate', timeAgo: '48m', reporter: 'Femi B.', approvals: 7, rejections: 2 },
  { hazard: 'Debris', title: 'Tyre scraps across lane 2', location: 'Highway Alt, Exit 9', timeAgo: '52m', reporter: 'Noah R.', approvals: 8, rejections: 3 },
  { hazard: 'Checkpoint', title: 'Unregistered police stop', location: 'Independence Blvd', timeAgo: '62m', reporter: 'Femi B.', approvals: 3, rejections: 4 },
  { hazard: 'Accident', title: 'Bus brake failure on Ikorodu Road', location: 'Ikorodu Rd', timeAgo: '65m', reporter: 'Tunde A.', approvals: 10, rejections: 1 },
];

// 56 queued reports (5 pages × 12) matching the "Showing 1-12 of 56" footer,
// built by cycling the report templates
export const REPORTS: ModerationReport[] = Array.from({ length: 56 }, (_, index) => ({
  ...REPORT_TEMPLATES[index % REPORT_TEMPLATES.length],
  id: `report-${index + 1}`,
}));

export const REPORTS_PER_PAGE = 12;