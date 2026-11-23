import { EM_DASH } from "@/lib/format";
import { verificationStatusDisplay } from "@/types/verification";
import type { DetailSection, EntityDetailsModel } from "@/types/entity-details";
import type { VerificationRequest } from "@/types/verification";

// Footer actions: Approve/Reject route through the confirmed decision
// endpoint PATCH /admin/ride-hailing/verification/{profileId}/documents/
// {documentKey} with { decision: "verified" | "rejected" } (api/
// verification.http). "Request Resubmission" has no confirmed decision value
// and stays disabled with "Not available yet".
function isActionWired(actionId: string): boolean {
  return new Set(["approve", "reject"]).has(actionId);
}

const NOTES_SECTION: DetailSection = {
  kind: "notes",
  title: "Reviewer notes",
  placeholder: "Add notes visible to verification reviewers...",
};

// Timeline steps from the submission's real timestamps only — the backend
// carries no review history, so fabricated "assigned/reviewed" steps are
// never rendered. verifiedAt is null in every observed sample, so a pending
// row shows its single submitted step.
function buildReviewTimeline(
  request: VerificationRequest,
): { title: string; time: string }[] {
  const steps = [{ title: "Document submitted", time: request.submittedLabel }];
  if (request.verifiedLabel) {
    steps.push({ title: "Decision recorded", time: request.verifiedLabel });
  }
  return steps;
}

// Renders from the live list record — the verification endpoints have no
// per-submission detail GET, so every tab is row-derived (no lazy detail
// fetch exists to wire).
export function buildVerificationDetails(
  request: VerificationRequest,
): EntityDetailsModel {
  const display = verificationStatusDisplay(request.status);
  const decisionReady = isActionWired("approve") && Boolean(request.actionTarget);
  const reviewSteps = buildReviewTimeline(request);

  return {
    entity: "verification",
    id: request.id,
    eyebrow: "VERIFICATION DETAILS",
    title: request.applicant,
    subtitle: `${request.id} • Submitted ${request.submittedLabel}`,
    // The drawer's target is the action-routing shape: one submission row
    // decides its single document.
    ...(request.actionTarget ? { actionTarget: request.actionTarget } : {}),
    tabs: [
      {
        id: "overview",
        label: "Overview",
        sections: [
          {
            kind: "document",
            title: "Document preview",
            // The endpoint carries no issuer or reference-number field, so the
            // preview shows "—" instead of a fabricated value.
            issuer: request.issuer,
            docTitle: request.document.toUpperCase(),
            name: request.applicant,
            initials: request.initials,
            tone: request.tone,
            refNumber: request.refNumber,
            expiry: request.expiryLabel,
          },
          {
            kind: "info",
            title: "Applicant details",
            items: [
              { label: "ID", value: request.id },
              { label: "Type", value: request.type },
              { label: "Document", value: request.document },
              { label: "Submitted", value: request.submittedLabel },
              { label: "Expiry", value: request.expiryLabel ?? EM_DASH },
              { label: "Reviewer", value: request.reviewer ?? "Unassigned" },
              {
                label: "Status",
                value: null,
                pill: {
                  tone: display.tone,
                  label: display.label,
                },
              },
            ],
          },
          {
            kind: "timeline",
            title: "Previous review history",
            steps: reviewSteps,
          },
          NOTES_SECTION,
        ],
      },
      {
        id: "timeline",
        label: "Timeline",
        sections: [
          {
            kind: "timeline",
            title: "Review timeline",
            steps: reviewSteps,
          },
        ],
      },
      {
        id: "history",
        label: "History",
        sections: [
          {
            kind: "empty",
            title: "History",
            message: "No earlier reviews for this submission.",
          },
        ],
      },
      {
        id: "notes",
        label: "Notes",
        sections: [NOTES_SECTION],
      },
    ],
    actions: [
      {
        id: "reject",
        label: "Reject",
        variant: "danger",
        dialogTitle: "Confirm reject",
        confirmTone: "danger",
        noteLabel: "Reason for rejection",
        noteRequired: true,
        notePlaceholder: "Explain why this submission was rejected...",
        disabled: !decisionReady || display.label === "Rejected",
        disabledReason: !decisionReady
          ? "Not available yet"
          : "This submission was already rejected.",
      },
      {
        id: "request-resubmission",
        label: "Request Resubmission",
        variant: "outline",
        dialogTitle: "Confirm request resubmission",
        noteLabel: "Required corrections",
        noteRequired: true,
        notePlaceholder: "List the changes the applicant needs to make...",
        disabled: true,
        disabledReason: "Not available yet",
      },
      {
        id: "approve",
        label: "Approve",
        variant: "brand",
        dialogTitle: "Confirm approve",
        confirmTone: "brand",
        noteLabel: "Reviewer note",
        notePlaceholder: "Add context for approving this submission...",
        disabled: !decisionReady || display.label === "Approved",
        disabledReason: !decisionReady
          ? "Not available yet"
          : "This submission is already approved.",
      },
    ],
  };
}
