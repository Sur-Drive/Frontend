interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      // extra padding makes the touch area bigger without changing the look
      className="relative inline-flex shrink-0 items-center p-2 -m-2 rounded-full
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6E43A3]/40
                 disabled:cursor-not-allowed"
    >
      <span
        className={`relative block h-8 w-14 rounded-full border transition-colors duration-200 ${
          checked
            ? "bg-[#6E43A3] border-[#6E43A3]"
            : "bg-[#C9CCE3] border-[#B3B7D4]"
        } ${disabled ? "opacity-40" : ""}`}
      >
        <span
          className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md
                      transition-transform duration-200 ease-out ${
                        checked ? "translate-x-6" : "translate-x-0"
                      }`}
        />
      </span>
    </button>
  );
}
