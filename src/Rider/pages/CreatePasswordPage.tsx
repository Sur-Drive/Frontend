import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, X } from "lucide-react";
import OnboardingProgress from "../components/OnboardingProgress";
import { useSetRideDriverPassword } from "../hooks/useOnboarding";

interface OnboardingState {
  identifier?: string;
  role?: string;
  phone?: string;
  city?: string;
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

export default function CreatePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as OnboardingState) || {};

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const { mutateAsync: setPassword_, isPending: isSubmitting } =
    useSetRideDriverPassword();

  const metCount = useMemo(
    () => CRITERIA.filter((c) => c.test(password)).length,
    [password],
  );

  const strength = metCount <= 2 ? "weak" : metCount <= 4 ? "medium" : "strong";

  const strengthMeta = {
    weak: { color: "bg-red-500", label: "Weak" },
    medium: { color: "bg-amber-400", label: "Medium" },
    strong: { color: "bg-emerald-500", label: "Strong" },
  } as const;

  const confirmTouched = confirm.length > 0;
  const mismatch = confirmTouched && confirm !== password;

  const canSubmit =
    metCount === CRITERIA.length && confirm.length > 0 && !mismatch;

  const displayName = (() => {
    const local = state.identifier?.split("@")[0] ?? "";
    if (!local) return "";
    return local.charAt(0).toUpperCase() + local.slice(1);
  })();

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;
    setError("");
    try {
      const res = await setPassword_({
        password,
        confirmPassword: confirm,
      });
      if (res.tempToken) {
        localStorage.setItem("driverOnboardingToken", res.tempToken);
      }
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password.");
    }
  };

  // Smaller scale than before: text tops out at ~12.5px, titles at ~19px.
  const inputClass =
    "h-[clamp(36px,7.6dvh,42px)] w-full rounded-xl bg-[#f4f4f3] px-[clamp(10px,2.2dvh,12px)] pr-10 text-[clamp(11px,2.1dvh,12.5px)] text-gray-800 outline-none placeholder:text-gray-400";
  const labelClass =
    "text-[clamp(10px,1.9dvh,11.5px)] font-medium text-gray-800";
  const eyeBtnClass = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400";
  const primaryBtn =
    "h-[clamp(40px,8.2dvh,46px)] w-full rounded-xl bg-[#6E43A3] text-[clamp(12px,2.4dvh,14.5px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-50";

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-[clamp(16px,5vw,22px)] pb-[clamp(14px,3.6dvh,24px)] pt-[clamp(10px,2.4dvh,14px)]">
      <OnboardingProgress progress={100} />

      <h1 className="mt-[clamp(10px,2.6dvh,16px)] text-[clamp(16px,3.2dvh,19px)] font-bold leading-tight text-[#2b2b2b]">
        Create your password
      </h1>
      <p className="mt-[clamp(2px,0.5dvh,4px)] text-[clamp(10px,1.9dvh,11.5px)] leading-snug text-gray-400">
        Create a strong password to protect your account and keep your
        information safe.
      </p>

      <div className="mt-[clamp(8px,2.2dvh,14px)] space-y-[clamp(8px,2.2dvh,14px)]">
        {/* Password */}
        <div>
          <label className={labelClass}>
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-[clamp(3px,0.9dvh,5px)]">
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
              className={eyeBtnClass}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {password.length > 0 && (
            <div className="mt-[clamp(5px,1.4dvh,9px)]">
              <div className="w-full h-1 overflow-hidden bg-gray-200 rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strengthMeta[strength].color}`}
                  style={{ width: `${(metCount / CRITERIA.length) * 100}%` }}
                />
              </div>

              <p className="mt-[clamp(4px,1.2dvh,8px)] text-[clamp(10px,1.9dvh,11.5px)] text-gray-800">
                {strengthMeta[strength].label} password. Must contain:
              </p>
              <ul className="mt-1 space-y-0.5">
                {CRITERIA.map((c) => {
                  const met = c.test(password);
                  return (
                    <li
                      key={c.label}
                      className={`flex items-center gap-1.5 text-[clamp(9.5px,1.8dvh,11px)] ${
                        met ? "text-emerald-600" : "text-gray-400"
                      }`}
                    >
                      {met ? <Check size={12} /> : <X size={12} />}
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
          <div className="relative mt-[clamp(3px,0.9dvh,5px)]">
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
              className={eyeBtnClass}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {mismatch && (
            <p className="mt-1 text-[clamp(9.5px,1.8dvh,11px)] text-red-500">
              Password doesn't match
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-[clamp(8px,2dvh,12px)] text-center text-[clamp(10px,1.9dvh,11.5px)] text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!canSubmit || isSubmitting}
        className={`mt-[clamp(10px,2.6dvh,16px)] ${primaryBtn}`}
      >
        {isSubmitting ? "Please wait..." : "Create Password"}
      </button>

      {/* Success modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-[280px] rounded-3xl bg-white px-5 py-5 text-center shadow-2xl">
            <div className="flex items-center justify-center mx-auto rounded-full h-14 w-14 bg-emerald-50">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500">
                <Check size={20} className="text-white" strokeWidth={3} />
              </div>
            </div>

            <h2 className="mt-3 text-[clamp(14px,2.7dvh,16.5px)] font-bold text-[#2b2b2b]">
              You're all set{displayName ? `, ${displayName}` : ""}
            </h2>
            <p className="mt-1 text-[clamp(10px,1.9dvh,11.5px)] leading-relaxed text-gray-500">
              Your details have been submitted successfully. Your profile has
              been created and your application is now under review.
            </p>

            <button
              onClick={() => navigate("/register/review", { state })}
              className={`mt-4 ${primaryBtn}`}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
