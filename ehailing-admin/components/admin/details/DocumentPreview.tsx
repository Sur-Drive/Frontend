"use client";

import { useState } from "react";
import { Download, Minus, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TONE_STYLES } from "@/types/overview";
import type { AvatarTone } from "@/types/entity-details";

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

const ZOOM_BUTTON =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50";

interface DocumentPreviewProps {
  title: string;
  issuer: string;
  docTitle: string;
  name: string;
  initials: string;
  tone: AvatarTone;
  refNumber: string;
  expiry: string | null;
}

// Placeholder document: real files don't exist, so the "paper" renders the
// key facts on the paper token background. Zoom is local to the preview.
export function DocumentPreview({
  title,
  issuer,
  docTitle,
  name,
  initials,
  tone,
  refNumber,
  expiry,
}: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const toneStyle = TONE_STYLES[tone];

  // No real file exists behind the preview, so the download is generated in the
  // browser as a plain-text summary of the document facts.
  function handleDownload() {
    const lines = [
      docTitle,
      issuer,
      "",
      `Holder: ${name}`,
      `Reference No.: ${refNumber}`,
      `Document ID: ${initials}`,
      expiry !== null ? `Expires: ${expiry}` : "Expires: Not applicable",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${refNumber}-${docTitle.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
            className={ZOOM_BUTTON}
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="w-12 text-center text-xs text-ink-muted">
            {zoom}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
            className={ZOOM_BUTTON}
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
          <Button
            variant="secondary"
            aria-label="Download document"
            onClick={handleDownload}
          >
            <Download className="size-4" aria-hidden="true" />
            Download
          </Button>
        </div>
      </div>

      <div className="mt-3 overflow-auto rounded-lg">
        <div
          style={{ width: `${zoom}%` }}
          className="rounded-md border border-border bg-paper p-8 text-paper-ink shadow-sm"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <ShieldCheck className="size-10 text-paper-ink" aria-hidden="true" />
            <p className="text-xs uppercase tracking-[0.2em] text-paper-ink">
              {issuer}
            </p>
            <p className="font-serif text-2xl uppercase text-paper-ink sm:text-3xl">
              {docTitle}
            </p>
            <div className="h-px w-full max-w-md bg-paper-ink/30" />
            <div className="flex items-center gap-4 text-left">
              <span
                className={`flex size-24 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white ${toneStyle.solid}`}
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase text-paper-ink">
                  {name}
                </p>
                <p className="mt-1 text-xs text-paper-ink">
                  Ref No. {refNumber}
                </p>
                {expiry !== null ? (
                  <p className="mt-1 text-xs text-paper-ink">
                    Expires: {expiry}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
