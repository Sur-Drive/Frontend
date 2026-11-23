"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { requestPasswordReset } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  function validate(): string | undefined {
    if (!email.trim()) return "Email is required.";
    if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
    return undefined;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setError(next);
    if (next) return;

    setLoading(true);
    try {
      await requestPasswordReset({ email: email.trim() });
      toast.success({
        title: "Reset code sent",
        description: `If ${email.trim()} is registered, a reset code is on its way.`,
      });
      router.push("/verify-otp");
    } catch (err) {
      toast.error({
        title: "Couldn't send reset code",
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
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
        Forgot Password?
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Enter your registered admin email address and we&apos;ll send you a
        password reset code.
      </p>

      <form
        className="mt-8 flex flex-col gap-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <TextField
          id="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="Enter your admin email"
          value={email}
          error={error}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(undefined);
          }}
          icon={<Mail className="size-4" />}
        />

        <Button type="submit" fullWidth loading={loading}>
          Send Reset Code
          <ArrowRight className="size-4" />
        </Button>

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
