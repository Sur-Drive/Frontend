// ---------------------------------------------------------------------------
// MOCK DATA — SOS Monitor
// TODO: replace all of this with real API data (incident feed + map pins).
// NOTE: no empty state for this page — populated only.
// ---------------------------------------------------------------------------
export type IncidentStatus = 'SOS' | 'Resolved' | 'Confirmed' | 'NotConfirmed';

export type SosIncident = {
  id: string; // e.g. 'SOS-9820'
  status: IncidentStatus;
  timeAgo: string; // list timestamp, e.g. '6m ago'
  reporter: string; // e.g. 'By Ada O.'
  title: string;
  location: string;
  views: number; // placeholder stat — exact meaning TBD
  comments: number; // placeholder stat — exact meaning TBD
  // Detail-panel fields (only SOS-9820 has complete detail data;
  // TODO: per-incident detail pending real API data)
  type: string;
  driver: string;
  phone: string;
  city: string;
  reported: string;
  coordinates: string;
  /** % position on the mock map (left / top) */
  pin: { x: number; y: number };
};

export const SOS_INCIDENTS: SosIncident[] = [
  {
    id: 'SOS-9820', status: 'SOS', timeAgo: '6m ago', reporter: 'By Ada O.',
    title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St',
    views: 0, comments: 0,
    type: 'Accident', driver: 'Marco D.', phone: '+234 814 555 9981',
    city: 'Port Harcourt', reported: '4 minutes ago', coordinates: '4.8156, 7.0498',
    pin: { x: 58, y: 22 },
  },
  {
    id: 'SOS-9819', status: 'SOS', timeAgo: '6m ago', reporter: 'By Ada O.',
    title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St',
    views: 3, comments: 0,
    type: 'Road Hazard', driver: 'Ada O.', phone: '+234 800 000 0000',
    city: 'Port Harcourt', reported: '6 minutes ago', coordinates: '4.8241, 7.0311',
    pin: { x: 40, y: 34 },
  },
  {
    id: 'SOS-9818', status: 'SOS', timeAgo: '6m ago', reporter: 'By Ada O.',
    title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St',
    views: 0, comments: 0,
    type: 'Road Hazard', driver: 'Ada O.', phone: '+234 800 000 0000',
    city: 'Port Harcourt', reported: '6 minutes ago', coordinates: '4.8312, 7.0622',
    pin: { x: 70, y: 12 },
  },
  {
    id: 'SOS-9817', status: 'Resolved', timeAgo: '6m ago', reporter: 'By Ada O.',
    title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St',
    views: 13, comments: 2,
    type: 'Road Hazard', driver: 'Ada O.', phone: '+234 800 000 0000',
    city: 'Port Harcourt', reported: '6 minutes ago', coordinates: '4.8095, 7.0184',
    pin: { x: 12, y: 40 },
  },
  {
    id: 'SOS-9816', status: 'Confirmed', timeAgo: '6m ago', reporter: 'By Ada O.',
    title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St',
    views: 12, comments: 3,
    type: 'Road Hazard', driver: 'Ada O.', phone: '+234 800 000 0000',
    city: 'Port Harcourt', reported: '6 minutes ago', coordinates: '4.8428, 7.0509',
    pin: { x: 88, y: 34 },
  },
  {
    id: 'SOS-9815', status: 'SOS', timeAgo: '6m ago', reporter: 'By Ada O.',
    title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St',
    views: 12, comments: 3,
    type: 'Road Hazard', driver: 'Ada O.', phone: '+234 800 000 0000',
    city: 'Port Harcourt', reported: '6 minutes ago', coordinates: '4.8203, 7.0444',
    pin: { x: 55, y: 48 },
  },
  {
    id: 'SOS-9814', status: 'SOS', timeAgo: '6m ago', reporter: 'By Ada O.',
    title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St',
    views: 12, comments: 0,
    type: 'Road Hazard', driver: 'Ada O.', phone: '+234 800 000 0000',
    city: 'Port Harcourt', reported: '6 minutes ago', coordinates: '4.8355, 7.0751',
    pin: { x: 74, y: 56 },
  },
  {
    id: 'SOS-9813', status: 'Resolved', timeAgo: '6m ago', reporter: 'By Ada O.',
    title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St',
    views: 12, comments: 0,
    type: 'Road Hazard', driver: 'Ada O.', phone: '+234 800 000 0000',
    city: 'Port Harcourt', reported: '6 minutes ago', coordinates: '4.8512, 7.0230',
    pin: { x: 28, y: 68 },
  },
];

// Stat tile values hardcoded — the list shows 8 incidents while the tiles count
// platform-wide, including off-map items.
// TODO: derive from real API aggregates.
export const SOS_TILES: { id: string; label: string; dotClass: string; value: number }[] = [
  { id: 'active', label: 'Total Active SOS', dotClass: 'bg-[#F04438]', value: 4 },
  { id: 'unconfirmed', label: 'Not Confirmed', dotClass: 'bg-[#98A2B3]', value: 3 },
  { id: 'confirmed', label: 'Confirmed', dotClass: 'bg-[#F5A623]', value: 1 },
  { id: 'resolved', label: 'Resolved', dotClass: 'bg-[#12B76A]', value: 2 },
];