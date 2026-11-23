"use client";

import { useRef } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  invalid: boolean;
  labelledBy: string;
}

const LENGTH = 6;

export function OtpInput({
  value,
  onChange,
  invalid,
  labelledBy,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function focusBox(index: number) {
    const el = refs.current[index];
    el?.focus();
    el?.select();
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < LENGTH - 1) focusBox(index + 1);
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      if (!value[index] && index > 0) {
        event.preventDefault();
        const next = [...value];
        next[index - 1] = "";
        onChange(next);
        focusBox(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: LENGTH }, (_, i) => pasted[i] ?? "");
    onChange(next);
    focusBox(Math.min(pasted.length, LENGTH - 1));
  }

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="grid grid-cols-6 gap-2 sm:gap-3"
    >
      {Array.from({ length: LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(event) => handleChange(i, event.target.value)}
          onKeyDown={(event) => handleKeyDown(i, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${LENGTH}`}
          aria-invalid={invalid || undefined}
          className={
            "min-w-0 h-12 sm:h-14 lg:h-16 rounded-xl border bg-surface " +
            "text-center text-xl font-semibold transition-colors " +
            "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-bg " +
            (invalid ? "border-danger" : "border-border") +
            (value[i] ? " text-brand" : " text-ink")
          }
        />
      ))}
    </div>
  );
}
