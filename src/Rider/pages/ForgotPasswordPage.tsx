import { useState } from "react";
import { ChevronLeft, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForgotRideDriverPassword } from "../hooks/useAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const { mutate: sendCode, isPending: isSending } =
    useForgotRideDriverPassword();

  const isValid = EMAIL_RE.test(email.trim());

  const handleSubmit = () => {
    if (!isValid || isSending) return;

    const identifier = email.trim();
    setError("");

    sendCode(
      { email: identifier },
      {
        onSuccess: () => {
          navigate("/forgot-password/otp", { state: { identifier } });
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't send the code. Please try again.",
          );
        },
      },
    );
  };

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-[clamp(16px,5vw,22px)] pb-[clamp(14px,3.6dvh,24px)] pt-[clamp(10px,2.4dvh,14px)]">
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="flex items-center justify-center bg-white rounded-full shadow-md h-9 w-9"
      >
        <ChevronLeft size={18} />
      </button>

      <h1 className="mt-[clamp(12px,3dvh,20px)] text-[clamp(16px,3.2dvh,19px)] font-bold leading-tight text-[#2b2b2b]">
        Password Recovery
      </h1>
      <p className="mt-[clamp(2px,0.6dvh,5px)] text-[clamp(10px,1.9dvh,11.5px)] leading-relaxed text-gray-400">
        Don't worry! It happens. Please enter the email address associated with
        your account, and we'll send you a verification code to reset your
        password. 🔒
      </p>

      <div className="mt-[clamp(12px,3dvh,20px)]">
        <label className="flex h-[clamp(38px,8dvh,46px)] items-center gap-2.5 rounded-xl bg-[#f4f4f3] px-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ece4f5] text-[#6E43A3]">
            <Mail size={14} />
          </span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-transparent text-[clamp(11px,2.1dvh,12.5px)] text-gray-800 outline-none placeholder:text-gray-400"
          />
        </label>

        {error && (
          <p className="mt-2 text-[clamp(10px,1.9dvh,11.5px)] text-red-500">
            {error}
          </p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || isSending}
        className="mt-[clamp(12px,3dvh,20px)] h-[clamp(40px,8.2dvh,46px)] w-full rounded-xl bg-[#6E43A3] text-[clamp(12px,2.4dvh,14.5px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-50"
      >
        {isSending ? "Sending..." : "Send code"}
      </button>

      <p className="mt-[clamp(12px,3dvh,20px)] text-center text-[clamp(11px,2.1dvh,12.5px)] text-[#8a8cab]">
        Remember password{" "}
        <Link to="/signin" className="font-semibold text-[#4a148c] underline">
          Login Now
        </Link>
      </p>
    </div>
  );
}
