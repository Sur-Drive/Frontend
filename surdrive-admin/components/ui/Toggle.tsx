'use client';

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible label for the switch */
  label: string;
  disabled?: boolean;
};

/**
 * Reusable toggle switch. Violet when on, gray when off.
 * Client state only — persistence is up to the caller.
 */
export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-brand-primary' : 'bg-surface-toggleTrack'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}