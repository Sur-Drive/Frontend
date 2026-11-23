"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/auth/OtpInput";
import { resendOtp, verifyOtp } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

interface OtpFormProps {
  maskedEmail: string;
}

const LENGTH = 6;
const RESEND_SECONDS = 60;

// Matches the design mock: the seconds field counts down from 60 while the
// minutes field stays 00 for this fixed 60-second window.
function formatCountdown(seconds: number): string {
  const clamped = Math.max(0, Math.min(RESEND_SECONDS, seconds));
  return `00:${String(clamped).padStart(2, "0")}`;
}

export function OtpForm({ maskedEmail }: OtpFormProps) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: LENGTH }, () => ""),
  );
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const toast = useToast();
  const router = useRouter();
  // Countdown is derived from a deadline timestamp, not a decrementing counter.
  // The deadline lives in a ref so nothing time-dependent is read during the
  // first render (that value would be baked into the prerendered HTML).
  // `restartToken` restarts it after a successful resend.
  const deadlineRef = useRef<number | null>(null);
  const [remaining, setRemaining] = useState(RESEND_SECONDS);
  const [restartToken, setRestartToken] = useState(0);

  useEffect(() => {
    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + RESEND_SECONDS * 1000;
    }
    const id = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((deadlineRef.current! - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [restartToken]);

  const complete = digits.every((d) => d !== "");

  function handleDigitsChange(next: string[]) {
    setDigits(next);
    if (invalid) setInvalid(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!complete) return;
    setLoading(true);
    try {
      const result = await verifyOtp({ code: digits.join("") });
      const firstName = result.user.name?.split(" ")[0] || "there";
      toast.success({
        title: `Welcome back, ${firstName}`,
        description: "Your email has been verified.",
      });
      router.push("/admin");
    } catch (error) {
      setInvalid(true);
      toast.error({
        title: "Verification failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendOtp();
      // Restart the countdown only once the resend succeeds.
      deadlineRef.current = Date.now() + RESEND_SECONDS * 1000;
      setRestartToken((n) => n + 1);
      toast.success({
        title: "Code resent",
        description: `A new code was sent to ${maskedEmail}.`,
      });
    } catch (error) {
      toast.error({
        title: "Couldn't resend code",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex w-full flex-col">
      <Link
        href="/login"
        className="mb-6 inline-flex w-fit items-center gap-1.5 rounded text-sm font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Link>

      <div className="mb-6 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-soft self-start">
        <ShieldCheck className="size-6 text-brand" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-normal tracking-tight text-ink">
        Verify Your Email
      </h1>
      <p id="otp-subtext" className="mt-2 text-sm text-ink-muted">
        Enter the 6-digit verification code sent to {maskedEmail}.
      </p>

      <form
        className="mt-8 flex flex-col gap-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Two-factor authentication is enabled for this administrator
              account.
            </span>
          </div>
          <OtpInput
            value={digits}
            onChange={handleDigitsChange}
            invalid={invalid}
            labelledBy="otp-subtext"
          />
        </div>

        <Button type="submit" fullWidth loading={loading} disabled={!complete}>
          Verify Code
          <ArrowRight className="size-4" />
        </Button>

        <p className="text-center text-sm text-ink-muted">
          Didn&apos;t receive the code?{" "}
          {remaining > 0 ? (
            <span className="font-semibold tabular-nums text-ink">
              Resend in {formatCountdown(remaining)}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="rounded font-semibold text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-70"
            >
              {resending ? "Resending…" : "Resend code"}
            </button>
          )}
        </p>

        <p className="text-center text-sm">
          <Link
            href="/login"
            className="rounded font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
