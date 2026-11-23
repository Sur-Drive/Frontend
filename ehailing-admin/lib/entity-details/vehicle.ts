import {
  EM_DASH,
  formatDateLabel,
  formatNumber,
  humanize,
} from "@/lib/format";
import {
  vehicleAccountDisplay,
  vehicleDocumentDisplay,
  vehicleInspectionDisplay,
  vehiclePhotoDisplay,
} from "@/types/vehicles";
import type { EntityDetailsModel } from "@/types/entity-details";
import type { VehicleDetailResponse } from "@/types/vehicles-api";
import type { Vehicle } from "@/types/vehicles";

// Footer actions: Approve/Reject route through the confirmed verification
// decision endpoints (PATCH
// /admin/ride-hailing/verification/{profileId}/documents/{documentKey},
// body { decision }) — the vehicle drawer decides every vehicle document that
// still needs one. "Request correction" has no confirmed decision value and
// stays disabled with "Not available yet".
function isActionWired(actionId: string): boolean {
  return new Set(["approve", "reject"]).has(actionId);
}

// The three document keys the backend's vehicle verification tab owns
// (vehicle tab: ownershipDocument | roadworthiness |
// vehicleLicense). driversLicense/facePhoto belong to the driver verification
// tab, and facePhoto has no decision endpoint at all — the vehicle drawer
// never decides those.
const VEHICLE_DOCUMENT_KEYS = new Set([
  "ownershipDocument",
  "vehicleLicense",
  "roadworthiness",
]);

// Statuses that still need a decision: pending (awaiting review) or rejected
// (may be re-decided). Verified documents are left alone; unknown future
// statuses are never decided. After a partially-applied batch the drawer
// refetches the detail, so this list recomputes and a retry only targets the
// documents that are still undecided.
const DECIDABLE_STATUSES = new Set(["pending", "rejected"]);

// Vehicle documents awaiting a decision, in the backend's document order.
// An unloaded detail yields [] so the actions disable instead of guessing.
function decidableDocumentKeys(
  detail: VehicleDetailResponse | null | undefined,
): string[] {
  if (!detail || !Array.isArray(detail.documents)) return [];
  return detail.documents
    .filter(
      (doc) =>
        doc &&
        typeof doc.documentKey === "string" &&
        VEHICLE_DOCUMENT_KEYS.has(doc.documentKey) &&
        typeof doc.status === "string" &&
        DECIDABLE_STATUSES.has(doc.status),
    )
    .map((doc) => doc.documentKey);
}

// Stat helpers: null (missing or unloaded) is always "—", never a 0.
function numLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNumber(value);
}

function text(value: string | null | undefined): string {
  return value && value.trim() ? value : EM_DASH;
}

// Inspection photo tiles are labelled with the backend's own shot names
// (observed: Front, Back, Dashboard, …) and only for photos actually on
// file; an unloaded or photo-less detail renders no gallery at all rather
// than placeholder labels.
function uploadedPhotoViews(
  detail: VehicleDetailResponse | null | undefined,
): string[] {
  if (!detail || !Array.isArray(detail.inspectionPhotos)) return [];
  return detail.inspectionPhotos
    .filter(
      (photo) =>
        photo && photo.uploaded && typeof photo.url === "string" && photo.url,
    )
    .map((photo) => text(photo.name))
    .filter((name) => name !== EM_DASH);
}

// Renders from the live list record plus the optional vehicle detail, which
// the view fetches once when the drawer opens. Tab values come from the
// endpoint payload: an unloaded or failed detail renders "—", a loaded one
// shows the backend's true zeros (e.g. 0 uploaded photos).
export function buildVehicleDetails(
  vehicle: Vehicle,
  detail?: VehicleDetailResponse | null,
): EntityDetailsModel {
  const loaded = Boolean(detail);
  const vehicleInfo = detail?.vehicle ?? null;
  const approval = detail?.approval ?? null;
  const summary = detail?.inspectionSummary ?? null;
  const galleryViews = uploadedPhotoViews(detail);
  const decisionKeys = decidableDocumentKeys(detail);
  const canDecide = decisionKeys.length > 0;
  // Reasons differ: without a loaded detail the documents simply have not
  // arrived yet; with one loaded, nothing is awaiting a decision.
  const decideDisabledReason = !loaded
    ? "Vehicle documents have not loaded yet."
    : "No pending documents to decide.";

  const documentRows = loaded
    ? (detail?.documents ?? []).map((doc) => ({
        title: text(doc.documentName),
        subtitle: formatDateLabel(doc.expiryDate),
        pill: vehicleDocumentDisplay(doc.status),
      }))
    : [];

  const photoRows = loaded
    ? (detail?.inspectionPhotos ?? []).map((photo) => ({
        title: text(photo.name),
        pill: vehiclePhotoDisplay(photo.uploaded === true),
      }))
    : [];


  return {
    entity: "vehicle",
    id: vehicle.id,
    eyebrow: "VEHICLE DETAILS",
    title: vehicle.makeModel,
    subtitle: vehicle.regNumber,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        sections: [
          ...(galleryViews.length > 0
            ? [{ kind: "gallery" as const, views: galleryViews }]
            : []),
          {
            kind: "info",
            title: "Vehicle information",
            items: [
              { label: "Make & model", value: vehicle.makeModel },
              // No year/colour/VIN field exists on this endpoint — "—", never
              // a fabricated value.
              { label: "Year", value: EM_DASH },
              { label: "Colour", value: EM_DASH },
              { label: "Registration number", value: vehicle.regNumber },
              { label: "VIN", value: EM_DASH },
              { label: "Plate number", value: text(vehicleInfo?.plateNumber) },
              {
                label: "Capacity",
                value: numLabel(vehicleInfo?.capacity ?? null),
              },
              { label: "Driver", value: vehicle.driver.name },
              { label: "Category", value: vehicle.category },
              {
                label: "Account status",
                value: null,
                pill: {
                  tone: vehicleAccountDisplay(vehicle.account).tone,
                  label: vehicleAccountDisplay(vehicle.account).label,
                },
              },
              {
                label: "Onboarding step",
                value: loaded ? text(humanize(approval?.onboardingStep)) : EM_DASH,
              },
            ],
          },
          {
            kind: "info",
            title: "Compliance",
            items: [
              { label: "Insurance expiry", value: vehicle.insuranceExpiry },
              // No roadworthiness field on this endpoint.
              { label: "Roadworthiness", value: EM_DASH },
              { label: "Nearest document", value: vehicle.nearestDocument },
              {
                label: "Inspection status",
                value: null,
                pill: {
                  tone: vehicleInspectionDisplay(vehicle.inspectionComplete)
                    .tone,
                  label: vehicleInspectionDisplay(vehicle.inspectionComplete)
                    .label,
                },
              },
              { label: "Last inspection", value: EM_DASH },
              {
                label: "Document issues",
                value: null,
                pill: vehicle.hasDocumentIssues
                  ? { tone: "danger" as const, label: "Issues found" }
                  : { tone: "success" as const, label: "None" },
              },
            ],
          },
        ],
      },
      {
        id: "documents",
        label: "Documents",
        sections: [
          loaded
            ? {
                kind: "list" as const,
                title: "Documents",
                rows: documentRows,
                emptyMessage: "No documents on file for this vehicle.",
              }
            : {
                kind: "empty" as const,
                title: "Documents",
                message:
                  "Vehicle documents will appear here once the details load.",
              },
        ],
      },
      {
        id: "inspections",
        label: "Inspections",
        sections: [
          {
            kind: "stats" as const,
            items: [
              { label: "Uploaded", value: numLabel(summary?.uploaded ?? null) },
              { label: "Total", value: numLabel(summary?.total ?? null) },
              {
                label: "Missing",
                value: numLabel(summary?.missing?.length ?? null),
              },
            ],
          },
          loaded
            ? {
                kind: "list" as const,
                title: "Inspection photos",
                rows: photoRows,
                emptyMessage: "No inspection photos recorded yet.",
              }
            : {
                kind: "empty" as const,
                title: "Inspection photos",
                message:
                  "Inspection photos will appear here once the details load.",
              },
        ],
      },
      {
        id: "activity",
        label: "Activity",
        sections: [
          {
            kind: "empty" as const,
            title: "Activity",
            message: "Vehicle activity will appear here once connected.",
          },
        ],
      },
    ],
    ...(canDecide && vehicle.id
      ? {
          actionTarget: {
            profileId: vehicle.id,
            documentKeys: decisionKeys,
          },
        }
      : {}),
    actions: [
      {
        id: "reject",
        label: "Reject",
        variant: "danger" as const,
        dialogTitle: "Confirm reject",
        confirmTone: "danger" as const,
        disabled: !isActionWired("reject") || !canDecide,
        disabledReason: !isActionWired("reject")
          ? "Not available yet"
          : decideDisabledReason,
      },
      {
        id: "request-correction",
        label: "Request correction",
        variant: "outline" as const,
        dialogTitle: "Confirm request correction",
        disabled: true,
        disabledReason: "Not available yet",
      },
      {
        id: "approve",
        label: "Approve",
        variant: "brand" as const,
        dialogTitle: "Confirm approve",
        confirmTone: "brand" as const,
        disabled: !isActionWired("approve") || !canDecide,
        disabledReason: !isActionWired("approve")
          ? "Not available yet"
          : decideDisabledReason,
      },
    ],
  };
}

