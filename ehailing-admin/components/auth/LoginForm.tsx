"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { login } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

interface FormErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The Button also disables while loading; this guards Enter-key double
    // submits before the state update lands.
    if (loading) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const user = await login(email.trim(), password);
      // Provider lives in the root layout, so this survives the redirect.
      const firstName = user.name?.split(" ")[0] || "there";
      toast.success({
        title: `Welcome back, ${firstName}`,
        description: "You're now signed in to the admin portal.",
      });
      router.push("/admin");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col">
      <div className="mb-6 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-soft self-start">
        <ShieldCheck className="size-6 text-brand" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Welcome Back
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Sign in to access your SUR-DRIVEHT admin dashboard.
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
          error={errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email)
              setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          icon={<Mail className="size-4" />}
        />

        <TextField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          error={errors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password)
              setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          icon={<Lock className="size-4" />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="flex size-11 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          }
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-border accent-brand"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="rounded text-sm font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Forgot Password?
          </Link>
        </div>

        {submitError ? (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" fullWidth loading={loading}>
          Sign In
          <ArrowRight className="size-4" />
        </Button>

        <div className="my-1 h-px w-full bg-border" aria-hidden="true" />

        <p className="text-center text-sm text-ink-muted">
          Having trouble signing in?{" "}
          <a
            href="#"
            className="rounded font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Contact Platform Support
          </a>
        </p>

        <p className="text-center text-xs text-ink-subtle">
          Admin accounts are invitation-only and managed by an authorised Super
          Administrator.
        </p>
      </form>
    </div>
  );
}
