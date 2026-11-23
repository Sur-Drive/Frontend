import type { EntityKind } from "@/types/entity-details";

// Derives human success wording from the entity kind + action id, using the
// entity's display name as the subject. Kept out of the components so the
// shared drawer and the finance/people views can reuse it. Unknown pairs fall
// back to a neutral (non-generic) message so new entity actions still toast.
export function entityActionMessage(
  entity: EntityKind,
  actionId: string,
  subject: string,
): { title: string; description: string } {
  switch (`${entity}:${actionId}`) {
    // People & Fleets
    case "driver:suspend":
      return { title: "Driver suspended", description: `${subject} has been suspended.` };
    case "driver:reactivate":
      return { title: "Driver reactivated", description: `${subject} has been reactivated.` };
    case "driver:request-documents":
      return { title: "Documents requested", description: `A document request was sent to ${subject}.` };
    case "driver:approve":
      return { title: "Driver approved", description: `${subject} has been approved.` };
    case "fleet:suspend":
      return { title: "Fleet suspended", description: `${subject} has been suspended.` };
    case "fleet:review-documents":
      return { title: "Documents under review", description: `${subject}'s documents are being reviewed.` };
    case "fleet:approve-fleet":
      return { title: "Fleet approved", description: `${subject} has been approved.` };
    case "passenger:restrict":
      return { title: "Passenger restricted", description: `${subject} has been restricted.` };
    case "passenger:reactivate":
      return { title: "Passenger reactivated", description: `${subject} has been reactivated.` };
    case "vehicle:reject":
      return { title: "Vehicle rejected", description: `${subject} has been rejected.` };
    case "vehicle:request-correction":
      return { title: "Correction requested", description: `A correction was requested for ${subject}.` };
    case "vehicle:approve":
      return { title: "Vehicle approved", description: `${subject} has been approved.` };
    // Verification
    case "verification:reject":
      return { title: "Submission rejected", description: `${subject} has been rejected.` };
    case "verification:request-resubmission":
      return { title: "Resubmission requested", description: `A resubmission was requested for ${subject}.` };
    case "verification:approve":
      return { title: "Submission approved", description: `${subject} has been approved.` };
    // Finance
    case "settlement:flag-investigation":
      return { title: "Flagged for investigation", description: `${subject} has been flagged.` };
    case "settlement:retry-payout":
      return { title: "Payout retry started", description: `The payout for ${subject} is being retried.` };
    case "settlement:approve-payout":
      return { title: "Payout approved", description: `The payout for ${subject} has been approved.` };
    case "transaction:initiate-refund":
      return { title: "Refund initiated", description: `A refund has been initiated for ${subject}.` };
    // Promotions
    case "promotion:expire":
      return { title: "Campaign expired", description: `${subject} has been expired.` };
    case "promotion:pause":
      return { title: "Campaign paused", description: `${subject} has been paused.` };
    case "promotion:activate":
      return { title: "Campaign activated", description: `${subject} is now active.` };
    // Trust & Support — Safety & Incidents
    case "incident:assign-officer":
      return { title: "Officer assigned", description: `An officer has been assigned to ${subject}.` };
    case "incident:escalate":
      return { title: "Incident escalated", description: `${subject} has been escalated to the senior team.` };
    case "incident:resolve":
      return { title: "Incident resolved", description: `${subject} has been resolved.` };
    // Trust & Support — Support Centre
    case "supportTicket:assign":
      return { title: "Ticket assigned", description: `An agent has been assigned to ${subject}.` };
    case "supportTicket:escalate":
      return { title: "Ticket escalated", description: `${subject} has been escalated to urgent.` };
    case "supportTicket:resolve":
      return { title: "Ticket resolved", description: `${subject} has been resolved.` };
    case "supportTicket:create":
      return { title: "Ticket created", description: `${subject} has been created.` };
    // Trust & Support — Ratings & Reviews
    case "review:dismiss":
      return { title: "Review dismissed", description: `${subject} has been dismissed.` };
    case "review:flag":
      return { title: "Review flagged", description: `${subject} has been flagged for follow-up.` };
    case "review:unflag":
      return { title: "Flag removed", description: `The flag on ${subject}'s review has been removed.` };
    // Trust & Support — Fraud & Risk
    case "riskCase:escalate":
      return { title: "Risk case escalated", description: `${subject} has been escalated to the senior team.` };
    case "riskCase:expire":
      return { title: "Risk closed", description: `${subject} has been closed.` };
    // System — Notifications
    case "notification:send-now":
      return { title: "Notification sent", description: `${subject} has been sent to its audience.` };
    case "notification:cancel-schedule":
      return { title: "Schedule cancelled", description: `${subject} is back in drafts.` };
    case "notification:retry-send":
      return { title: "Retry queued", description: `A retry for ${subject} has been queued.` };
    default:
      return { title: "Changes saved", description: `${subject} has been updated.` };
  }
}

// Ride operations drawer actions (separate from the shared entity drawer).
export function rideActionMessage(
  action: "escalate" | "review-fare",
  rideId: string,
): { title: string; description: string } {
  if (action === "escalate") {
    return { title: "Ride escalated", description: `Ride ${rideId} has been escalated to support.` };
  }
  return { title: "Fare review requested", description: `A fare review has been requested for ride ${rideId}.` };
}
