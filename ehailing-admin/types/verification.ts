import { EM_DASH, humanize } from "@/lib/format";
import type { StatusTone } from "@/components/ui/StatusPill";
import type { AvatarTone } from "@/types/entity-details";

export type VerificationType = "Driver" | "Vehicle" | "Fleet";

// Mock-era status vocabulary. The driver drawer's documents mapping
// (lib/drivers.ts mapDocStatus) still produces these labels; verification
// centre rows carry the raw backend status string instead (see
// VerificationRequest.status). Render any status through
// verificationStatusDisplay() — never index VERIFICATION_STATUS_TONE directly
// with a raw value.
export type VerificationStatus =
  | "Pending Review"
  | "In Review"
  | "Resubmission"
  | "Approved"
  | "Rejected";

export interface VerificationRequest {
  id: string;
  applicant: string;
  initials: string;
  tone: AvatarTone;
  type: VerificationType;
  document: string;
  submittedLabel: string;
  // null when the document has no expiry.
  expiryLabel: string | null;
  // null when no reviewer is assigned yet.
  reviewer: string | null;
  // Raw status: verification-centre rows carry the backend value (observed
  // "pending" | "expired"; also seen as query/decision values "verified" |
  // "rejected" | "expiring_soon"), driver-drawer rows keep the display
  // vocabulary above. Empty string when the backend sent no status.
  status: string;
  expiringSoon: boolean;
  refNumber: string;
  issuer: string;
  // Present only on rows mapped from a backend documents response: the PATCH
  // decision endpoint keys on the applicant's profile plus the document key(s)
  // still awaiting a decision.
  actionTarget?: { profileId: string; documentKeys: string[] };
  // Raw file URL carried by the documents endpoint; null when the backend has
  // no file. Only https:// URLs are ever rendered (see safeDocumentUrl).
  documentUrl?: string | null;
  // Formatted verifiedAt label; set only when the backend carries a
  // verification timestamp (null in every observed sample so far).
  verifiedLabel?: string | null;
}

// Loaded stats render the endpoint's true zeros; an unloaded or failed stats
// fetch keeps every field null so the cards show "—", never a fabricated 0.
// There is no "In Review" field on the endpoint at all — the card is handled
// as unavailable in the view.
export interface VerificationSummary {
  pendingReview: number | null;
  approvedToday: number | null;
  expiringSoon: number | null;
  // From expiringSoonWindowDays; null when unknown.
  expiringSoonWindowDays: number | null;
}

export const VERIFICATION_STATUS_TONE: Record<
  VerificationStatus,
  StatusTone
> = {
  "Pending Review": "warning",
  "In Review": "info",
  Resubmission: "neutral",
  Approved: "success",
  Rejected: "danger",
};

// Maps a status onto the app's chip tones + label. Backend values seen so far
// (NOT exhaustive): pending, verified, rejected, expired, expiring_soon —
// pending/verified/rejected reuse the existing chip tones (warning/success/
// danger); expired and expiring_soon are outside the mock vocabulary and fall
// back to a neutral chip with a humanised label, as do any future unknown
// values. Also accepts the mock-era display labels produced for the driver
// drawer, which keep their original tones. Null/empty renders "—".
export function verificationStatusDisplay(status: string | null | undefined): {
  tone: StatusTone;
  label: string;
} {
  const raw = typeof status === "string" ? status.trim() : "";
  if (!raw) return { tone: "neutral", label: EM_DASH };
  switch (raw.toLowerCase()) {
    case "pending":
      return { tone: "warning", label: "Pending Review" };
    case "verified":
      return { tone: "success", label: "Approved" };
    case "rejected":
      return { tone: "danger", label: "Rejected" };
    case "expired":
      return { tone: "neutral", label: "Expired" };
    case "expiring_soon":
      return { tone: "neutral", label: "Expiring Soon" };
  }
  if (raw in VERIFICATION_STATUS_TONE) {
    return { tone: VERIFICATION_STATUS_TONE[raw as VerificationStatus], label: raw };
  }
  return { tone: "neutral", label: humanize(raw) };
}

