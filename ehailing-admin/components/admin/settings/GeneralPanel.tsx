"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SettingRow } from "@/components/admin/settings/SettingRow";
import { GeneralTextRows } from "@/components/admin/settings/GeneralTextRows";
import type { SectionErrors } from "@/types/platform-settings";

export interface GeneralPatch {
  platformName?: string;
  supportEmail?: string;
  supportPhone?: string;
  currency?: string;
  timezone?: string;
}

const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

interface GeneralPanelProps {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  savedCurrency: string;
  logoName: string | null;
  logoPreview: string | null;
  logoError: string | null;
  errors: SectionErrors;
  onLogoSelected: (fileName: string, previewUrl: string) => void;
  onLogoError: (message: string) => void;
  onChange: (patch: GeneralPatch) => void;
}

export function GeneralPanel(props: GeneralPanelProps) {
  const { errors, onLogoSelected, onLogoError, onChange } = props;
  const [logoDraftName, setLogoDraftName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      onLogoError("Choose a PNG, JPG or SVG file.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      onLogoError("Logo must be 2 MB or smaller.");
      return;
    }
    onLogoSelected(file.name, URL.createObjectURL(file));
    setLogoDraftName(file.name);
  }

  return (
    <div className="divide-y divide-border">
      <SettingRow
        label="Platform logo"
        helper="Shown in admin, rider and driver experiences"
        controlId="settings-logo"
      >
        <div className="flex items-center gap-3">
          {props.logoPreview ? (
            <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-border">
              <Image
                src={props.logoPreview}
                alt="Staged platform logo preview"
                fill
                sizes="56px"
                className="object-cover"
                unoptimized
              />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white"
            >
              S
            </span>
          )}
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            className="h-11! px-5!"
          >
            Replace logo
          </Button>
          <input
            ref={fileRef}
            id="settings-logo"
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            className="sr-only"
            aria-label="Replace platform logo"
            onChange={handleFile}
          />
        </div>
        {logoDraftName ?? props.logoName ? (
          <p className="mt-1.5 text-xs text-ink-muted">
            Staged: {logoDraftName ?? props.logoName}
          </p>
        ) : null}
        {props.logoError ? (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {props.logoError}
          </p>
        ) : null}
      </SettingRow>
      <GeneralTextRows
        platformName={props.platformName}
        supportEmail={props.supportEmail}
        supportPhone={props.supportPhone}
        currency={props.currency}
        timezone={props.timezone}
        savedCurrency={props.savedCurrency}
        errors={errors}
        onChange={onChange}
      />
    </div>
  );
}
