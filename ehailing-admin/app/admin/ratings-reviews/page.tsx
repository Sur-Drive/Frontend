import type { Metadata } from "next";
import { RatingsReviewsView } from "@/components/admin/trust/RatingsReviewsView";

export const metadata: Metadata = {
  title: "Ratings & Reviews | SUR-DRIVEHT Admin",
};

// Server shell only: the view fetches stats/list from the backend client-side
// (lib/ratings.ts) — no mock data.
export default function RatingsReviewsPage() {
  return <RatingsReviewsView />;
}

