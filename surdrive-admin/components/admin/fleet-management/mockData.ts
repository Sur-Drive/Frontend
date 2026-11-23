// ---------------------------------------------------------------------------
// MOCK DATA — demo toggle for empty vs populated Fleet Management states.
// TODO: replace all of this with real API data.
// Flip DEMO_POPULATED to false to view the empty state.
// ---------------------------------------------------------------------------
export const DEMO_POPULATED = true;
export type FleetStatus = 'Active' | 'Pending' | 'Suspended';
export type FleetOwner = {
  name: string;
  email: string;
  initials: string;
  avatarColor: string; // tailwind bg class for the initials avatar
};
export type FleetRecord = {
  id: string;
  company: string;
  city: string;
  code: string; // e.g. 'F-201'
  owner: FleetOwner;
  plan: string; // 'Pro Fleet' | 'Starter Fleet' | 'Enterprise' | 'Free Trial'
  vehicles: number;
  drivers: number;
  mrr: string; // preformatted display string, e.g. '₦392,000' — 'N0' when zero
  status: FleetStatus;
};
export const FLEETS_EMPTY: FleetRecord[] = [];
// First 10 records are the primary sample rows;
// TODO: replace mock records below with real API data
export const FLEETS_POPULATED: FleetRecord[] = [
  { id: '1', company: 'Acme Logistics', city: 'Lagos', code: 'F-201', owner: { name: 'Ngozi Belugun', email: 'ngozi.belugun@acme.io', initials: 'NB', avatarColor: 'bg-[#2E90FA]' }, plan: 'Pro Fleet', vehicles: 182, drivers: 128, mrr: '₦392,000', status: 'Active' },
  { id: '2', company: 'GreenHaul NG', city: 'Abia', code: 'F-202', owner: { name: 'Kelechi Umeh', email: 'kelechi.umeh@greenhaul.io', initials: 'KU', avatarColor: 'bg-[#EE46BC]' }, plan: 'Starter Fleet', vehicles: 24, drivers: 26, mrr: '₦54,000', status: 'Active' },
  { id: '3', company: 'Northline Cargo', city: 'Kano', code: 'F-203', owner: { name: 'Ibrahim Musa', email: 'ibrahim.m@northlinecargo.io', initials: 'IM', avatarColor: 'bg-[#12B76A]' }, plan: 'Enterprise', vehicles: 340, drivers: 386, mrr: '₦1,200,000', status: 'Active' },
  { id: '4', company: 'Portmove', city: 'Port Harcourt', code: 'F-204', owner: { name: 'Aisha Bello', email: 'aisha.bello@portmove.io', initials: 'AB', avatarColor: 'bg-[#F79009]' }, plan: 'Pro Fleet', vehicles: 61, drivers: 68, mrr: '₦213,500', status: 'Active' },
  { id: '5', company: 'Swifty', city: 'Lagos', code: 'F-205', owner: { name: 'Chuka Nnamdi', email: 'chuka.nnamdi@swifty.io', initials: 'CN', avatarColor: 'bg-[#7A5AF8]' }, plan: 'Free Trial', vehicles: 4, drivers: 4, mrr: 'N0', status: 'Active' },
  { id: '6', company: 'RideRight', city: 'Abuja', code: 'F-206', owner: { name: 'Musa Bah', email: 'musa.bah@rideright.io', initials: 'MB', avatarColor: 'bg-[#2E90FA]' }, plan: 'Starter Fleet', vehicles: 18, drivers: 20, mrr: '₦40,500', status: 'Suspended' },
  { id: '7', company: 'GovDash NG', city: 'Ogun', code: 'F-207', owner: { name: 'Anna Kowalski', email: 'anna.k@govdash.ng', initials: 'AK', avatarColor: 'bg-[#F04438]' }, plan: 'Pro Fleet', vehicles: 32, drivers: 40, mrr: '₦132,500', status: 'Active' },
  { id: '8', company: 'TripLens', city: 'Ogun', code: 'F-208', owner: { name: 'Tom Nguyen', email: 'tom.nguyen@triplens.io', initials: 'TN', avatarColor: 'bg-[#12B76A]' }, plan: 'Starter Fleet', vehicles: 24, drivers: 20, mrr: '₦54,000', status: 'Active' },
  { id: '9', company: 'OldPorterX', city: 'Ondo', code: 'F-209', owner: { name: 'Tunde Akin', email: 'tunde.akin@oldporterx.ng', initials: 'TA', avatarColor: 'bg-[#B42318]' }, plan: 'Starter Fleet', vehicles: 18, drivers: 15, mrr: '₦40,500', status: 'Active' },
  { id: '10', company: 'RideRight', city: 'Ogun', code: 'F-210', owner: { name: 'Alex Morgan', email: 'alex.morgan@rideright.io', initials: 'AM', avatarColor: 'bg-[#2E90FA]' }, plan: 'Pro Fleet', vehicles: 38, drivers: 30, mrr: '₦155,500', status: 'Active' },
  // TODO: replace mock records below with real API data
  { id: '11', company: 'CargoLine NG', city: 'Enugu', code: 'F-211', owner: { name: 'Grace Okafor', email: 'grace.okafor@cargoline.ng', initials: 'GO', avatarColor: 'bg-[#EE46BC]' }, plan: 'Starter Fleet', vehicles: 12, drivers: 14, mrr: '₦28,000', status: 'Pending' },
  { id: '12', company: 'TransAfrica', city: 'Kaduna', code: 'F-212', owner: { name: 'Chinedu Obi', email: 'chinedu.obi@transafrica.ng', initials: 'CO', avatarColor: 'bg-[#12B76A]' }, plan: 'Enterprise', vehicles: 210, drivers: 240, mrr: '₦860,000', status: 'Active' },
  { id: '13', company: 'FleetHQ', city: 'Lagos', code: 'F-213', owner: { name: 'Fatima Bello', email: 'fatima.bello@fleethq.io', initials: 'FB', avatarColor: 'bg-[#F79009]' }, plan: 'Pro Fleet', vehicles: 55, drivers: 60, mrr: '₦198,000', status: 'Active' },
  { id: '14', company: 'RoadLink', city: 'Jos', code: 'F-214', owner: { name: 'Peter Adeyemi', email: 'peter.adeyemi@roadlink.co', initials: 'PA', avatarColor: 'bg-[#7A5AF8]' }, plan: 'Starter Fleet', vehicles: 16, drivers: 18, mrr: '₦36,000', status: 'Active' },
  { id: '15', company: 'SwiftHaul', city: 'Ibadan', code: 'F-215', owner: { name: 'Ngozi Eze', email: 'ngozi.eze@swifthaul.io', initials: 'NE', avatarColor: 'bg-[#2E90FA]' }, plan: 'Free Trial', vehicles: 6, drivers: 5, mrr: 'N0', status: 'Pending' },
  { id: '16', company: 'BlueAnchor', city: 'Benin City', code: 'F-216', owner: { name: 'Samuel Danjuma', email: 'samuel.d@blueanchor.ng', initials: 'SD', avatarColor: 'bg-[#12B76A]' }, plan: 'Pro Fleet', vehicles: 44, drivers: 49, mrr: '₦167,500', status: 'Active' },
  { id: '17', company: 'LoadMate', city: 'Aba', code: 'F-217', owner: { name: 'Amina Yusuf', email: 'amina.yusuf@loadmate.io', initials: 'AY', avatarColor: 'bg-[#EE46BC]' }, plan: 'Starter Fleet', vehicles: 20, drivers: 22, mrr: '₦47,500', status: 'Active' },
  { id: '18', company: 'PortLink NG', city: 'Port Harcourt', code: 'F-218', owner: { name: 'Kelechi Nwosu', email: 'kelechi.nwosu@portlink.ng', initials: 'KN', avatarColor: 'bg-[#F04438]' }, plan: 'Enterprise', vehicles: 280, drivers: 310, mrr: '₦1,050,000', status: 'Active' },
  { id: '19', company: 'HaulPoint', city: 'Sokoto', code: 'F-219', owner: { name: 'Blessing Uche', email: 'blessing.uche@haulpoint.io', initials: 'BU', avatarColor: 'bg-[#F79009]' }, plan: 'Starter Fleet', vehicles: 14, drivers: 12, mrr: '₦31,000', status: 'Suspended' },
  { id: '20', company: 'CargoXpress', city: 'Maiduguri', code: 'F-220', owner: { name: 'Ibrahim Sani', email: 'ibrahim.sani@cargoxpress.ng', initials: 'IS', avatarColor: 'bg-[#2E90FA]' }, plan: 'Pro Fleet', vehicles: 39, drivers: 42, mrr: '₦148,000', status: 'Active' },
  { id: '21', company: 'SteelMove', city: 'Onitsha', code: 'F-221', owner: { name: 'Funke Adebayo', email: 'funke.adebayo@steelmove.com', initials: 'FA', avatarColor: 'bg-[#7A5AF8]' }, plan: 'Starter Fleet', vehicles: 22, drivers: 24, mrr: '₦52,000', status: 'Active' },
  { id: '22', company: 'GreenWheel', city: 'Owerri', code: 'F-222', owner: { name: 'Osaro Igbinedion', email: 'osaro.i@greenwheel.io', initials: 'OI', avatarColor: 'bg-[#12B76A]' }, plan: 'Free Trial', vehicles: 8, drivers: 7, mrr: 'N0', status: 'Active' },
  { id: '23', company: 'TransUnion NG', city: 'Lagos', code: 'F-223', owner: { name: 'Halima Abubakar', email: 'halima.a@transunion.ng', initials: 'HA', avatarColor: 'bg-[#EE46BC]' }, plan: 'Enterprise', vehicles: 195, drivers: 220, mrr: '₦780,000', status: 'Active' },
  { id: '24', company: 'MoveRight', city: 'Abuja', code: 'F-224', owner: { name: 'Emeka Ugochukwu', email: 'emeka.u@moveright.io', initials: 'EU', avatarColor: 'bg-[#F04438]' }, plan: 'Pro Fleet', vehicles: 48, drivers: 51, mrr: '₦185,500', status: 'Active' },
];
export type FleetStatVariant = 'total' | 'active' | 'pending' | 'suspended';
export const FLEET_STATS: { id: FleetStatVariant; label: string }[] = [
  { id: 'total', label: 'Total Fleet' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'suspended', label: 'Suspended' },
];
export const FLEETS_PER_PAGE = 10;
