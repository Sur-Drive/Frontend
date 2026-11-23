"use client";

import { useId, useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import type {
  DiscountType,
  Promotion,
  PromotionStatus,
} from "@/types/promotions";

interface Draft {
  name: string;
  code: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscount: string;
  usageLimit: string;
  startDate: string;
  endDate: string;
  note: string;
}

const EMPTY: Draft = {
  name: "",
  code: "",
  discountType: "Percentage",
  discountValue: "",
  maxDiscount: "",
  usageLimit: "",
  startDate: "",
  endDate: "",
  note: "",
};

// Stable colour/initials assignment so new cards match the existing look.
const TONES = ["brand", "warning", "info", "success"] as const;

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface CreatePromotionDrawerProps {
  open: boolean;
  existingCodes: string[];
  onClose: () => void;
  // Called with a valid draft when the user confirms via the dialog. The drawer
  // keeps its values so it can be reopened intact if the dialog is cancelled.
  onRequestCreate: (promotion: Promotion) => void;
  // Bumped by the parent after a successful create so the drawer resets its
  // draft for next time.
  resetKey: number;
}

export function CreatePromotionDrawer({
  open,
  existingCodes,
  onClose,
  onRequestCreate,
  resetKey,
}: CreatePromotionDrawerProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const ids = useId();

  // Parent bumps resetKey after a successful create; reset for the next time.
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setDraft(EMPTY);
    setTouched(false);
  }

  if (!open) return null;

  const nameId = `${ids}-name`;
  const codeId = `${ids}-code`;
  const typeId = `${ids}-type`;
  const valueId = `${ids}-value`;
  const maxId = `${ids}-max`;
  const limitId = `${ids}-limit`;
  const startId = `${ids}-start`;
  const endId = `${ids}-end`;
  const noteId = `${ids}-note`;

  const code = draft.code.trim().toUpperCase();
  const codeTaken = existingCodes.some(
    (existing) => existing.toUpperCase() === code,
  );
  const valueNum = Number(draft.discountValue);
  const maxNum = Number(draft.maxDiscount);
  const limitNum = Number(draft.usageLimit);
  const dateOrderOk =
    draft.startDate !== "" &&
    draft.endDate !== "" &&
    draft.endDate >= draft.startDate;

  const errors = {
    name: draft.name.trim() === "" ? "Enter a campaign name." : null,
    code:
      code === ""
        ? "Enter a promo code."
        : codeTaken
          ? "This promo code is already in use."
          : null,
    value:
      draft.discountValue.trim() === "" ||
      !Number.isFinite(valueNum) ||
      valueNum <= 0
        ? "Enter a value greater than 0."
        : null,
    maxDiscount:
      draft.discountType === "Percentage" &&
      (draft.maxDiscount.trim() === "" || !Number.isFinite(maxNum) || maxNum <= 0)
        ? "Enter a maximum discount."
        : null,
    usageLimit:
      draft.usageLimit.trim() === "" ||
      !Number.isFinite(limitNum) ||
      limitNum <= 0
        ? "Enter a usage limit greater than 0."
        : null,
    startDate: draft.startDate === "" ? "Select a start date." : null,
    endDate:
      draft.endDate === ""
        ? "Select an end date."
        : !dateOrderOk
          ? "End date must be on or after the start date."
          : null,
  };

  const valid = Object.values(errors).every((error) => error === null);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleCreate() {
    setTouched(true);
    if (!valid) return;

    // Start date today or earlier -> live now; otherwise scheduled.
    const status: PromotionStatus =
      draft.startDate <= todayIso() ? "Active" : "Scheduled";
    const index = existingCodes.length % TONES.length;

    // Hand off to the parent, which opens the confirm dialog. The draft is kept
    // intact so the drawer can reopen unchanged if the dialog is cancelled; the
    // parent bumps resetKey after a successful create to clear it.
    onRequestCreate({
      id: `promo-${code.toLowerCase()}`,
      code,
      name: draft.name.trim(),
      initials: initialsFromName(draft.name),
      tone: TONES[index],
      discountType: draft.discountType,
      discountValue: valueNum,
      maxDiscount:
        draft.discountType === "Percentage" && draft.maxDiscount.trim() !== ""
          ? maxNum
          : null,
      usageLimit: limitNum,
      usedCount: 0,
      startDate: draft.startDate,
      endDate: draft.endDate,
      status,
      lastUpdated: "just now",
    });
  }

  function handleClose() {
    setDraft(EMPTY);
    setTouched(false);
    onClose();
  }

  function show(key: keyof typeof errors): string | undefined {
    return touched ? (errors[key] ?? undefined) : undefined;
  }


  return (
    <SideSheet
      open
      onClose={handleClose}
      eyebrow="Growth"
      title="Create promotion"
      subtitle="Launch a new discount campaign"
      footer={
        <>
          <Button
            variant="secondary"
            className="h-11! flex-1 px-5! sm:flex-none"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="h-11! flex-1 px-5! sm:flex-none"
            onClick={handleCreate}
          >
            Create promotion
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <TextField
          id={nameId}
          label="Campaign name"
          value={draft.name}
          onChange={(event) => update("name", event.target.value)}
          error={show("name")}
        />
        <TextField
          id={codeId}
          label="Promo code"
          value={draft.code}
          onChange={(event) => update("code", event.target.value.toUpperCase())}
          error={show("code")}
          autoComplete="off"
        />

        <div className="min-w-0">
          <label htmlFor={typeId} className="text-sm font-medium text-ink">
            Discount type
          </label>
          <div className="mt-1.5">
            <Select
              id={typeId}
              label="Discount type"
              value={draft.discountType}
              onChange={(event) =>
                update("discountType", event.target.value as DiscountType)
              }
            >
              <option value="Percentage">Percentage</option>
              <option value="Fixed">Fixed</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id={valueId}
            label={
              draft.discountType === "Percentage"
                ? "Discount value (%)"
                : "Discount value (₦)"
            }
            type="number"
            inputMode="numeric"
            min={0}
            value={draft.discountValue}
            onChange={(event) => update("discountValue", event.target.value)}
            error={show("value")}
          />
          {draft.discountType === "Percentage" ? (
            <TextField
              id={maxId}
              label="Max discount (₦)"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.maxDiscount}
              onChange={(event) => update("maxDiscount", event.target.value)}
              error={show("maxDiscount")}
            />
          ) : null}
          <TextField
            id={limitId}
            label="Usage limit"
            type="number"
            inputMode="numeric"
            min={0}
            value={draft.usageLimit}
            onChange={(event) => update("usageLimit", event.target.value)}
            error={show("usageLimit")}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id={startId}
            label="Start date"
            type="date"
            value={draft.startDate}
            onChange={(event) => update("startDate", event.target.value)}
            error={show("startDate")}
          />
          <TextField
            id={endId}
            label="End date"
            type="date"
            value={draft.endDate}
            onChange={(event) => update("endDate", event.target.value)}
            error={show("endDate")}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={noteId} className="text-sm font-medium text-ink">
              Internal note
            </label>
            <span className="text-sm text-ink-subtle">Optional</span>
          </div>
          <textarea
            id={noteId}
            value={draft.note}
            onChange={(event) => update("note", event.target.value)}
            placeholder="Add context for this campaign..."
            className="mt-2 min-h-26 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm"
          />
        </div>

        <p className="text-xs text-ink-muted">
          New campaigns start as Scheduled unless the start date is today or
          earlier, in which case they go live as Active.
        </p>
      </div>
    </SideSheet>
  );
}

