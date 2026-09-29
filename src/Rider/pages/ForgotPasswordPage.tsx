import { useState } from "react";
import { ChevronLeft, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isValid = EMAIL_RE.test(email.trim());

  // No API for now: simulate sending the code and move on.
  const handleSubmit = () => {
    if (!isValid || isSending) return;

    const identifier = email.trim();
    setError("");
    setIsSending(true);

    setTimeout(() => {
      setIsSending(false);
      navigate("/forgot-password/otp", {
        state: { identifier, sessionId: "local-session" },
      });
    }, 500);
  };

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-6 pb-8 pt-4">
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="flex items-center justify-center bg-white rounded-full shadow-md h-11 w-11"
      >
        <ChevronLeft size={22} />
      </button>

      <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
        Password Recovery
      </h1>
      <p className="mt-2 text-base leading-relaxed text-gray-400">
        Don't worry! It happens. Please enter the phone number associated
        with your account, and we'll send you a verification code to reset
        your password. 🔒
      </p>

      <div className="mt-8">
        <label className="flex h-14 items-center gap-3 rounded-2xl bg-[#f4f4f3] px-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ece4f5] text-[#6E43A3]">
            <Mail size={16} />
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
            className="w-full bg-transparent text-base text-gray-800 outline-none placeholder:text-gray-400"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || isSending}
        className="mt-8 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-50"
      >
        {isSending ? "Sending..." : "Send code"}
      </button>

      <p className="mt-6 text-center text-base text-[#8a8cab]">
        Remember password{" "}
        <Link
          to="/signin"
          className="font-semibold text-[#4a148c] underline"
        >
          Login Now
        </Link>
      </p>
    </div>
  );
}
