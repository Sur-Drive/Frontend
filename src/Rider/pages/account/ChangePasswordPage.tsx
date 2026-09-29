import { useMemo, useState, useEffect } from "react";
import { Check, ChevronLeft, Delete, Eye, EyeOff, X } from "lucide-react";

const OTP_LENGTH = 5;
const COUNTDOWN_SECONDS = 45;

interface Criterion {
  label: string;
  test: (p: string) => boolean;
}

const CRITERIA: Criterion[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "At least a number", test: (p) => /\d/.test(p) },
  { label: "At least one lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "At least one uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "At least one symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

type Step = "form" | "otp";

export default function ChangePasswordPage({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<Step>("form");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [code, setCode] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showVerifiedToast, setShowVerifiedToast] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const metCount = useMemo(
    () => CRITERIA.filter((c) => c.test(password)).length,
    [password],
  );

  const strength =
    metCount <= 2 ? "weak" : metCount <= 4 ? "medium" : "strong";

  const strengthMeta = {
    weak: { color: "bg-red-500", label: "Weak" },
    medium: { color: "bg-amber-400", label: "Medium" },
    strong: { color: "bg-emerald-500", label: "Strong" },
  } as const;

  const confirmTouched = confirm.length > 0;
  const mismatch = confirmTouched && confirm !== password;

  const canSubmit =
    metCount === CRITERIA.length && confirm.length > 0 && !mismatch;

  const submitPassword = () => {
    if (!canSubmit) return;
    // No API for now: move on to OTP confirmation.
    setStep("otp");
  };

  // OTP countdown
  useEffect(() => {
    if (step !== "otp") return;
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const activeIndex = code.findIndex((d) => d === "");
  const currentIndex = activeIndex === -1 ? OTP_LENGTH - 1 : activeIndex;

  // No API for now: any 5-digit code is treated as valid.
  const submitCode = (_fullCode: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowVerifiedToast(true);
      setTimeout(() => {
        setShowSuccess(true);
      }, 900);
    }, 500);
  };

  const handleDigit = (digit: string) => {
    if (isVerifying || showVerifiedToast) return;
    if (activeIndex === -1) return;
    const next = [...code];
    next[activeIndex] = digit;
    setCode(next);

    if (activeIndex === OTP_LENGTH - 1) {
      const fullCode = next.join("");
      if (fullCode.length === OTP_LENGTH) submitCode(fullCode);
    }
  };

  const handleBackspace = () => {
    if (isVerifying || showVerifiedToast) return;
    const lastFilled = [...code].reverse().findIndex((d) => d !== "");
    if (lastFilled === -1) return;
    const indexToClear = OTP_LENGTH - 1 - lastFilled;
    const next = [...code];
    next[indexToClear] = "";
    setCode(next);
  };

  // No API for now: just reset the timer and clear the boxes.
  const handleResend = () => {
    if (!canResend) return;
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
      setTimer(COUNTDOWN_SECONDS);
      setCanResend(false);
      setCode(new Array(OTP_LENGTH).fill(""));
    }, 400);
  };

  const keypadRows: Array<Array<string | null>> = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [null, "0", "backspace"],
  ];

  const inputClass =
    "h-14 w-full rounded-2xl bg-[#f4f4f3] px-4 pr-12 text-base text-gray-800 outline-none placeholder:text-gray-400";
  const labelClass = "text-sm font-medium text-gray-800";

  if (step === "otp") {
    return (
      <div className="font-outfit relative flex h-full min-h-0 w-full flex-col bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-4">
          <button
            onClick={() => setStep("form")}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
          >
            <ChevronLeft size={22} />
          </button>

          <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
            OTP Verification
          </h1>
          <p className="mt-2 text-base text-gray-400">
            Enter the OTP sent to your email to confirm your password change.
          </p>

          {/* OTP boxes */}
          <div className="mt-8 flex items-center gap-4">
            {code.map((digit, i) => (
              <div
                key={i}
                className={`flex h-[68px] w-[68px] items-center justify-center rounded-2xl text-2xl font-bold text-gray-800 transition ${
                  digit
                    ? "bg-white shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
                    : i === currentIndex
                      ? "bg-white shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
                      : "bg-[#f5f5f4]"
                }`}
              >
                {digit}
              </div>
            ))}
          </div>

          <button
            onClick={handleResend}
            disabled={!canResend || isResending}
            className={`mt-8 h-14 w-full rounded-2xl text-lg font-semibold transition ${
              canResend && !isResending
                ? "bg-[#6E43A3] text-white shadow-lg shadow-[#6E43A3]/30 active:scale-[0.99]"
                : "cursor-not-allowed bg-[#dcdcdc] text-white/90"
            }`}
          >
            {canResend
              ? isResending
                ? "Sending..."
                : "Resend OTP"
              : `Resend OTP (${timer})`}
          </button>
        </div>

        {/* Custom numeric keypad */}
        <div className="mt-auto bg-[#dedee6] px-4 pb-6 pt-4">
          <div className="flex flex-col gap-3">
            {keypadRows.map((row, ri) => (
              <div key={ri} className="flex gap-3">
                {row.map((key, ki) => {
                  if (key === null) {
                    return <div key={ki} className="h-16 flex-1" />;
                  }
                  if (key === "backspace") {
                    return (
                      <button
                        key={ki}
                        type="button"
                        onClick={handleBackspace}
                        aria-label="Delete"
                        className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-white text-gray-800 shadow-sm active:scale-[0.97]"
                      >
                        <Delete size={22} />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={ki}
                      type="button"
                      onClick={() => handleDigit(key)}
                      className="h-16 flex-1 rounded-2xl bg-white text-xl font-semibold text-gray-800 shadow-sm active:scale-[0.97]"
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Verifying / verified toast overlay */}
        {(isVerifying || showVerifiedToast) && (
          <div className="absolute inset-0 z-10 flex items-end justify-center bg-white/30 pb-28 backdrop-blur-[1px] backdrop-grayscale">
            {isVerifying && !showVerifiedToast && (
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#6E43A3]" />
            )}

            {showVerifiedToast && (
              <div className="mx-6 flex w-full max-w-sm items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800">
                  OTP verified successfully
                </span>
                <X size={16} className="text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Success modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 text-center shadow-2xl">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500">
                  <Check size={28} className="text-white" strokeWidth={3} />
                </div>
              </div>

              <h2 className="mt-5 text-xl font-bold text-[#2b2b2b]">
                Password Changed Successfully
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Your password has been changed successfully. You can now log
                in using your new password.
              </p>

              <button
                onClick={onDone}
                className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
        >
          <ChevronLeft size={22} className="text-[#1F2937]" />
        </button>

        <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
          Change account password
        </h1>
        <p className="mt-2 text-base text-gray-400">
          Create a strong password to protect your account and keep your
          information safe.
        </p>

        <div className="mt-8 space-y-6">
          {/* Password */}
          <div>
            <label className={labelClass}>
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthMeta[strength].color}`}
                    style={{
                      width: `${(metCount / CRITERIA.length) * 100}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-sm text-gray-800">
                  {strengthMeta[strength].label} password. Must contain:
                </p>
                <ul className="mt-2 space-y-1.5">
                  {CRITERIA.map((c) => {
                    const met = c.test(password);
                    return (
                      <li
                        key={c.label}
                        className={`flex items-center gap-2 text-sm ${
                          met ? "text-emerald-600" : "text-gray-400"
                        }`}
                      >
                        {met ? <Check size={16} /> : <X size={16} />}
                        {c.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className={labelClass}>
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-2">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-type Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mismatch && (
              <p className="mt-2 text-sm text-red-500">
                Password doesn't match
              </p>
            )}
          </div>
        </div>

        <button
          onClick={submitPassword}
          disabled={!canSubmit}
          className="mt-8 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-50"
        >
          Create Password
        </button>
      </div>
    </div>
  );
}
