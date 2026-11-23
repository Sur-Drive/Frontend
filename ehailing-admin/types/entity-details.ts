import type { StatusTone } from "@/components/ui/StatusPill";
import type { DetailItem } from "@/types/ride-details";
import type { Person } from "@/types/rides";
import type { VehicleAccount } from "@/types/vehicles";
import type { VerificationRequest } from "@/types/verification";
import type {
  DriverDocumentCounts,
  DriverFinancialsPayload,
  DriverPerformancePayload,
  DriverRidesPayload,
} from "@/types/drivers-api";

// Presentation-agnostic model for the shared entity details drawer, so
// Passengers, Drivers, Vehicle Management, Fleet Management and the
// Verification Centre can all feed it.

export type EntityKind =
  | "passenger"
  | "driver"
  | "vehicle"
  | "fleet"
  | "verification"
  | "transaction"
  | "settlement"
  | "promotion"
  | "incident"
  | "supportTicket"
  | "review"
  | "riskCase"
  | "notification"
  | "adminUser";

// Avatar tone set (mirrors InitialsAvatar's tone prop).
export type AvatarTone = "brand" | "success" | "warning" | "info";

// One clickable row of the driver drawer's Documents tab: the facts the review
// panel shows plus the routing needed to decide the document.
export interface DocumentReviewRow {
  key: string;
  document: string;
  type: string;
  issuer: string;
  status: string;
  reference: string;
  // https:// only; null when the backend has no file or the URL is unsafe.
  url: string | null;
  actionTarget?: EntityActionTarget;
}

export type DocumentDecisionAction = "approve" | "reject";

// What the drawer hands back when the review panel's action is confirmed.
export interface DocumentDecisionRequest {
  row: DocumentReviewRow;
  action: DocumentDecisionAction;
  note: string;
}

export type DetailSection =
  | {
      kind: "profile";
      name: string;
      initials: string;
      tone: AvatarTone;
      subtitle: string;
      pill: { tone: StatusTone; label: string };
    }
  | { kind: "stats"; items: { label: string; value: string }[] }
  // Placeholder photo gallery; views are labels for each angle.
  | { kind: "gallery"; views: string[] }
  | { kind: "info"; title: string; items: DetailItem[] }
  // Live channel preview of a notification body (same component as the composer).
  | {
      kind: "preview";
      title: string;
      channel: "Push" | "Email" | "SMS" | "Push + Email";
      subject: string;
      message: string;
    }
  | { kind: "timeline"; title: string; steps: { title: string; time: string }[] }
  | {
      kind: "list";
      title?: string;
      rows: {
        title: string;
        subtitle?: string;
        value?: string;
        pill?: { tone: StatusTone; label: string };
      }[];
      emptyMessage: string;
    }
  // Clickable documents: each row opens the review panel, which renders the
  // file preview and, for a pending document, the Approve/Reject decisions.
  | {
      kind: "documentList";
      title?: string;
      rows: DocumentReviewRow[];
      emptyMessage: string;
    }
  | { kind: "empty"; title: string; message: string }
  // Placeholder document preview sheet for verification submissions.
  | {
      kind: "document";
      title: string;
      issuer: string;
      docTitle: string;
      name: string;
      initials: string;
      tone: AvatarTone;
      refNumber: string;
      expiry: string | null;
    }
  // Local-only reviewer notes field (nothing is persisted yet).
  | { kind: "notes"; title: string; placeholder: string }
  | {
      kind: "reference";
      label: string;
      value: string | null;
      pill: { tone: StatusTone; label: string };
      tone: "success" | "warning" | "danger";
    }
  | {
      kind: "breakdown";
      title: string;
      rows: { label: string; value: string }[];
      total: { label: string; value: string };
    }
  | {
      kind: "payout";
      caption: string;
      bank: string;
      accountNumber: string;
      holder: string;
    };

export interface DetailTab {
  id: string;
  label: string;
  // Optional short note rendered under the tab title (e.g. the performance
  // window). Omitted when the backend value is missing or unobserved.
  note?: string;
  sections: DetailSection[];
}

// Vehicle fields for the driver drawer's Vehicle tab. The vehicle detail
// response (observed 2026-11-10) carries make/model/registrationNumber/
// category/capacity/plateNumber only — no year, colour, VIN, insurance,
// roadworthiness or inspection status — so those rows render "—" in the
// drawer and are deliberately not part of this shape.
export interface DriverVehicleInfo {
  id: string;
  make: string;
  model: string;
  regNumber: string;
  driver: Person;
  category: string;
  account: VehicleAccount;
}

// One entry of the driver drawer's `tabData` record (keyed by tab id).
// `loaded` is set only after a successful fetch and is deliberately separate
// from the payload arrays: an empty array can be a true zero, so it must never
// imply "not fetched yet". An unloaded or failed tab has no entry (or
// loaded=false) and its stats render "—".
export interface DriverDetailData {
  loaded: boolean;
  verifications?: VerificationRequest[] | null;
  vehicles?: DriverVehicleInfo[] | null;
  documentCounts?: DriverDocumentCounts | null;
  performance?: DriverPerformancePayload | null;
  financials?: DriverFinancialsPayload | null;
  rideHistory?: DriverRidesPayload | null;
}

export interface DetailAction {
  id: string;
  label: string;
  variant: "danger" | "outline" | "brand";
  dialogTitle: string;
  confirmTone?: "brand" | "danger";
  // The dialog's note field label; defaults to "Internal note".
  noteLabel?: string;
  // Makes the dialog's note field mandatory (destructive / restrictive actions
  // must be given a reason before they can be confirmed).
  noteRequired?: boolean;
  // Placeholder for the dialog's note field.
  notePlaceholder?: string;
  href?: string;
  // Renders the footer action disabled (e.g. not valid for the current status).
  disabled?: boolean;
  // Tooltip shown on the disabled button explaining why it can't be used.
  disabledReason?: string;
}

// Extra identifiers a drawer footer action's endpoint needs beyond the model
// id: the verification decision endpoints PATCH
// /admin/ride-hailing/verification/{profileId}/documents/{documentKey} key on
// the applicant profile plus one or more document keys (the submission drawer
// decides its single document; the vehicle drawer decides every vehicle
// document still awaiting a decision).
export interface EntityActionTarget {
  profileId: string;
  documentKeys: string[];
}

export interface EntityDetailsModel {
  entity: EntityKind;
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  tabs: DetailTab[];
  actions: DetailAction[];
  // Present only when the model's actions route through a keyed endpoint;
  // EntityDrawer forwards it to runEntityAction with the confirmed action.
  actionTarget?: EntityActionTarget;
}
