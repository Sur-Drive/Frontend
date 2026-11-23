"use client";

import { useState } from "react";
import { Check, Clock, Inbox, X } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { NotificationPreview } from "@/components/admin/notifications/NotificationPreview";
import { DocumentPreview } from "./DocumentPreview";
import { DocumentReviewPanel } from "./DocumentReviewPanel";
import { NotesField } from "./NotesField";
import { VehicleGallery } from "./VehicleGallery";
import { verificationStatusDisplay } from "@/types/verification";
import type { DetailItem } from "@/types/ride-details";
import type {
  DetailSection,
  DocumentDecisionRequest,
  DocumentReviewRow,
} from "@/types/entity-details";

const HEADING = "text-base font-normal text-ink";

function ProfileSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "profile" }>;
}) {
  return (
    <div className="rounded-2xl bg-liear-to-r from-brand-soft to-surface p-5">
      <div className="flex flex-wrap items-center gap-4">
        <InitialsAvatar
          initials={section.initials}
          tone={section.tone}
          size="xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-normal text-ink">{section.name}</p>
          <p className="mt-0.5 text-sm text-ink-muted">{section.subtitle}</p>
        </div>
        <StatusPill tone={section.pill.tone} label={section.pill.label} />
      </div>
    </div>
  );
}

function StatsSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "stats" }>;
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-border">
      {section.items.map((item, index) => (
        <div
          key={item.label}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 p-4 text-center ${
            index > 0 ? "border-l border-border" : ""
          }`}
        >
          <span className="text-xl font-semibold text-ink">{item.value}</span>
          <span className="text-xs text-ink-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ item }: { item: DetailItem }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <p className="text-xs text-ink-muted">{item.label}</p>
      <p className="mt-1 text-sm font-medium text-ink">
        {item.pill ? (
          <StatusPill tone={item.pill.tone} label={item.pill.label} />
        ) : (
          (item.value ?? "—")
        )}
      </p>
    </div>
  );
}

function InfoSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "info" }>;
}) {
  return (
    <section>
      <h3 className={HEADING}>{section.title}</h3>
      <div className="mt-3 border-t border-border pt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {section.items.map((item) => (
            <InfoCard key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "timeline" }>;
}) {
  const { steps } = section;
  return (
    <section>
      <h3 className={HEADING}>{section.title}</h3>
      <div className="mt-3 border-t border-border pt-3">
        <ol className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex items-start gap-3">
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[7.5px] top-5 -bottom-4 w-px bg-border"
                />
              ) : null}
              <span
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-success bg-surface"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{step.time}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ListSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "list" }>;
}) {
  if (section.rows.length === 0) {
    return (
      <section>
        {section.title ? <h3 className={HEADING}>{section.title}</h3> : null}
        <p className="py-6 text-center text-sm text-ink-muted">
          {section.emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <section>
      {section.title ? <h3 className={HEADING}>{section.title}</h3> : null}
      <ul
        className={
          section.title
            ? "mt-3 divide-y divide-border border-t border-border"
            : "divide-y divide-border"
        }
      >
        {section.rows.map((row) => (
          <li
            key={row.title}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{row.title}</p>
              {row.subtitle ? (
                <p className="mt-0.5 text-xs text-ink-muted">{row.subtitle}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {row.value ? (
                <span className="text-sm text-ink">{row.value}</span>
              ) : null}
              {row.pill ? (
                <StatusPill tone={row.pill.tone} label={row.pill.label} />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DocumentListSection({
  section,
  onDocumentDecision,
}: {
  section: Extract<DetailSection, { kind: "documentList" }>;
  onDocumentDecision?: (input: DocumentDecisionRequest) => Promise<void>;
}) {
  const [selected, setSelected] = useState<DocumentReviewRow | null>(null);

  if (section.rows.length === 0) {
    return (
      <section>
        {section.title ? <h3 className={HEADING}>{section.title}</h3> : null}
        <p className="py-6 text-center text-sm text-ink-muted">
          {section.emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <section>
      {section.title ? <h3 className={HEADING}>{section.title}</h3> : null}
      <ul
        className={
          section.title
            ? "mt-3 divide-y divide-border border-t border-border"
            : "divide-y divide-border"
        }
      >
        {section.rows.map((row) => {
          const pill = verificationStatusDisplay(row.status);
          return (
            <li key={row.key}>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setSelected(row)}
                className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">
                    {row.document}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {row.key} • {row.issuer}
                  </span>
                </span>
                <StatusPill tone={pill.tone} label={pill.label} />
              </button>
            </li>
          );
        })}
      </ul>
      {selected ? (
        <DocumentReviewPanel
          key={selected.key}
          row={selected}
          onClose={() => setSelected(null)}
          onDecide={
            onDocumentDecision
              ? (action, note) =>
                  onDocumentDecision({ row: selected, action, note })
              : undefined
          }
        />
      ) : null}
    </section>
  );
}

function EmptySection({
  section,
}: {
  section: Extract<DetailSection, { kind: "empty" }>;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Inbox className="size-8 text-ink-subtle" aria-hidden="true" />
      <p className="text-sm font-medium text-ink-muted">{section.title}</p>
      <p className="text-sm text-ink-subtle">{section.message}</p>
    </div>
  );
}

const REFERENCE_TONE: Record<
  "success" | "warning" | "danger",
  { banner: string; text: string; icon: typeof Check }
> = {
  success: { banner: "bg-success-soft", text: "text-success", icon: Check },
  warning: { banner: "bg-warning-soft", text: "text-warning", icon: Clock },
  danger: { banner: "bg-danger-soft", text: "text-danger", icon: X },
};

function ReferenceSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "reference" }>;
}) {
  const tone = REFERENCE_TONE[section.tone];
  const Icon = tone.icon;
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-2xl p-5 ${tone.banner}`}
    >
      <Icon className={`size-5 shrink-0 ${tone.text}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={`text-xs ${tone.text}`}>{section.label}</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">
          {section.value ?? "—"}
        </p>
      </div>
      <StatusPill tone={section.pill.tone} label={section.pill.label} />
    </div>
  );
}

function BreakdownSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "breakdown" }>;
}) {
  return (
    <section>
      <h3 className={HEADING}>{section.title}</h3>
      <div className="mt-3 border-t border-border pt-1">
        {section.rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 py-2.5"
          >
            <p className="text-sm text-ink-muted">{row.label}</p>
            <p className="text-right text-sm font-semibold text-ink">
              {row.value}
            </p>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 border-t border-border py-2.5">
          <p className="text-sm text-ink">{section.total.label}</p>
          <p className="text-right text-sm font-semibold text-ink">
            {section.total.value}
          </p>
        </div>
      </div>
    </section>
  );
}

function PayoutSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "payout" }>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-auth-panel bg-linear-to-br from-auth-panel to-brand p-6 text-white">
      <p className="text-xs uppercase tracking-[0.14em] text-white/60">
        {section.caption}
      </p>
      <p className="mt-2 text-xl text-white">{section.bank}</p>
      <p className="mt-2 text-3xl font-semibold tracking-widest tabular-nums text-white">
        {section.accountNumber}
      </p>
      <p className="mt-2 text-xs text-white/60">{section.holder}</p>
    </div>
  );
}

function PreviewSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "preview" }>;
}) {
  return (
    <section>
      <h3 className={HEADING}>{section.title}</h3>
      <div className="mt-3 border-t border-border pt-3">
        <NotificationPreview
          channel={section.channel}
          title={section.subject}
          message={section.message}
        />
      </div>
    </section>
  );
}

function Section({
  section,
  onDocumentDecision,
}: {
  section: DetailSection;
  onDocumentDecision?: (input: DocumentDecisionRequest) => Promise<void>;
}) {
  switch (section.kind) {
    case "profile":
      return <ProfileSection section={section} />;
    case "stats":
      return <StatsSection section={section} />;
    case "info":
      return <InfoSection section={section} />;
    case "preview":
      return <PreviewSection section={section} />;
    case "timeline":
      return <TimelineSection section={section} />;
    case "list":
      return <ListSection section={section} />;
    case "documentList":
      return (
        <DocumentListSection
          section={section}
          onDocumentDecision={onDocumentDecision}
        />
      );
    case "gallery":
      return <VehicleGallery views={section.views} />;
    case "document":
      return <DocumentPreview {...section} />;
    case "notes":
      return <NotesField title={section.title} placeholder={section.placeholder} />;
    case "reference":
      return <ReferenceSection section={section} />;
    case "breakdown":
      return <BreakdownSection section={section} />;
    case "payout":
      return <PayoutSection section={section} />;
    case "empty":
      return <EmptySection section={section} />;
  }
}

// Renders the section kinds of an entity details tab, stacked with space-y-6.
export function DetailSections({
  sections,
  onDocumentDecision,
}: {
  sections: DetailSection[];
  // Passed down to document lists so their review panels can submit the
  // confirmed decision; omitted drawers keep their documents read-only.
  onDocumentDecision?: (input: DocumentDecisionRequest) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <Section
          key={index}
          section={section}
          onDocumentDecision={onDocumentDecision}
        />
      ))}
    </div>
  );
}
