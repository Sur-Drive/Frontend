// ---------------------------------------------------------------------------
// MOCK DATA — demo toggle for empty vs populated User Management states.
// TODO: replace all of this with real API data.
// Flip DEMO_POPULATED to false to view the empty state.
// ---------------------------------------------------------------------------
export const DEMO_POPULATED = true;

export type UserStatus = 'Active' | 'Pending' | 'Suspended';

export type DriverDetails = {
  driverId: string;
  phone: string;
  subFleet: string;
  vehicle: string;
  license: string;
  trips: number;
  kilometres: string;
  totalReports: number;
  confirmedReports: number;
  falseReports: number;
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string; // tailwind bg class for the initials avatar
  role: string;
  fleet: string; // '—' when none
  city: string;
  trustScore: number; // percentage
  reports: number;
  status: UserStatus;
  /** Extended profile for the Driver Details modal — TODO: fill for all users from real API data */
  details?: DriverDetails;
};

/**
 * Details fallback for mock users without a full profile.
 * TODO: remove once real API data provides details for every user.
 */
export function getDriverDetails(user: PlatformUser): DriverDetails {
  return (
    user.details ?? {
      driverId: `D-${2000 + Number(user.id)}`,
      phone: '+234 800 000 0000',
      subFleet: '—',
      vehicle: '—',
      license: 'LAG-DR-000000',
      trips: 0,
      kilometres: '0 km',
      totalReports: user.reports,
      confirmedReports: Math.round(user.reports * 0.8),
      falseReports: user.reports - Math.round(user.reports * 0.8),
    }
  );
}

export const USERS_EMPTY: PlatformUser[] = [];

export const USERS_POPULATED: PlatformUser[] = [
  { id: '1', name: 'Kemi Adesanya', email: 'kemi.adesanya@acmelogistics.com', initials: 'KA', avatarColor: 'bg-[#2E90FA]', role: 'Driver', fleet: 'Acme Logistics', city: 'Lagos', trustScore: 85, reports: 24, status: 'Active', details: { driverId: 'D-2001', phone: '+234 803 555 0142', subFleet: 'Lagos NW', vehicle: 'V-1042', license: 'LAG-DR-291274', trips: 241, kilometres: '84,210 km', totalReports: 24, confirmedReports: 22, falseReports: 2 } },
  { id: '2', name: 'James Wilson', email: 'james.wilson@company.io', initials: 'JW', avatarColor: 'bg-[#EE46BC]', role: 'Driver', fleet: '—', city: 'Lagos', trustScore: 96, reports: 12, status: 'Active' },
  { id: '3', name: 'Emily Chen', email: 'emily.chen@company.io', initials: 'EC', avatarColor: 'bg-[#12B76A]', role: 'Driver', fleet: '—', city: 'Abuja', trustScore: 0, reports: 0, status: 'Pending' },
  { id: '4', name: 'Michael Brown', email: 'michael.b@logistics.io', initials: 'MB', avatarColor: 'bg-[#F79009]', role: 'Driver', fleet: 'Acme Logistics', city: 'Bengaluru', trustScore: 87, reports: 0, status: 'Active' },
  { id: '5', name: 'Lisa Rodriguez', email: 'lisa.r@company.io', initials: 'LR', avatarColor: 'bg-[#7A5AF8]', role: 'Driver', fleet: 'Acme Logistics', city: 'Port Harcourt', trustScore: 74, reports: 5, status: 'Active' },
  { id: '6', name: 'David Park', email: 'david.park@company.io', initials: 'DP', avatarColor: 'bg-[#2E90FA]', role: 'Driver', fleet: 'Acme Logistics', city: 'Lagos', trustScore: 87, reports: 6, status: 'Suspended' },
  { id: '7', name: 'Anna Kowalski', email: 'anna.k@company.io', initials: 'AK', avatarColor: 'bg-[#F04438]', role: 'Driver', fleet: 'Acme Logistics', city: 'Kano', trustScore: 87, reports: 0, status: 'Active' },
  { id: '8', name: 'Tom Nguyen', email: 'tom.nguyen@company.io', initials: 'TN', avatarColor: 'bg-[#12B76A]', role: 'Driver', fleet: '—', city: 'Ibadan', trustScore: 83, reports: 15, status: 'Active' },
  { id: '9', name: 'Tunde Akin', email: 'tunde.akin@acme.org', initials: 'TA', avatarColor: 'bg-[#7A5AF8]', role: 'Driver', fleet: 'Acme Logistics', city: 'Ogun', trustScore: 74, reports: 15, status: 'Active' },
  { id: '10', name: 'Alex Morgan', email: 'alex.morgan@transfleet.com', initials: 'AM', avatarColor: 'bg-[#2E90FA]', role: 'Driver', fleet: '—', city: 'Ogun', trustScore: 91, reports: 15, status: 'Active' },
  // TODO: replace mock records below with real API data
  { id: '11', name: 'Grace Okafor', email: 'grace.okafor@fleethq.io', initials: 'GO', avatarColor: 'bg-[#EE46BC]', role: 'Driver', fleet: 'FleetHQ', city: 'Lagos', trustScore: 88, reports: 3, status: 'Active' },
  { id: '12', name: 'Chinedu Obi', email: 'chinedu.obi@roadlink.co', initials: 'CO', avatarColor: 'bg-[#12B76A]', role: 'Driver', fleet: 'RoadLink', city: 'Enugu', trustScore: 69, reports: 9, status: 'Pending' },
  { id: '13', name: 'Fatima Bello', email: 'fatima.bello@transafrica.ng', initials: 'FB', avatarColor: 'bg-[#F79009]', role: 'Driver', fleet: 'TransAfrica', city: 'Kano', trustScore: 92, reports: 2, status: 'Active' },
  { id: '14', name: 'Peter Adeyemi', email: 'peter.adeyemi@acmelogistics.com', initials: 'PA', avatarColor: 'bg-[#7A5AF8]', role: 'Driver', fleet: 'Acme Logistics', city: 'Lagos', trustScore: 45, reports: 28, status: 'Suspended' },
  { id: '15', name: 'Ngozi Eze', email: 'ngozi.eze@company.io', initials: 'NE', avatarColor: 'bg-[#2E90FA]', role: 'Driver', fleet: '—', city: 'Abuja', trustScore: 78, reports: 7, status: 'Active' },
  { id: '16', name: 'Samuel Danjuma', email: 'samuel.d@roadlink.co', initials: 'SD', avatarColor: 'bg-[#12B76A]', role: 'Driver', fleet: 'RoadLink', city: 'Jos', trustScore: 81, reports: 4, status: 'Active' },
  { id: '17', name: 'Amina Yusuf', email: 'amina.yusuf@transafrica.ng', initials: 'AY', avatarColor: 'bg-[#EE46BC]', role: 'Driver', fleet: 'TransAfrica', city: 'Kaduna', trustScore: 0, reports: 0, status: 'Pending' },
  { id: '18', name: 'Kelechi Nwosu', email: 'kelechi.nwosu@fleethq.io', initials: 'KN', avatarColor: 'bg-[#F04438]', role: 'Driver', fleet: 'FleetHQ', city: 'Aba', trustScore: 85, reports: 11, status: 'Active' },
  { id: '19', name: 'Blessing Uche', email: 'blessing.uche@company.io', initials: 'BU', avatarColor: 'bg-[#F79009]', role: 'Driver', fleet: '—', city: 'Owerri', trustScore: 90, reports: 1, status: 'Active' },
  { id: '20', name: 'Ibrahim Sani', email: 'ibrahim.sani@roadlink.co', initials: 'IS', avatarColor: 'bg-[#2E90FA]', role: 'Driver', fleet: 'RoadLink', city: 'Sokoto', trustScore: 38, reports: 41, status: 'Suspended' },
  { id: '21', name: 'Funke Adebayo', email: 'funke.adebayo@acmelogistics.com', initials: 'FA', avatarColor: 'bg-[#7A5AF8]', role: 'Driver', fleet: 'Acme Logistics', city: 'Ibadan', trustScore: 94, reports: 0, status: 'Active' },
  { id: '22', name: 'Osaro Igbinedion', email: 'osaro.i@fleethq.io', initials: 'OI', avatarColor: 'bg-[#12B76A]', role: 'Driver', fleet: 'FleetHQ', city: 'Benin City', trustScore: 0, reports: 0, status: 'Pending' },
  { id: '23', name: 'Halima Abubakar', email: 'halima.a@transafrica.ng', initials: 'HA', avatarColor: 'bg-[#EE46BC]', role: 'Driver', fleet: 'TransAfrica', city: 'Maiduguri', trustScore: 76, reports: 8, status: 'Active' },
  { id: '24', name: 'Emeka Ugochukwu', email: 'emeka.u@company.io', initials: 'EU', avatarColor: 'bg-[#F04438]', role: 'Driver', fleet: '—', city: 'Onitsha', trustScore: 64, reports: 19, status: 'Active' },
];

export type UserStatVariant = 'total' | 'active' | 'pending' | 'suspended';

export type UserStat = {
  id: UserStatVariant;
  label: string;
};

export const USER_STATS: UserStat[] = [
  { id: 'total', label: 'Total users' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'suspended', label: 'Suspended' },
];

export const USERS_PER_PAGE = 10;