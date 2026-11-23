// ---------------------------------------------------------------------------
// Shared TypeScript types for SurDrive Admin
// ---------------------------------------------------------------------------

export type DriverStatus = 'active' | 'pending' | 'inactive' | 'suspended';

/** Status filter for the User Management tabs; `all` shows every driver. */
export type UserStatusFilter = 'all' | DriverStatus;

export type Driver = {
  id: string;
  userId: string;
  role: string;
  fullName: string;
  initials: string;
  phoneNumber: string;
  email: string | null;
  licenseNumber: string;
  fleetCompanyId: string;
  fleetName: string;
  subFleetId: string;
  subFleetName: string;
  city: string;
  region: string;
  trustScore: number;
  totalReports: number;
  confirmedReports: number;
  falseReports: number;
  status: DriverStatus;
  isActive: boolean;
  isAssigned: boolean;
  totalTrips: number;
  totalKilometers: number;
  createdAt: string;
  lastActiveAt: string | null;
};

export type DriverStats = {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  suspended: number;
};

export type DriversPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DriversResponse = {
  drivers: Driver[];
  stats: DriverStats;
  pagination: DriversPagination;
};

// ---------------------------------------------------------------------------
// Fleet Management types (GET /admin/fleets)
// ---------------------------------------------------------------------------

export type FleetStatus = 'active' | 'pending' | 'suspended' | 'expired';

/** Status filter for the Fleet Management tabs; `all` shows every fleet. */
export type FleetStatusFilter = 'all' | FleetStatus;

export type Fleet = {
  id: string;
  companyName: string;
  fleetName: string;
  fleetCode: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  location: string;
  region: string;
  plan: string;
  vehicleCount: number;
  driverCount: number;
  mrr: number;
  status: FleetStatus;
  isVerified: boolean;
  createdAt: string;
};

export type FleetStats = {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  expired: number;
};

export type FleetsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FleetsResponse = {
  fleets: Fleet[];
  stats: FleetStats;
  pagination: FleetsPagination;
};

// ---------------------------------------------------------------------------
// Fleet Detail types (GET /admin/fleets/:id)
// ---------------------------------------------------------------------------

export type FleetOwner = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
};

export type FleetKycStatus = {
  isKycCompleted: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  kycSubmittedAt: string | null;
};

export type FleetDetailStats = {
  totalVehicles: number;
  totalDrivers: number;
  totalSubFleets: number;
  totalManagers: number;
};

export type FleetSubscriptionFeatures = {
  sos: boolean;
  apiAccess: boolean;
  driverApp: boolean;
  whiteLabel: boolean;
  tripHistory: boolean;
  customAlerts: boolean;
  emailSupport: boolean;
  hazardAlerts: boolean;
  liveTracking: boolean;
  customReports: boolean;
  routeCompliance: boolean;
  vehicleTracking: boolean;
  drivingBehaviour: boolean;
  subFleetManagement: boolean;
  unlimitedGeofences: boolean;
  fleetManagerAccount: boolean;
};

export type FleetSubscription = {
  id: string;
  plan: string;
  status: string;
  pricePerVehicle: number;
  totalPrice: number;
  billingCycle: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  isExpired: boolean;
  features: FleetSubscriptionFeatures;
};

export type FleetVehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';

export type FleetVehicle = {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  vehicleType: string;
  status: FleetVehicleStatus;
  driver: { id: string; fullName: string; initials: string } | null;
};

/** A driver row within the fleet detail view. Reuses the shared DriverStatus. */
export type FleetDetailDriver = {
  id: string;
  fullName: string;
  initials: string;
  phoneNumber: string;
  email: string | null;
  assignedVehicle: string | null;
  status: DriverStatus;
  totalTrips: number;
  totalKilometers: number;
};

export type FleetManager = {
  id: string;
  fullName: string;
  initials: string;
  role: string;
  email: string;
  phoneNumber: string;
  subFleet: string | null;
};

export type FleetSubFleet = {
  id: string;
  name: string;
  region: string;
  status: string;
  vehicleCount: number;
  driverCount: number;
};

export type FleetDetail = {
  id: string;
  companyName: string;
  fleetName: string;
  fleetCode: string;
  owner: FleetOwner;
  location: string;
  region: string;
  plan: string;
  vehicleCount: number;
  driverCount: number;
  mrr: number;
  status: FleetStatus;
  isVerified: boolean;
  createdAt: string;
  industry: string;
  briefDescription: string;
  fleetSize: string; // size category, e.g. 'medium'
  kycStatus: FleetKycStatus;
  stats: FleetDetailStats;
  subscription: FleetSubscription;
  vehicles: FleetVehicle[];
  drivers: FleetDetailDriver[];
  managers: FleetManager[];
  subFleets: FleetSubFleet[];
};

// ---------------------------------------------------------------------------
// Dashboard / Analytics types (GET /admin/analytics/dashboard)
// ---------------------------------------------------------------------------

export type DashboardSummary = {
  totalRevenue: number;
  revenueChange: number;
  totalUsers: number;
  usersChange: number;
  totalFleets: number;
  fleetsChange: number;
  totalSosAlerts: number;
  sosChange: number;
};

export type DashboardUserGrowthChart = {
  labels: string[];
  data: number[];
  newUsers: number[];
};

export type DashboardHazardMix = {
  labels: string[];
  data: number[];
  colors: string[];
};

export type DashboardActivityActor = {
  name: string;
  initials: string;
  role: string;
};

export type DashboardActivity = {
  id: string;
  type: string;
  action: string;
  description: string;
  actor: DashboardActivityActor;
  targetType: string;
  targetId: string;
  icon: string;
  color: string;
  status: string;
  createdAt: string;
  timeAgo: string;
};

export type DashboardAnalytics = {
  summary: DashboardSummary;
  userGrowthChart: DashboardUserGrowthChart;
  hazardMix: DashboardHazardMix;
  recentActivity: DashboardActivity[];
  revenueVsFleetChart: DashboardRevenueVsFleetChart;
  hazardSosVsCity: DashboardHazardSosVsCity;
  usersByCity: DashboardUsersByCity;
};

export type DashboardRevenueVsFleetChart = {
  labels: string[];
  revenue: number[];
  fleets: number[];
};

export type DashboardHazardSosVsCity = {
  labels: string[];
  hazards: number[];
  sos: number[];
};

export type DashboardUsersByCity = {
  labels: string[];
  data: number[];
};

// ---------------------------------------------------------------------------
// Analytics chart types
// ---------------------------------------------------------------------------

/** A single data series for the analytics line charts. */
export type LineSeries = {
  id: string;
  label: string;
  /** Stroke color (hex) */
  color: string;
  /** Optional hex used for the area gradient fill (defaults to color) */
  fillFrom?: string;
  values: number[];
  /** Optional value formatter for tooltips (defaults to en-US locale string) */
  format?: (value: number) => string;
};

// ---------------------------------------------------------------------------
// SOS Monitor types (GET /admin/sos, POST /admin/sos/:id/resolve)
// ---------------------------------------------------------------------------

export type SosAlertStatus = 'PENDING' | 'CONFIRMED' | 'RESOLVED' | (string & {});

export type SosAlertDriver = {
  id: string;
  fullName: string;
  initials: string;
  phoneNumber: string;
  email: string;
  fleetCompanyId: string;
  fleetName: string;
  subFleetId: string;
  subFleetName: string;
};

export type SosAlertVehicle = {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
} | null;

export type SosAlert = {
  id: string;
  type: string;
  status: SosAlertStatus;
  message: string;
  latitude: number;
  longitude: number;
  locationAddress: string;
  contactsNotified: number;
  contacts: string[];
  createdAt: string;
  updatedAt: string;
  elapsedTime: number | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  confirmedNote: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  /** null when the API has no linked driver record (e.g. deleted/unenrolled driver). */
  driver: SosAlertDriver | null;
  vehicle: SosAlertVehicle;
};

export type SosStats = {
  total: number;
  active: number;
  pending: number;
  confirmed: number;
  resolved: number;
  cancelled: number;
};

export type SosPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SosResponse = {
  alerts: SosAlert[];
  stats: SosStats;
  pagination: SosPagination;
};

// ---------------------------------------------------------------------------
// Subscription Management types (GET /admin/subscriptions, GET /admin/subscriptions/:id)
// ---------------------------------------------------------------------------

/** Real backend statuses are lowercase; the union stays open for unseen values. */
export type SubscriptionStatusValue = 'pending' | 'trial' | 'active' | (string & {});

export type SubscriptionUser = {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  phoneNumber: string | null;
};

export type SubscriptionOrganization = {
  id: string;
  name: string;
  region: string;
  status: string;
  isVerified: boolean;
};

export type SubscriptionInvoice = {
  invoiceNumber: string;
  plan: string;
  pricePerVehicle: number;
  amount: number;
  date: string;
  dueDate: string;
  paidAt: string | null;
  status: 'Paid' | 'Pending' | (string & {});
  paymentReference: string | null;
  paymentMethod: string;
};

export type Subscription = {
  id: string;
  subscriptionCode: string;
  plan: string; // lowercase enum, e.g. 'pro' | 'starter' | 'free_trial'
  status: SubscriptionStatusValue;
  billingCycle: string;
  pricePerVehicle: number;
  totalPrice: number;
  amount: number;
  vehicleCount: number;
  driverCount: number;
  startDate: string;
  endDate: string;
  renewalDate: string;
  daysRemaining: number;
  isExpired: boolean;
  isTrial: boolean;
  features: Record<string, boolean | number>;
  paymentStatus: string;
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: SubscriptionUser;
  organization: SubscriptionOrganization;
  /** Only populated on the by-id response, not the list. */
  paymentHistory?: SubscriptionInvoice[];
};

export type SubscriptionStats = {
  totalRevenue: number;
  activeSubscriptions: number;
  freeUsers: number;
  expiredOrCancelled: number;
  mrr: number;
};

export type SubscriptionsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SubscriptionsResponse = {
  subscriptions: Subscription[];
  stats: SubscriptionStats;
  pagination: SubscriptionsPagination;
};

// ---------------------------------------------------------------------------
// Hazard Moderation types (GET /admin/hazards)
// ---------------------------------------------------------------------------

export type HazardStatus = 'APPROVED' | 'REJECTED' | 'RESOLVED';

export type HazardType = 'POTHOLE' | 'FLOOD' | 'ACCIDENT' | 'DEBRIS' | 'ROAD' | 'CHECKPOINT' | 'DANGER' | 'SOS';

export type HazardSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type HazardDriver = {
  id: string;
  fullName: string;
  initials: string;
  phoneNumber: string;
  licenseNumber: string;
  fleetCompanyId: string | null;
  fleetName: string;
  subFleetId: string | null;
  subFleetName: string;
};

export type HazardConfirmations = {
  total: number;
  confirmed: number;
  rejected: number;
};

export type Hazard = {
  id: string;
  type: HazardType;
  description: string;
  severity: HazardSeverity;
  status: HazardStatus;
  latitude: number;
  longitude: number;
  locationAddress: string;
  photoUrl: string | null;
  isAnonymous: boolean;
  isResolved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  driver: HazardDriver;
  confirmations: HazardConfirmations;
};

export type HazardStats = {
  total: number;
  approved: number;
  rejected: number;
  resolved: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
};

export type HazardsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type HazardsResponse = {
  hazards: Hazard[];
  stats: HazardStats;
  pagination: HazardsPagination;
};

