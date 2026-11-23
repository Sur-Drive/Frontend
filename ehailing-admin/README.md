# SUR-DRIVEHT e-hailing Admin Portal

Admin portal for the SUR-DRIVEHT e-hailing platform, the companion to the SurDrive admin dashboard.

## Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19.3.0
- TypeScript 5
- Tailwind CSS 4
- recharts 3.10.1
- lucide-react 1.55.0

## Getting started

Requires Node.js >= 20.9.0.

```sh
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
npm run typecheck
```

The backend base URL is read from the `NEXT_PUBLIC_API_URL` environment
variable (set it in `.env.local`; it is the only environment variable the
app reads). Sessions are cookie-based tokens issued by the backend auth
endpoints, and a middleware layer (`proxy.ts`) guards the `/admin/*` routes.

## Backend-wired sections

Every wired section talks to the live backend through `apiFetch`
(`lib/api.ts`) via a per-section data layer in `lib/`:

- **Authentication** — `/login`, `/verify-otp` and `/forgot-password` call
  the real auth endpoints (sign-in, two-factor code, password-reset code
  request).
- **Overview dashboard** (`/admin`) and **Analytics & Reports**
  (`/admin/analytics-reports`) — KPI cards, charts and panels from the
  analytics endpoints.
- **Ride Management** (`/admin/ride-management`) — paginated ride list with
  backend search/status filters, CSV export and a ride details drawer.
- **Live Operations** (`/admin/live-operations`) — stats and the live ride
  queue from the operations endpoints (the zone map is a decorative SVG).
- **Passenger, Driver and Vehicle Management** — paginated lists with
  backend search/status filters, CSV exports and detail drawers; driver and
  passenger drawers fetch their sub-resource tabs, and vehicle document
  decisions go through the verification decision endpoints.
- **Verification Centre** (`/admin/verification-centre`) — tabbed records
  list with CSV export, document preview and approve/reject decisions
  (single document or bulk).
- **Finance** — Payments & Transactions, Refunds and Driver Settlements:
  lists, stats, details and timelines; detail drawers with a live notes tab
  (GET/POST `/admin/finance/notes`); refund initiation/approval and the
  settlement approve/retry/flag/unflag/reject actions; authenticated CSV
  exports.
- **Pricing & Categories** (`/admin/pricing-categories`).
- **Safety & Incidents** (`/admin/safety-incidents`) — list, stats, create,
  escalate and resolve.
- **Ratings & Reviews** (`/admin/ratings-reviews`) and
  **Fraud & Risk** (`/admin/fraud-risk`).
- **Notifications** (`/admin/notifications`) — campaigns list, stats,
  detail, create, send-now/retry/cancel-schedule. Delivery history renders
  a live error state (the backend endpoint currently returns 500).
- **Activity Logs** (`/admin/activity-logs`) — backend log list with stats,
  filters and CSV export.
- **Admin Users & Roles** (`/admin/admin-users-roles`) — roles, permission
  matrix, admin users and invites via the RBAC endpoints (role
  create/update/delete, permission saves, admin role changes, invites).

## Local-only sections (no backend endpoints yet)

These render from local mock data or session state and say so in the UI:

- Fleet Management (`/admin/fleet-management`)
- Scheduled Rides (`/admin/scheduled-rides`)
- Support Centre (`/admin/support-centre`)
- Promotions (`/admin/promotions`)
- Platform Settings (`/admin/platform-settings`) — saving is a typed local
  stub
- My Profile and Account Settings — session-only saves
