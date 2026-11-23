import type { MetadataRoute } from 'next';

/**
 * Layer 3 of 3: disallow everything. There is deliberately no sitemap
 * (no app/sitemap.ts, no public/sitemap.xml) — this is an admin dashboard
 * and must not appear in search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
