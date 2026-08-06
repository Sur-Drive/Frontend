import React, { useState, useEffect, useRef } from "react";
import { KeyRound, ArrowLeft } from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface OtpStepProps {
    email: string;
    sessionId: string;
    onSuccess: (otp: string) => void;
    onError: (error: string) => void;
    setLoading: (loading: boolean) => void;
    onBack: () => void;
}

const OtpStep: React.FC<OtpStepProps> = ({
    email,
    sessionId,
    onSuccess,
    onError,
    setLoading,
    onBack,
}) => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(300); // 5 minutes
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Start timer
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-advance to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        const otpArray = pastedData.split("");
        const newOtp = [...otp];
        otpArray.forEach((char, index) => {
            if (index < 6) {
                newOtp[index] = char;
            }
        });
        setOtp(newOtp);

        // Focus last filled input
        const lastIndex = Math.min(otpArray.length - 1, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpValue = otp.join("");

        if (otpValue.length !== 6) {
            onError("Please enter the complete 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionId}`,
                },
                body: JSON.stringify({ otp: otpValue }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Invalid OTP. Please try again.",
                );
            }

            onSuccess(otpValue);
        } catch (err: any) {
            onError(err.message || "Failed to verify OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ identifier: email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to resend OTP");
            }

            setTimer(300);
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
            onError(null as any);
        } catch (err: any) {
            onError(err.message || "Failed to resend OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Helper function to mask email
    const maskEmail = (email: string) => {
        if (!email) return "";

        const [localPart, domain] = email.split("@");
        if (!domain) {
            // If no domain, just mask the local part
            return localPart.length > 3
                ? `${localPart.slice(0, 3)}${"*".repeat(Math.min(localPart.length - 3, 4))}`
                : localPart;
        }

        // Mask local part: show first 3 chars, hide the rest with asterisks
        const maskedLocal =
            localPart.length > 3
                ? `${localPart.slice(0, 3)}${"*".repeat(Math.min(localPart.length - 3, 4))}`
                : localPart;

        // Mask domain: show first 2 chars of domain and the TLD
        const [domainName, tld] = domain.split(".");
        const maskedDomain =
            domainName.length > 2
                ? `${domainName.slice(0, 2)}${"*".repeat(Math.min(domainName.length - 2, 3))}`
                : domainName;

        return `${maskedLocal}@${maskedDomain}.${tld}`;
    };

    return (
        <div
            className="flex w-full max-w-full flex-col items-center px-4 sm:px-6 md:px-0"
            style={{ gap: "32px" }}
        >
            {/* Header */}
            <div className="flex w-full max-w-[520px] flex-col items-center gap-3 text-center sm:gap-4">
                <h1
                    className="text-2xl font-bold text-black sm:text-[28px] md:text-[32px]"
                    style={{ fontFamily: "Outfit" }}
                >
                    Verify OTP
                </h1>
                <p
                    className="text-sm text-[#8E98A8] sm:text-base"
                    style={{ fontFamily: "Outfit" }}
                >
                    We sent a 6-digit code to{" "}
                    <strong>{maskEmail(email)}</strong>
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-[520px]">
                <div className="flex flex-col gap-6 sm:gap-8">
                    {/* OTP Inputs */}
                    <div className="flex justify-center gap-2 sm:gap-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) =>
                                    handleChange(index, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="h-12 w-12 rounded-xl border border-[#D1D5DB] text-center text-xl font-bold outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:w-14 sm:text-2xl md:h-16 md:w-16"
                                style={{ fontFamily: "Outfit" }}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {/* Timer & Resend */}
                    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-0">
                        <span
                            className="text-sm text-[#8E98A8]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {timer > 0
                                ? `Resend code in ${formatTime(timer)}`
                                : "Code expired"}
                        </span>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={timer > 0}
                            className={`text-sm font-medium transition ${
                                timer > 0
                                    ? "cursor-not-allowed text-[#8E98A8]"
                                    : "text-[#6E43A3] hover:underline"
                            }`}
                            style={{ fontFamily: "Outfit" }}
                        >
                            Resend Code
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="h-14 w-full rounded-2xl px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 sm:h-[56px]"
                        style={{
                            backgroundColor: "#6E43A3",
                            borderRadius: "16px",
                            fontFamily: "Outfit",
                        }}
                    >
                        Verify OTP
                    </button>

                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 text-sm text-[#8E98A8] transition hover:text-[#6E43A3] sm:text-base"
                        style={{ fontFamily: "Outfit" }}
                    >
                        <ArrowLeft size={16} />
                        Back to Email
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OtpStep;
