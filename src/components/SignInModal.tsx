import { useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { useLogin } from "../hooks/useAuth";
import {
  setStoredRole,
  resolveRoleFromAuthResponse,
  type UserRole,
} from "../lib/userRole";

type InputMode = "phone" | "email";

interface SignInModalProps {
  onClose: () => void;
  onSignInSuccess?: (user: any) => void;
  /** fires with the raw Google credential response on a successful Google sign-in */
  onGoogleCredential?: (credentialResponse: any) => void;
  /** fires when the Google popup itself fails/is closed (distinct from a backend error) */
  onGoogleError?: () => void;
  /** true while the Google credential is being exchanged for our own tokens */
  isGoogleLoading?: boolean;
  /** shown under the Google button when a Google sign-in attempt fails */
  googleError?: string | null;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  countryCode?: string;
}

export default function SignInModal({
  onClose,
  onSignInSuccess,
  onGoogleCredential,
  onGoogleError,
  isGoogleLoading = false,
  googleError,
  onForgotPassword,
  onSignUp,
  countryCode = "+234",
}: SignInModalProps) {
  const [inputMode, setInputMode] = useState<InputMode>("phone");
  const [role, setRole] = useState<UserRole>("driver");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const login = useLogin();
  const dragControls = useDragControls();

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const digitsOnly = phone.replace(/\D/g, "");
  const isPhoneValid = digitsOnly.length >= 7;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isIdentifierValid = inputMode === "phone" ? isPhoneValid : isEmailValid;
  const isPasswordValid = password.length >= 1;
  const isFormValid = isIdentifierValid && isPasswordValid && !login.isPending;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 10) return;
    setPhone(raw);
    if (error) setError("");
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  const switchMode = (mode: InputMode) => {
    setInputMode(mode);
    setPhone("");
    setEmail("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setError("");

    let identifier: string;
    if (inputMode === "phone") {
      identifier = digitsOnly.startsWith("0")
        ? `+234${digitsOnly.slice(1)}`
        : `+234${digitsOnly}`;
    } else {
      identifier = email.trim().toLowerCase();
    }

    const payload = { identifier, password };

    console.log("Payload:", JSON.stringify(payload));

    try {
      const result = await login.mutateAsync(payload);
      setStoredRole(resolveRoleFromAuthResponse(result, role));
      onSignInSuccess?.(result.user);
      onClose();
    } catch (err: any) {
      console.log("Login error:", err.message);
      setError(err.message || "Incorrect phone or password");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-end justify-center sm:items-center z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-[430px] sm:max-w-[480px] lg:max-w-[520px]
                       max-h-[100dvh] overflow-y-auto scrollbar-thin
                       bg-white rounded-t-[32px] sm:rounded-[40px] sm:m-4
                       shadow-2xl"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 220,
            mass: 1.2,
          }}
          drag="y"
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.y > 150) onClose();
          }}
        >
          {/* Header */}
          <div className="relative px-5 pt-3 pb-2 sm:px-8 sm:pt-8">
            <div
              className="flex justify-center py-2 -mt-1 touch-none sm:hidden"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <motion.button
              onClick={onClose}
              aria-label="Close"
              className="absolute flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-100 rounded-full top-3 right-4 sm:top-6 sm:right-6 sm:w-9 sm:h-9"
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <CloseIcon />
            </motion.button>

            <motion.h1
              className="pr-10 text-lg font-extrabold text-gray-900 sm:text-2xl lg:text-3xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15,
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              Welcome Back 👋
            </motion.h1>

            <motion.p
              className="mt-1 text-xs text-gray-600 sm:text-base"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              Sign in to access real-time road alerts, safer routes, and your
              personalised driving experience.
            </motion.p>
          </div>

          {/* Content */}
          <div className="px-5 pt-4 sm:px-8">
            {/* Role Toggle */}
            <motion.div
              className="flex p-1 bg-gray-100 rounded-xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <button
                onClick={() => setRole("driver")}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                  role === "driver"
                    ? "bg-white text-[#6E43A3] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Driver
              </button>
              <button
                onClick={() => setRole("fleet_owner")}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                  role === "fleet_owner"
                    ? "bg-white text-[#6E43A3] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Fleet Driver
              </button>
            </motion.div>

            {/* Toggle: Phone / Email */}
            <motion.div
              className="flex p-1 mt-3 bg-gray-100 rounded-xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.3 }}
            >
              <button
                onClick={() => switchMode("phone")}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                  inputMode === "phone"
                    ? "bg-white text-[#6E43A3] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <PhoneIcon />
                  Phone Number
                </span>
              </button>
              <button
                onClick={() => switchMode("email")}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                  inputMode === "email"
                    ? "bg-white text-[#6E43A3] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <EmailIcon />
                  Email Address
                </span>
              </button>
            </motion.div>

            {/* Identifier Input */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.28,
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <AnimatePresence mode="wait">
                {inputMode === "phone" ? (
                  <motion.div
                    key="phone-input"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="text-xs font-semibold text-gray-900 sm:text-sm">
                      Phone Number
                    </label>
                    <div className="mt-1.5 flex items-stretch rounded-xl bg-gray-50 border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3]">
                      <div className="flex items-center px-3 text-xs text-gray-600 border-r border-gray-200 shrink-0 sm:text-sm sm:px-4">
                        {countryCode}
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={formatPhone(phone)}
                        onChange={handlePhoneChange}
                        placeholder="812-345-6789"
                        className="flex-1 min-w-0 px-3 py-3 text-base text-gray-900 bg-transparent outline-none sm:px-4 sm:py-4 placeholder:text-gray-400"
                      />
                      <div className="flex items-center pr-3 shrink-0 sm:pr-4">
                        <NigeriaFlagIcon />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="email-input"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="text-xs font-semibold text-gray-900 sm:text-sm">
                      Email Address
                    </label>
                    <div className="mt-1.5 flex items-stretch rounded-xl bg-gray-50 border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3]">
                      <div className="flex items-center pl-3 pr-2 text-gray-400 shrink-0 sm:pl-4 sm:pr-3">
                        <EmailIcon />
                      </div>
                      <input
                        type="email"
                        inputMode="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="you@example.com"
                        className="flex-1 min-w-0 px-0 py-3 text-base text-gray-900 bg-transparent outline-none sm:py-4 placeholder:text-gray-400"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password Input */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-900 sm:text-sm">
                  Enter Password
                </label>
                <button
                  onClick={onForgotPassword}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 sm:text-sm"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1.5 flex items-center rounded-xl bg-gray-50 border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3]">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter password"
                  className="flex-1 min-w-0 px-3 py-3 text-base text-gray-900 bg-transparent outline-none sm:px-4 sm:py-4 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-gray-400 hover:text-gray-600 shrink-0 sm:px-4"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>

              {error && (
                <p className="mt-2 text-xs text-red-500 sm:text-sm">{error}</p>
              )}
            </motion.div>

            <motion.button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`mt-4 h-12 sm:h-14 rounded-xl font-semibold text-white transition-colors w-full ${
                isFormValid
                  ? "bg-[#6E43A3]"
                  : "bg-purple-300 cursor-not-allowed"
              }`}
              whileTap={isFormValid ? { scale: 0.97 } : {}}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.32,
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {login.isPending ? "Signing in..." : "Sign in"}
            </motion.button>

            <motion.div
              className="flex items-center gap-3 mt-4 text-xs font-medium text-gray-400 sm:text-sm"
              initial={{ opacity: 0, scaleX: 0.85 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                delay: 0.36,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <div className="flex-1 h-px bg-gray-200" />
              <span>OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </motion.div>

            {/* ─── Google Button ───
                  Same trick as CreateAccountModal: an invisible, real
                  GoogleLogin iframe sits on top (z-10) and captures the
                  click, so we get a real popup instead of the fragile
                  One Tap prompt() flow. Your styled button stays visible
                  underneath (z-0).                                      */}
            <div className="relative mt-4">
              {!isGoogleLoading && onGoogleCredential && (
                <div className="absolute inset-0 z-10 opacity-0">
                  <GoogleLogin
                    onSuccess={onGoogleCredential}
                    onError={onGoogleError}
                    type="standard"
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
              )}

              <motion.button
                type="button"
                disabled={isGoogleLoading}
                className={`relative z-0 flex items-center justify-center w-full h-12 gap-3 font-medium text-gray-900 border border-gray-200 sm:h-14 rounded-xl bg-gray-50 ${
                  isGoogleLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                whileTap={!isGoogleLoading ? { scale: 0.97 } : {}}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.4,
                  duration: 0.35,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <GoogleIcon />
                <span className="text-sm sm:text-base">
                  {isGoogleLoading ? "Signing in…" : "Continue with Google"}
                </span>
              </motion.button>
            </div>

            <AnimatePresence>
              {googleError && (
                <motion.p
                  className="mt-2 text-xs font-medium text-center text-red-500"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {googleError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <motion.div
            className="px-5 pt-4 mt-4 text-center border-t border-gray-100 sm:px-8"
            style={{
              paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.35 }}
          >
            <p className="text-xs text-gray-700 sm:text-sm">
              Don't have an account?{" "}
              <button onClick={onSignUp} className="text-[#6E43A3] font-bold">
                Sign Up
              </button>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function NigeriaFlagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 overflow-hidden rounded-full sm:w-6 sm:h-6"
    >
      <rect x="0" y="0" width="8" height="24" fill="#3a8f3a" />
      <rect x="8" y="0" width="8" height="24" fill="white" />
      <rect x="16" y="0" width="8" height="24" fill="#3a8f3a" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.87c2.27-2.09 3.58-5.17 3.58-8.66z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3.01c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.14 7.14 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.27A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.27 5.39z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
