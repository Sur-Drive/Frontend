import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

// Canonical sign-in URL (proxy redirects here on 401/expired sessions).
// Renders the exact same form as /login — no separate design.
export const metadata: Metadata = {
  title: "Sign in | SUR-DRIVEHT Admin",
};

export default function SignInPage() {
  return <LoginForm />;
}