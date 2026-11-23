import type { Metadata } from "next";
import { OtpForm } from "@/components/auth/OtpForm";

export const metadata: Metadata = {
  title: "Verify your email | SUR-DRIVEHT Admin",
};

// Placeholder masked address; to be replaced by the real value from the auth flow.
const MASKED_EMAIL = "em••••@surdriveht.ng";

export default function VerifyOtpPage() {
  return <OtpForm maskedEmail={MASKED_EMAIL} />;
}
