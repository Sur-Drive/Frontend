'use client';

import { useState, type FormEvent } from 'react';
import { XIcon } from '@/components/ui/icons/XIcon';
import { ArrowRightIcon } from '@/components/ui/icons/ArrowRightIcon';
import { CheckIcon } from '@/components/ui/icons/CheckIcon';
import { useModalBehavior } from '@/lib/useModalBehavior';

type InviteDriverModalProps = {
  open: boolean;
  onClose: () => void;
};

const EMPTY_FORM = { fullName: '', mobile: '', license: '' };

export function InviteDriverModal({ open, onClose }: InviteDriverModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sent, setSent] = useState(false);

  const isValid = form.fullName.trim() !== '';

  const update = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    // TODO: replace with real API call to send the driver invitation
    setSent(true);
  };

  const resetFlow = () => {
    setForm(EMPTY_FORM);
    setSent(false);
  };

  const closeAndReset = () => {
    onClose();
    // Reset after close so reopening starts from the empty form
    setForm(EMPTY_FORM);
    setSent(false);
  };

  // Escape takes the same path as the backdrop: closeAndReset, not the parent's
  // onClose on its own, so the form and the success view are cleared too.
  // The hook must run on every render, so it sits above the early return.
  useModalBehavior({ open, onClose: closeAndReset });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={closeAndReset}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-driver-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {sent ? (
          <SuccessView onDone={closeAndReset} onInviteAnother={resetFlow} />
        ) : (
          <FormView
            form={form}
            isValid={isValid}
            onChange={update}
            onSubmit={handleSubmit}
            onClose={closeAndReset}
          />
        )}
      </div>
    </div>
  );
}

type FormViewProps = {
  form: typeof EMPTY_FORM;
  isValid: boolean;
  onChange: (field: keyof typeof EMPTY_FORM) => (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
};

function FormView({ form, isValid, onChange, onSubmit, onClose }: FormViewProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="invite-driver-title" className="text-lg font-semibold text-ink-primary">
            Invite driver
          </h2>
          <p className="mt-1 text-sm text-ink-tertiary">
            Send an invitation for a new driver to join your fleet.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-placeholder transition-colors hover:bg-surface-hover hover:text-ink-primary"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="driver-name" className="text-sm font-medium text-ink-primary">
            Full name
          </label>
          <input
            id="driver-name"
            type="text"
            value={form.fullName}
            onChange={(event) => onChange('fullName')(event.target.value)}
            placeholder="e.g. Adebayo Emmanuel"
            className="rounded-lg border border-line-pill bg-surface-card px-3.5 py-2.5 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-placeholder focus:border-brand-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="driver-mobile" className="text-sm font-medium text-ink-primary">
              Mobile number
            </label>
            <input
              id="driver-mobile"
              type="tel"
              value={form.mobile}
              onChange={(event) => onChange('mobile')(event.target.value)}
              placeholder="+234 800 000 0000"
              className="rounded-lg border border-line-pill bg-surface-card px-3.5 py-2.5 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-placeholder focus:border-brand-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="driver-license" className="text-sm font-medium text-ink-primary">
              License number
            </label>
            <input
              id="driver-license"
              type="text"
              value={form.license}
              onChange={(event) => onChange('license')(event.target.value)}
              placeholder="LAG-DR-000000"
              className="rounded-lg border border-line-pill bg-surface-card px-3.5 py-2.5 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-placeholder focus:border-brand-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line-pill bg-surface-card px-5 py-2.5 text-sm font-medium text-ink-primary transition-colors hover:border-line-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors ${
              isValid
                ? 'bg-brand-primary hover:bg-brand-primary-hover'
                : 'cursor-not-allowed bg-[#D6D9DE]'
            }`}
          >
            Send Invite
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </>
  );
}

function SuccessView({
  onDone,
  onInviteAnother,
}: {
  onDone: () => void;
  onInviteAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-2 py-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-status-success-bg">
        <CheckIcon className="h-8 w-8 text-status-success-text" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-ink-primary">
        Driver Invitation Sent Successfully
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-tertiary">
        An invitation has been sent to the driver&apos;s email address. They can use
        the invitation link to create their account and join your fleet.
      </p>
      <button
        type="button"
        onClick={onDone}
        className="mt-6 w-full rounded-lg bg-brand-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
      >
        Done
      </button>
      <button
        type="button"
        onClick={onInviteAnother}
        className="mt-4 text-sm font-medium text-brand-primary underline underline-offset-2 transition-colors hover:text-brand-primary-hover"
      >
        Invite Another Driver
      </button>
    </div>
  );
}