import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, X } from "lucide-react";
import OnboardingProgress from "../components/OnboardingProgress";

interface ResetPasswordLocationState {
  identifier?: string;
  sessionId?: string;
}

interface Criterion {
  label: string;
  test: (p: string) => boolean;
}

const CRITERIA: Criterion[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "At least a number", test: (p) => /\d/.test(p) },
  { label: "At least one lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "At least one uppercase letter", test: (p) => /[A-Z]/.test(p) },
  {
    label: "At least one symbol",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as ResetPasswordLocationState) || {};

  const identifier = state.identifier ?? "";
  const sessionId = state.sessionId ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // No session to reset with (e.g. page opened directly) — send back.
  useEffect(() => {
    if (!identifier || !sessionId) {
      navigate("/forgot-password", { replace: true });
    }
  }, [identifier, sessionId, navigate]);

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
    metCount === CRITERIA.length &&
    confirm.length > 0 &&
    !mismatch &&
    !isSubmitting;

  // No API for now: simulate the reset and show the success modal.
  const submit = () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 500);
  };

  const inputClass =
    "h-14 w-full rounded-2xl bg-[#f4f4f3] px-4 pr-12 text-base text-gray-800 outline-none placeholder:text-gray-400";
  const labelClass = "text-sm font-medium text-gray-800";

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-6 pb-8 pt-4">
      <OnboardingProgress progress={100} />

      <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
        Create new password
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
                  style={{ width: `${(metCount / CRITERIA.length) * 100}%` }}
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
            <p className="mt-2 text-sm text-red-500">Password doesn't match</p>
          )}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="mt-8 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? "Setting Password..." : "Create Password"}
      </button>

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
              Password Set Successfully
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Your password has been set successfully. You can now use your
              new password to log in to your account.
            </p>

            <button
              onClick={() => navigate("/signin", { replace: true })}
              className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
            >
              Login now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
