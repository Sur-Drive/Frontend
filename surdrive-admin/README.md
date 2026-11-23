# SurDrive Admin

Admin dashboard for the **SUR-DRIVE** fleet management platform. It gives platform
administrators a single place to manage fleet operations, users/drivers,
subscriptions, content moderation, and live safety monitoring. The UI is built
1:1 from the SUR-DRIVE Figma design specs — exact spacing, colors, typography,
and component structure match the approved designs.

This is a standalone build that will later be merged into a larger team
repository, so the code is kept portable and free of app-specific dependencies
wherever possible.

---

## Tech Stack

| Layer          | Choice                                                          |
| -------------- | --------------------------------------------------------------- |
| Framework      | [Next.js](https://nextjs.org/) 14 (App Router)                  |
| Language       | [TypeScript](https://www.typescriptlang.org/)                   |
| Styling        | [Tailwind CSS](https://tailwindcss.com/) 3                      |
| Fonts          | Outfit (loaded via `next/font/google`)                          |
| Charts         | Custom-built with inline SVG + CSS (no charting library)        |

The runtime dependencies are intentionally minimal — only what the app
actually needs:

- `next`
- `react`
- `react-dom`

Dev dependencies cover the toolchain: `typescript`, `tailwindcss`,
`autoprefixer`, `postcss`, and the `@types/*` packages.

There is **no external charting library**. All charts (`GrowthChart`,
`HazardMix`, `LineChart`, `BarChart`, `FleetRevenueChart`, `UsersByCityChart`,
and `HazardsSosByCityChart`) are hand-drawn with SVG paths and CSS, including
hover states and tooltips.

---

## Getting Started

### Prerequisites

- **Node.js 18.17 or later** (the minimum for Next.js 14) and `npm`.
- A connection to Google Fonts is needed at runtime so the **Outfit** font
  can be fetched by `next/font/google`. Charts, layout, and the rest of the app
  work fine locally — just note the font is resolved at build/runtime via the
  Google Fonts service.

### Install

```bash
npm install
```

### Environment variables

There is no tracked `.env.example` anymore — add the values you need to
`.env.local` (**Local development**) and to *Project Settings → Environment
Variables* on Vercel for **both** Production and Preview (**Deployments**), then
restart the dev server so Next.js picks them up.

| Variable | Description | Where to get it |
| -------- | ----------- | --------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the SurDrive backend API, **without** a trailing slash. Read by `lib/api.ts` and used for every API call in the app. When unset it falls back to `http://localhost:3000`, so a missing value does **not** fail the build — every request fails at runtime instead. | The Railway backend host for the environment you are pointing at (ask the team / see the deployment settings). |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key for the SOS Monitor live map, read by `lib/googleMaps.ts`. **Currently a placeholder** — see the note below. | Google Cloud Console → *APIs & Services → Credentials* → **Create credentials → API key**, enable **Maps JavaScript API** on the project, and restrict the key by **HTTP referrer** (e.g. `localhost:3000/*` plus your Vercel domains). |

- **Both values are public.** The `NEXT_PUBLIC_` prefix inlines them into the
  client bundle at build time, so neither can hold a secret — which is why the
  Maps key is protected with a referrer restriction rather than kept private.
- **The Google Maps key is a placeholder for now.** Until a real key is
  available, set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to any placeholder value
  (e.g. `PLACEHOLDER_GOOGLE_MAPS_API_KEY`). `lib/googleMaps.ts` treats an empty
  *or* obviously-placeholder value as "not configured": it never injects the Maps
  `<script>` tag and reports `status: 'unavailable'`, so the SOS Monitor map
  renders a graceful "Map unavailable" message (with the reason) instead of
  crashing. Dropping in a real key needs a dev-server restart to take effect. The
  same fallback covers a rejected key (`gm_authFailure`), a failed script load,
  and a load timeout.

### Run the dev server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The app opens on the
sign-in screen; from there the admin app lives under `/admin`.

### Build for production

```bash
npm run build
npm start
```
---

## Project Structure

```
.
├── app/                     # App Router pages & layouts
│   ├── layout.tsx           # Root layout (loads the Outfit font)
│   ├── page.tsx             # "/" → sign-in split screen
│   ├── globals.css          # Tailwind + styled-scrollbar utility
│   ├── signin/              # Sign-in page
│   └── admin/               # Dashboard shell + all admin sections
│       ├── layout.tsx       # App shell: Sidebar + Topbar + main area
│       ├── page.tsx         # Overview (dashboard)
│       ├── user-management/
│       ├── fleet-management/          (includes [fleetId]/ detail route)
│       ├── sos-monitor/
│       ├── moderation/
│       ├── subscription-management/   (includes [subscriptionId]/ detail route)
│       ├── analytics/
│       └── settings/
├── components/
│   ├── ui/                  # Reusable primitives
│   │   ├── Button, TextField, Badge, StatusBadge, Toggle, Checkbox
│   │   ├── Toast, AlertBanner, BrandLogo
│   │   └── icons/           # Full in-app icon set (one file per icon)
│   └── admin/               # Feature components, one folder per admin section
│       ├── Sidebar, Topbar, ProfileDropdown, LogoutModal
│       ├── dashboard/
│       ├── user-management/
│       ├── fleet-management/
│       ├── sos-monitor/
│       ├── moderation/
│       ├── subscription-management/
│       ├── analytics/
│       └── settings/
├── lib/                     # Reserved for utilities / formatters / validation
├── types/                   # Reserved for shared TypeScript types
└── public/
    └── images/              # Static assets (avatars, logos, sign-in art)
```

### Naming & composition conventions

- **One component per file**, PascalCase filenames, **named exports** only.
- **Functional components + hooks only** — no class components.
- All styling is **Tailwind utility classes** in JSX — no inline `style`,
  no CSS modules.
- Generic, reusable primitives live in `components/ui`; feature-specific,
  composed components live in `components/admin/<section>`.

### The "one folder per admin section" pattern

Each admin section under `components/admin/` is self-contained and typically
contains:

- **`mockData.ts`** — the section's local data model and mock records. A
  `DEMO_POPULATED` flag used to toggle between the populated and empty states,
  but it is **no longer universal**: Analytics, Subscription Management, and
  Dashboard have no `mockData.ts` at all, and the flag now survives in only two
  files (Fleet Management and User Management) with no component consuming it —
  those populated/empty states come from real API responses now, so flipping the
  flag currently has no visible effect.
- **A `*View` / `*Panel` component** — the section's main composed UI shell.
- **Section-specific pieces** — actions menus, detail modals, and confirmation
  dialogs. Fleet Management additionally has a small `FleetStoreProvider` that
  shares state via React Context between the list and detail pages.

Two sections span multiple routes. `fleet-management` wraps its list + detail
pages in a layout-level Context provider so status changes (suspend/reactivate)
stay in sync across navigation. `subscription-management` spans the same two
routes, but its layout is a plain pass-through — the shared
`SubscriptionStoreProvider` was removed, so its list and detail pages hold their
own state.

### URL-synced table filters (`useTableFilters`)

Filtered list sections share one filter foundation: `lib/useTableFilters.ts`.
It holds the search text (debounced ~300 ms), status/tab filters, dropdown
filters, date range and current page, and serializes the **active** values to
the URL query string — so filters survive a refresh, can be shared as links,
and changing any filter resets pagination to page 1. Initial values are read
from `searchParams` by the server page component and passed in, which keeps
server and client render consistent (no `useSearchParams` Suspense boundary
needed). Companion UI lives in `components/ui`: `FilterPopover` (dropdown
filters) and `ActiveFilterIndicator` (active-filter chips + "clear all").

---

## Features / Sections

| Section | Route | What it does |
| ------- | ----- | ------------ |
| **Sign In** | `/signin` | Split-screen login with an illustrated showcase panel and a sign-in form. |
| **Sidebar navigation** | `/admin` (layout) | Collapsible left rail with route-driven active states and a pinned profile card. |
| **Dashboard Overview** | `/admin` | Stat tiles, a growth chart, a hazard mix chart, and a searchable recent-activity feed. |
| **User Management** | `/admin/user-management` | User list with filters, search, pagination, an invite flow, suspend/reactivate, and a driver-details modal. |
| **Fleet Management** | `/admin/fleet-management` (+ `[fleetId]`) | Fleet list and a rich details page; suspend/reactivate actions stay synced across pages. |
| **SOS Monitor** | `/admin/sos-monitor` | Live incident map, incident list, and incident detail view. |
| **Moderation Queue** | `/admin/moderation` | Review of hazard reports with approve/reject actions. |
| **Analytics** | `/admin/analytics` | Cross-platform charts (fleet vs. revenue, users/hazards/SOS by city) reusing the dashboard's stat row. |
| **Settings** | `/admin/settings` | Profile, notification, and password management forms and toggles. |
| **Subscription Management** | `/admin/subscription-management` (+ `[subscriptionId]`) | Billing overview with extend/cancel subscription flows (dedicated confirm modals) synced across pages. |

> **Advertisers** — not yet built. There is no `/admin/advertisers` route and no
> Figma design yet. The sidebar entry is **commented out** in
> `components/admin/Sidebar.tsx` (and its `MegaphoneIcon` import was removed to
> keep the file lint-clean), so it is not rendered and nothing links to the
> missing route. Uncomment the entry and re-add the import when the section is
> built.

---

## Current State / Known Limitations

This is a **UI-only build** — the front end is complete and interactive, but
nothing is connected to a backend yet. Be aware of the following:

- **`lib/` and `types/` are no longer placeholders.** `lib/` holds 11 modules —
  `api` (the fetch wrapper), `auth`, `cookies`, `fleets`, `drivers`,
  `subscriptions`, `hazards`, `sos`, `analytics`, `formatters`, and `chartScale`
  — and shared types live in `types/index.ts`. The section-level `mockData.ts`
  files are now mostly used for their types rather than their records; Settings
  still renders from mock data.
- **Actions update UI state only.** Suspend/reactivate (users & fleets), cancel/
  extend (subscriptions), invite, moderation approve/reject, and settings saves
  are fully functional in the UI but don't persist anywhere. They're wired to
  local component/session state and marked with `TODO` comments that say to
  replace them with real API calls.
- **Authentication is UI-only.** The Sign In form validates input and navigates,
  but doesn't talk to a real auth system. The sidebar profile ("Seun Tega") is
  mock data too.
- **Charts are bespoke SVG/CSS.** Deliberately no charting library, but the chart
  code carries a `TODO` noting it should be swapped for a real charting solution
  if interaction requirements grow.
- **Some sub-lists are static.** Within Fleet Details (drivers, fleet managers,
  sub-fleets) and several actions menus, nested lists and "wire up" buttons are
  visual stubs marked with `TODO`s (e.g. change-plan flow, resend invite,
  contact actions).
- **A few known data quirks** are flagged in code comments rather than "fixed,"
  since they trace back to the design source — e.g. a total-revenue figure in USD
  next to per-record amounts in ₦ on the subscription stat tiles.

---

## Design System Notes

- **Primary brand color** is **violet/purple** (`#7C3AED` / `#5B21B6` / `#1F083B`),
  used for buttons, active states, and the sidebar's active gradient.
- **Status colors**: teal (`#17A277`) for active/success, amber (`#DC8A0E`) for
  pending, red (`#F04438`) for suspended/errors. These are defined as design
  tokens in `tailwind.config.ts`.
- **Dotted status badges.** Statuses are rendered with the shared `StatusBadge`
  component — a pill with a leading dot that inherits its color from the badge
  text. This is used consistently for Active / Pending / Suspended / Expired /
  Cancelled states across every section.
- **Shared page patterns**:
  - *List pages* follow a consistent **stat-tiles → filter-tabs → search → table →
    pagination** structure (User Management, Fleet Management, Subscription
    Management).
  - *Detail flows* use a repeated **list → actions menu → confirm modal → toast**
    pattern, with `Toast` for success feedback and `ConfirmActionModal` (or a
    section-specific modal) for destructive/important actions.
- **Favicons** are scheme-aware, not theme-aware: `favicon.svg` embeds both
  marks (navy eye for light tabs, white eye + amber pin for dark tabs) and
  swaps them itself via an inline `prefers-color-scheme` media query,
  `favicon.ico` is the unmediated legacy fallback, and `apple-touch-icon.png`
  covers iOS. All three are generated from the logo PNGs in `public/images/`
  by `scripts/generate-favicons.ps1` (a one-off local script — `scripts/` is
  gitignored, the generated assets themselves are committed). There is
  deliberately **no web manifest**; the whole app is also non-indexable
  (`robots` metadata in `app/layout.tsx`, `X-Robots-Tag` header in
  `next.config.mjs`, and `app/robots.ts`).

---

## Contributing / Next Steps

The highest-value next steps, roughly in order:

1. **Finish real API integration.** Replace the remaining `mockData.ts` sources
   and `TODO`-marked action stubs with real data fetching and mutation calls.
   `FleetStoreProvider` (Fleet Management) is designed so that swap stays
   contained — update the fetch/seed inside the provider rather than every
   component.
2. **Consolidate `lib/` and `types/`.** `lib/` already holds the shared utilities
   (API wrapper, auth, formatters, chart scaling, and per-resource fetchers) and
   `types/index.ts` holds the shared types; fold the remaining duplicated
   section-level declarations into them once a backend contract is finalised.
3. **Build the Advertisers section.** Pending an approved Figma design; the
   sidebar entry is commented out and no route exists yet (see the note above).
4. **Integrate real authentication.** Replace the UI-only Sign In with a real
   auth provider and thread the authenticated user into the sidebar/topbar
   profile.

### Validation

Before pushing changes, run the type check:

```bash
npx tsc --noEmit
```

(The dev server and production builds are managed by the developer running the
project; a full build can be run with `npm run build`.)