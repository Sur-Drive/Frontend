import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Outfit } from 'next/font/google';
import './globals.css';

const font = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'SurDrive Admin',
  description: 'Admin dashboard for SurDrive',
  // Favicon follows the browser/OS color scheme — NOT the in-app dark mode
  // toggle (that only affects page styling). A single SVG (favicon.svg, built
  // by scripts/generate-favicons.ps1) embeds both marks as base64 PNGs and
  // swaps them itself via an inline prefers-color-scheme media query: navy eye
  // for light tabs, white eye + amber pin for dark tabs. Media attributes on
  // the <link> are unreliable (browsers pick the dark icon on both themes), so
  // the SVG does the switching. `sizes: 'any'` on the SVG is required —
  // without it Chrome prefers the .ico. The .ico (navy mark) stays as the
  // legacy fallback for browsers without SVG favicon support.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
  // Search engines must never index this admin dashboard — layer 1 of 3 (see
  // also the X-Robots-Tag response header in next.config.mjs and app/robots.ts).
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

/**
 * viewport-fit=cover, via Next's Viewport API (exported from 'next', Next 14's
 * shape — not the old `metadata.viewport` string). Without it the browser insets
 * the layout viewport for the phone's safe areas and every
 * env(safe-area-inset-*) resolves to 0, so the setting is the prerequisite for
 * any future safe-area padding — it does not itself add padding.
 *
 * Next merges this over its defaults (width=device-width, initial-scale=1), so
 * those are deliberately not restated here.
 */
export const viewport: Viewport = {
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Manual-only dark mode: read the theme cookie (set by the Topbar toggle).
  // Missing or "light" → light default; no prefers-color-scheme fallback.
  const theme = cookies().get('theme')?.value;

  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : undefined}>
      <body className={font.className}>{children}</body>
    </html>
  );
}
