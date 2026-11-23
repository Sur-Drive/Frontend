// Confirmed mutation endpoints. Response shapes have not been observed, so
// mutation responses are typed as unknown and never trusted.
//   PATCH /admin/ride-hailing/drivers/{id}/suspend   body { reason: string }
//   PATCH /admin/ride-hailing/drivers/{id}/unsuspend  body none
//   PATCH /admin/ride-hailing/drivers/{id}/approve    body none
//   PATCH /admin/ride-hailing/verification/{profileId}/documents/{documentKey}
//     body { decision: "verified" | "rejected" } —
//     used by the verification drawer (one key) and the vehicles drawer
//     (every vehicle document still awaiting a decision).
import { apiFetch } from "@/lib/api";
import type { EntityActionTarget, EntityKind } from "@/types/entity-details";

export interface EntityActionInput {
  entity: EntityKind;
  id: string;
  action: string;
  note: string;
  // Routing info for endpoints keyed on more than the row id; optional so the
  // driver/passenger flows keep their existing call shape.
  target?: EntityActionTarget;
}

type DriverSuspendBody = { reason: string };

async function runDriverAction(
  action: string,
  id: string,
  note: string,
): Promise<void> {
  const base = `/admin/ride-hailing/drivers/${encodeURIComponent(id)}`;
  switch (action) {
    case "suspend":
      await apiFetch<unknown>(`${base}/suspend`, {
        method: "PATCH",
        body: JSON.stringify({ reason: note } as DriverSuspendBody),
      });
      return;
    case "reactivate":
      await apiFetch<unknown>(`${base}/unsuspend`, { method: "PATCH" });
      return;
    case "approve":
      await apiFetch<unknown>(`${base}/approve`, { method: "PATCH" });
      return;
    default:
      throw new Error(`No confirmed endpoint for driver action "${action}".`);
  }
}

// PATCH /admin/ride-hailing/verification/{profileId}/documents/{documentKey}
// with { decision }. The response shape has never been observed (decisions
// are not sent from the terminal), so it is typed unknown and never trusted —
// the views refetch after this resolves. The confirm dialog's note has no
// confirmed body field on this endpoint, so it is deliberately NOT sent.
type VerificationDecisionBody = { decision: "verified" | "rejected" };

const VERIFICATION_DECISIONS: Record<
  string,
  VerificationDecisionBody["decision"]
> = {
  approve: "verified",
  reject: "rejected",
};

// Typed carrier for a partially-applied decision batch: `completed` of `total`
// PATCHes succeeded before one failed, so the backend HAS changed and the
// caller must refetch even though the action failed. The drawer reads these
// fields directly (never parses the message) to build
// "N of M documents updated: <backend message>".
export class PartialDecisionError extends Error {
  completed: number;
  total: number;

  constructor(completed: number, total: number, message: string) {
    super(message);
    this.name = "PartialDecisionError";
    this.completed = completed;
    this.total = total;
  }
}

// Decides each targeted document in order and fails fast: no further keys are
// sent after the first rejection. A failure on the FIRST key rethrows the
// original error untouched (nothing changed on the backend); a failure after
// earlier successes throws PartialDecisionError with the counts attached and
// the backend's message preserved.
async function runVerificationAction(
  action: string,
  entity: EntityKind,
  target: EntityActionTarget | undefined,
): Promise<void> {
  const decision = VERIFICATION_DECISIONS[action];
  if (!decision || !target?.profileId || !target.documentKeys?.length) {
    throw new Error(
      `No confirmed endpoint for ${entity} action "${action}".`,
    );
  }
  const keys = target.documentKeys;
  let completed = 0;
  for (const documentKey of keys) {
    try {
      await apiFetch<unknown>(
        `/admin/ride-hailing/verification/${encodeURIComponent(target.profileId)}/documents/${encodeURIComponent(documentKey)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ decision } as VerificationDecisionBody),
        },
      );
      completed += 1;
    } catch (cause) {
      if (completed === 0) throw cause;
      throw new PartialDecisionError(
        completed,
        keys.length,
        cause instanceof Error && cause.message
          ? cause.message
          : "Request failed. Please try again.",
      );
    }
  }
}

export async function runEntityAction(input: EntityActionInput): Promise<void> {
  const { entity, id, action, note, target } = input;
  if (entity === "driver") {
    await runDriverAction(action, id, note);
  } else if (entity === "verification" || entity === "vehicle") {
    // Both route through the confirmed verification decision endpoints; any
    // action without a decision value (request-correction, request-
    // resubmission) throws instead of inventing one. These actions are also
    // disabled in the drawers, so the throw is defensive only.
    await runVerificationAction(action, entity, target);
  } else {
    // No confirmed mutation endpoint for this entity/action: nothing to send
    // and nothing to record.
    return;
  }
}

