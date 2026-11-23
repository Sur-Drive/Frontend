"use client";

import { Car } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusTone } from "@/components/ui/StatusPill";
import { EM_DASH } from "@/lib/format";
import { effectiveLabel, nairaOrDash, percentOrDash } from "@/lib/pricing";
import type { PricingCategoryView } from "@/types/pricing-api";

interface FeeCellProps {
  label: string;
  value: string;
}

function FeeCell({ label, value }: FeeCellProps) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

interface RideCategoryCardProps {
  category: PricingCategoryView;
  onEdit: (category: PricingCategoryView) => void;
}

// Tint cycles brand → accent → info by position (the backend carries no tint).
const TINT_TILE = ["bg-brand-soft text-brand", "bg-accent-soft text-accent", "bg-info-soft text-info"];

export function RideCategoryCard({ category, onEdit }: RideCategoryCardProps) {
  const tint = TINT_TILE[Math.abs(hashCode(category.rideType)) % TINT_TILE.length];
  const statusTone: StatusTone = category.active ? "success" : "neutral";
  const statusLabel = category.active ? "Active" : "Inactive";

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tint}`}
          >
            <Car className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-normal text-ink">
              {category.label || EM_DASH}
            </h3>
            <p className="line-clamp-2 text-sm text-ink-muted">
              {category.scope ? `${category.scope} rule` : EM_DASH}
              {category.version ? ` · ${category.version}` : ""}
              {` · effective ${effectiveLabel(category.effectiveFrom)}`}
            </p>
          </div>
        </div>
        <StatusPill tone={statusTone} label={statusLabel} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
        <FeeCell label="Base fare" value={nairaOrDash(category.baseFare)} />
        <FeeCell label="Per kilometre" value={nairaOrDash(category.perKm)} />
        <FeeCell label="Per minute" value={nairaOrDash(category.perMinute)} />
        <FeeCell label="Booking fee" value={nairaOrDash(category.bookingFee)} />
        <div className="col-span-2">
          <FeeCell label="Minimum fare" value={nairaOrDash(category.minimumFare)} />
        </div>
        <FeeCell
          label="Cancellation fee"
          value={nairaOrDash(category.cancellationFee)}
        />
        <FeeCell
          label="Commission"
          value={percentOrDash(category.commissionPercent)}
        />
      </dl>

      <Button
        variant="secondary"
        className="mt-5 h-11! w-full px-5!"
        onClick={() => onEdit(category)}
      >
        Edit category
      </Button>
    </section>
  );
}

// Small stable string hash so the tile tint stays consistent per ride type.
function hashCode(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

