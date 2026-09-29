import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";

interface ProfileFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size"
  > {
  label?: string;
  icon: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  rightElement?: ReactNode;
  readOnlyDisplay?: boolean;
}

export default function ProfileField({
  label,
  icon,
  actionLabel,
  onAction,
  rightElement,
  readOnlyDisplay = false,
  className = "",
  ...inputProps
}: ProfileFieldProps) {
  return (
    <div className="w-full">
      {(label || actionLabel) && (
        <div className="mb-2 flex min-h-[20px] items-center justify-between gap-4">
          {label ? (
            <label
              htmlFor={inputProps.id}
              className="text-[14px] font-medium text-[#302B34]"
            >
              {label}
            </label>
          ) : (
            <span />
          )}

          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="shrink-0 text-[13px] font-semibold text-[#7442AD] transition-opacity hover:opacity-75"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}

      <div
        className={`
          flex min-h-[54px] w-full items-center gap-3
          rounded-[12px] bg-[#F4F3F5] px-4
          transition-all duration-200
          focus-within:ring-2 focus-within:ring-[#7442AD]/15
          ${className}
        `}
      >
        <span className="flex shrink-0 items-center justify-center text-[#7442AD]">
          {icon}
        </span>

        {readOnlyDisplay ? (
          <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#302B34]">
            {inputProps.value}
          </span>
        ) : (
          <input
            {...inputProps}
            className="
              min-w-0 flex-1 bg-transparent
              text-[15px] font-medium text-[#302B34]
              outline-none
              placeholder:text-[#AAA4AE]
              disabled:cursor-not-allowed
              disabled:text-[#918B95]
            "
          />
        )}

        {rightElement && (
          <span className="flex shrink-0 items-center justify-center text-[#99939D]">
            {rightElement}
          </span>
        )}
      </div>
    </div>
  );
}