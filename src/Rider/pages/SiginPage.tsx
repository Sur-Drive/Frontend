import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";

type Mode = "phone" | "email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const digits = phone.replace(/\D/g, "");
  const idValid =
    mode === "phone" ? digits.length >= 10 : EMAIL_RE.test(email.trim());

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
  };

  // No API for now: just check the form and move on.
  // TODO: later call the login API here (useLogin) before navigating.
  const submit = () => {
    if (!idValid || password.length === 0) {
      setError(
        mode === "phone"
          ? "Enter your phone number and password."
          : "Enter a valid email and your password.",
      );
      return;
    }
    setError("");
    navigate("/home", { replace: true });
  };

  const field = "flex h-14 items-center gap-3 rounded-2xl bg-[#f4f4f3] px-4";
  const iconBubble =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ece4f5] text-[#6E43A3]";
  const input =
    "w-full bg-transparent text-base text-gray-800 outline-none placeholder:text-gray-400";

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
        Welcome Back 👋
      </h1>
      <p className="mt-2 text-base text-gray-400">
        Sign in with one of the options below
      </p>

      {/* Tabs */}
      <div className="mt-8 flex border-b border-[#e6e2ee]">
        {(["phone", "email"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`-mb-px flex-1 border-b-[3px] pb-3 text-base font-semibold transition ${
              mode === m
                ? "border-[#6E43A3] text-[#6E43A3]"
                : "border-transparent text-[#9a9bb8]"
            }`}
          >
            {m === "phone" ? "Phone Number" : "Email Address"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {mode === "phone" ? (
          <div className="flex gap-3">
            <div className="flex h-14 w-[104px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#f4f4f3]">
              <span className="flex w-6 h-6 overflow-hidden rounded-full">
                <i className="h-full w-1/3 bg-[#6aa84f]" />
                <i className="w-1/3 h-full bg-white" />
                <i className="h-full w-1/3 bg-[#6aa84f]" />
              </span>
              <span className="text-base text-gray-700">+234</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="803 660 0027"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
                setError("");
              }}
              className={`${input} h-14 rounded-2xl bg-[#f4f4f3] px-4`}
            />
          </div>
        ) : (
          <label className={field}>
            <span className={iconBubble}>
              <Mail size={16} />
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className={input}
            />
          </label>
        )}

        <label className={field}>
          <span className={iconBubble}>
            <Lock size={16} />
          </span>
          <input
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className={input}
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="text-gray-400"
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>
      </div>

      <p className="mt-5 text-right text-sm text-[#8a8cab]">
        Can't remember password?{" "}
        <Link
          to="/forgot-password"
          className="font-semibold text-[#4a148c] underline"
        >
          Recover Password
        </Link>
      </p>

      {error && (
        <p className="mt-4 text-sm text-center text-red-600">{error}</p>
      )}

      <button
        onClick={submit}
        className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
      >
        Sign
      </button>

      <p className="mt-6 text-center text-sm text-[#8a8cab]">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-[#4a148c] underline">
          Register Now
        </Link>
      </p>
    </div>
  );
}
