import {
  Activity,
  BadgeCheck,
  Banknote,
  Bell,
  Bus,
  CalendarClock,
  Car,
  ChartColumn,
  CreditCard,
  IdCard,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  ScrollText,
  Settings,
  Settings2,
  ShieldAlert,
  ShieldX,
  Star,
  Tags,
  Truck,
  Undo2,
  User,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  slug: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// slug is the kebab-case path segment with "&" dropped; Dashboard routes to /admin.
function navItem(label: string, slug: string, icon: LucideIcon): NavItem {
  return { label, slug, href: slug ? `/admin/${slug}` : "/admin", icon };
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [navItem("Dashboard", "", LayoutDashboard)],
  },
  {
    label: "Operations",
    items: [
      navItem("Live Operations", "live-operations", Activity),
      navItem("Ride Management", "ride-management", Car),
      navItem("Scheduled Rides", "scheduled-rides", CalendarClock),
    ],
  },
  {
    label: "People & Fleets",
    items: [
      navItem("Passengers", "passengers", Users),
      navItem("Drivers", "drivers", IdCard),
      navItem("Vehicle Management", "vehicle-management", Truck),
      navItem("Fleet Management", "fleet-management", Bus),
      navItem("Verification Centre", "verification-centre", BadgeCheck),
    ],
  },
  {
    label: "Finance",
    items: [
      navItem("Payments & Transactions", "payments-transactions", CreditCard),
      navItem("Driver Settlements", "driver-settlements", Banknote),
      navItem("Refunds", "refunds", Undo2),
    ],
  },
  {
    label: "Growth",
    items: [
      navItem("Pricing & Categories", "pricing-categories", Tags),
      navItem("Promotions", "promotions", Megaphone),
    ],
  },
  {
    label: "Trust & Support",
    items: [
      navItem("Safety & Incidents", "safety-incidents", ShieldAlert),
      navItem("Support Centre", "support-centre", LifeBuoy),
      navItem("Ratings & Reviews", "ratings-reviews", Star),
      navItem("Fraud & Risk", "fraud-risk", ShieldX),
    ],
  },
  {
    label: "System",
    items: [
      navItem("Analytics & Reports", "analytics-reports", ChartColumn),
      navItem("Notifications", "notifications", Bell),
      navItem("Platform Settings", "platform-settings", Settings),
      navItem("Admin Users & Roles", "admin-users-roles", UserCog),
      navItem("Activity Logs", "activity-logs", ScrollText),
    ],
  },
];

// Non-nav pages reachable from the user menu. Labels double as the topbar
// breadcrumb text, so they use the design's title casing.
export const EXTRA_PAGES: NavItem[] = [
  { label: "My Profile", slug: "profile", href: "/admin/profile", icon: User },
  {
    label: "Account Settings",
    slug: "account-settings",
    href: "/admin/account-settings",
    icon: Settings2,
  },
];

const ALL_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  ...EXTRA_PAGES,
];

export function getPageTitle(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/admin";
  if (path === "/admin") return "Dashboard";
  const match = ALL_ITEMS.find((item) => item.href === path);
  return match ? match.label : "";
}
