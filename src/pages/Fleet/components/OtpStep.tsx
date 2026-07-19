import React, { useState, useEffect, useRef } from "react";
import { verifyOtp } from "../../../api/auth";

interface OtpStepProps {
    email: string;
    onSuccess: (otp: string) => void;
    onError: (error: string) => void;
    setLoading: (loading: boolean) => void;
}

const OtpStep: React.FC<OtpStepProps> = ({
    email,
    onSuccess,
    onError,
    setLoading,
}) => {
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [timer, setTimer] = useState(300); // 5 minutes
    const [canResend, setCanResend] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (_, first, middle) => {
        return first + "*".repeat(Math.min(middle.length, 4));
    });

    useEffect(() => {
        if (timer > 0 && !canResend) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else if (timer === 0) {
            setCanResend(true);
        }
    }, [timer, canResend]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return;
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpError(null);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (/^\d+$/.test(pastedData)) {
            const digits = pastedData.split("");
            const newOtp = [...otp];
            digits.forEach((digit, idx) => {
                if (idx < 6) newOtp[idx] = digit;
            });
            setOtp(newOtp);
            if (digits.length === 6) {
                // Auto-submit if all digits are pasted
                handleSubmit();
            }
        }
    };

    const handleSubmit = async () => {
        const otpString = otp.join("");
        if (otpString.length !== 6) {
            setOtpError("Please enter all 6 digits");
            return;
        }

        setLoading(true);
        try {
            await verifyOtp({ identifier: email, otp: otpString });
            onSuccess(otpString);
        } catch (err: any) {
            setOtpError(
                err.message ||
                    "Incorrect or expired code. Request a new code to continue.",
            );
            onError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setCanResend(false);
        setTimer(300);
        // Resend OTP logic here
        try {
            // await sendOtp({ identifier: email, role: 'fleet-owner' });
            console.log("Resend OTP");
        } catch (err: any) {
            onError(err.message);
        }
    };

    return (
        <div
            className="flex w-full flex-col items-center"
            style={{ width: "520px", height: "395px", gap: "40px" }}
        >
            {/* Header */}
            <div className="flex flex-col items-center gap-4 text-center">
                <h1
                    className="text-[40px] font-bold leading-[100%] text-black"
                    style={{ fontFamily: "Outfit" }}
                >
                    Enter verification code
                </h1>
                <p
                    className="text-[18px] font-normal leading-[150%]"
                    style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                >
                    We have just sent a verification code to{" "}
                    <strong className="text-[#1F083B]">{maskedEmail}</strong>
                </p>
            </div>

            {/* OTP Inputs */}
            <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="h-16 w-16 rounded-xl border-2 text-center text-2xl font-semibold transition focus:border-[#6E43A3] focus:outline-none focus:ring-2 focus:ring-[#6E43A3]/20"
                        style={{
                            backgroundColor: "#F9FAFB",
                            borderColor: digit ? "#0A2342" : "#D1D5DB",
                            color: "#0A2342",
                            fontFamily: "Outfit",
                        }}
                    />
                ))}
            </div>

            {/* Error Message */}
            {otpError && (
                <div
                    className="flex w-full items-center rounded-lg px-4 py-3"
                    style={{
                        backgroundColor: "#FF383C1F",
                        color: "#FF383C",
                    }}
                >
                    <span className="text-sm font-medium">{otpError}</span>
                </div>
            )}

            {/* Resend */}
            <div className="flex w-full items-center justify-between">
                <button
                    onClick={handleResend}
                    disabled={!canResend}
                    className={`text-sm font-medium transition ${
                        canResend
                            ? "hover:opacity-70"
                            : "opacity-50 cursor-not-allowed"
                    }`}
                    style={{ color: "#7A8492", fontFamily: "Outfit" }}
                >
                    Don't get the code?{" "}
                    <span className="font-semibold">Resend code</span>
                </button>
                {!canResend && (
                    <span
                        className="text-sm font-medium"
                        style={{ color: "#DAAF3A", fontFamily: "Outfit" }}
                    >
                        {formatTime(timer)}
                    </span>
                )}
            </div>

            {/* Continue Button */}
            <button
                onClick={handleSubmit}
                className="w-full rounded-2xl px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
                style={{
                    backgroundColor: "#6E43A3",
                    height: "56px",
                    borderRadius: "16px",
                    fontFamily: "Outfit",
                    fontSize: "16px",
                    fontWeight: 600,
                }}
                disabled={otp.some((d) => !d)}
            >
                Continue
            </button>
        </div>
    );
};

export default OtpStep;
