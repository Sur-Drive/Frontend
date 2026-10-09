import { useEffect, useState } from "react";
import { ChevronLeft, Delete } from "lucide-react";

const DEFAULT_OTP_LENGTH = 5;
const COUNTDOWN_SECONDS = 45;

export default function DriverOtpEntry({
  destination,
  onBack,
  onVerify,
  onResend,
  length = DEFAULT_OTP_LENGTH,
}: {
  /** e.g. "Adeniji@gmail.com" or "+234 803 123 4567" */
  destination: string;
  onBack: () => void;
  /** Called with the full code. Throw to show an error and clear the boxes. */
  onVerify: (code: string) => Promise<void>;
  /** Called when "Resend OTP" is tapped. Throw to show an error. */
  onResend: () => Promise<void>;
  length?: number;
}) {
  const OTP_LENGTH = length;
  const [error, setError] = useState("");
  const [code, setCode] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

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

  const submitCode = async (fullCode: string) => {
    setError("");
    setIsVerifying(true);
    try {
      await onVerify(fullCode);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid or expired code. Please try again.",
      );
      setCode(new Array(OTP_LENGTH).fill(""));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigit = (digit: string) => {
    if (isVerifying) return;
    if (activeIndex === -1) return;
    const next = [...code];
    next[activeIndex] = digit;
    setCode(next);
    setError("");
    if (activeIndex === OTP_LENGTH - 1) {
      void submitCode(next.join(""));
    }
  };

  const handleBackspace = () => {
    if (isVerifying) return;
    const lastFilled = [...code].reverse().findIndex((d) => d !== "");
    if (lastFilled === -1) return;
    const indexToClear = OTP_LENGTH - 1 - lastFilled;
    const next = [...code];
    next[indexToClear] = "";
    setCode(next);
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setError("");
    setIsResending(true);
    try {
      await onResend();
      setTimer(COUNTDOWN_SECONDS);
      setCanResend(false);
      setCode(new Array(OTP_LENGTH).fill(""));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't resend the code. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const keypadRows: Array<Array<string | null>> = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [null, "0", "backspace"],
  ];

  return (
    <div className="font-outfit relative flex h-full min-h-0 flex-1 flex-col bg-white">
      <div className="flex-1 px-6 pb-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
        >
          <ChevronLeft size={22} className="text-[#1F2937]" />
        </button>

        <h1 className="mt-8 text-[22px] sm:text-[28px] font-bold text-[#2b2b2b]">
          OTP Verification
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-400">
          Enter the OTP sent to{" "}
          <span className="font-semibold text-gray-800">{destination}</span>
        </p>

        <div className="mx-auto mt-8 flex w-full max-w-sm items-center justify-between gap-3 sm:gap-4">
          {code.map((digit, i) => (
            <div
              key={i}
              className={`flex h-[60px] w-[60px] flex-1 items-center justify-center rounded-2xl text-xl sm:text-2xl font-bold text-gray-800 transition sm:h-[68px] ${
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

        {error && (
          <p className="mx-auto mt-4 w-full max-w-sm text-[13px] sm:text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="mx-auto mt-8 w-full max-w-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending}
            className={`h-14 w-full rounded-2xl text-[15px] sm:text-lg font-semibold transition ${
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
      </div>

      {/* Custom numeric keypad */}
      <div className="mt-auto bg-[#dedee6] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
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
                    className="h-16 flex-1 rounded-2xl bg-white text-[17px] sm:text-xl font-semibold text-gray-800 shadow-sm active:scale-[0.97]"
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {isVerifying && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30 backdrop-blur-[1px] backdrop-grayscale">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#6E43A3]" />
        </div>
      )}
    </div>
  );
}
