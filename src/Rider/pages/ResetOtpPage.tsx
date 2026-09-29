import { useEffect, useState } from "react";
import { Check, ChevronLeft, Delete, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const OTP_LENGTH = 5;
const COUNTDOWN_SECONDS = 45;

interface ResetOtpLocationState {
  identifier?: string;
  sessionId?: string;
}

export default function ResetOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as ResetOtpLocationState) || {};

  const identifier = state.identifier ?? "";
  const sessionId = state.sessionId ?? "";

  const [code, setCode] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showVerifiedToast, setShowVerifiedToast] = useState(false);

  // No identifier / session to verify (e.g. page opened directly) — go back.
  useEffect(() => {
    if (!identifier || !sessionId) {
      navigate("/forgot-password", { replace: true });
    }
  }, [identifier, sessionId, navigate]);

  useEffect(() => {
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
  }, [timer]);

  const activeIndex = code.findIndex((d) => d === "");
  const currentIndex = activeIndex === -1 ? OTP_LENGTH - 1 : activeIndex;

  // No API for now: any 5-digit code is treated as valid.
  const submitCode = (_fullCode: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowVerifiedToast(true);
      setTimeout(() => {
        navigate("/forgot-password/reset", {
          replace: true,
          state: { identifier, sessionId },
        });
      }, 900);
    }, 500);
  };

  const handleDigit = (digit: string) => {
    if (isVerifying || showVerifiedToast) return;
    if (activeIndex === -1) return;
    setError("");
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
    setError("");
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
      setError("");
    }, 400);
  };

  const keypadRows: Array<Array<string | null>> = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [null, "0", "backspace"],
  ];

  return (
    <div className="font-outfit relative flex min-h-[100dvh] flex-col bg-white">
      <div className="flex-1 px-6 pt-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex items-center justify-center bg-white rounded-full shadow-md h-11 w-11"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
          OTP Verification
        </h1>
        <p className="mt-2 text-base text-gray-400">
          Enter the OTP sent to{" "}
          <span className="font-semibold text-gray-800">{identifier}</span>
        </p>

        {/* OTP boxes */}
        <div className="flex items-center gap-4 mt-8">
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

        <button
          onClick={() => navigate("/forgot-password")}
          className="mt-6 block w-full text-center text-base font-semibold text-[#d4a418]"
        >
          Change Email
        </button>

        {error && (
          <p className="mt-4 text-sm text-center text-red-600">{error}</p>
        )}
      </div>

      {/* Custom numeric keypad */}
      <div className="mt-auto bg-[#dedee6] px-4 pb-6 pt-4">
        <div className="flex flex-col gap-3">
          {keypadRows.map((row, ri) => (
            <div key={ri} className="flex gap-3">
              {row.map((key, ki) => {
                if (key === null) {
                  return <div key={ki} className="flex-1 h-16" />;
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

      {/* Verifying / verified overlay */}
      {(isVerifying || showVerifiedToast) && (
        <div className="absolute inset-0 z-10 flex items-end justify-center bg-white/30 backdrop-blur-[1px] backdrop-grayscale pb-28">
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
    </div>
  );
}
