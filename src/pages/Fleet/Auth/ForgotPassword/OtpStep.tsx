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
            className="flex w-full flex-col items-center"
            style={{ gap: "40px" }}
        >
            {/* Header */}
            <div
                className="flex flex-col items-center text-center"
                style={{ width: "520px", gap: "16px" }}
            >
                <h1
                    className="text-[32px] font-bold text-black"
                    style={{ fontFamily: "Outfit" }}
                >
                    Verify OTP
                </h1>
                <p
                    className="text-[16px] text-[#8E98A8]"
                    style={{ fontFamily: "Outfit" }}
                >
                    We sent a 6-digit code to{" "}
                    <strong>{maskEmail(email)}</strong>
                </p>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="w-full"
                style={{ maxWidth: "520px" }}
            >
                <div className="flex flex-col gap-8">
                    {/* OTP Inputs */}
                    <div className="flex justify-center gap-3">
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
                                className="w-14 h-16 text-center text-2xl font-bold border border-[#D1D5DB] rounded-xl focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] outline-none transition"
                                style={{ fontFamily: "Outfit" }}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {/* Timer & Resend */}
                    <div className="flex justify-between items-center">
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
                                    ? "text-[#8E98A8] cursor-not-allowed"
                                    : "text-[#6E43A3] hover:underline"
                            }`}
                            style={{ fontFamily: "Outfit" }}
                        >
                            Resend Code
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-2xl px-6 py-3 text-white transition hover:opacity-90"
                        style={{
                            backgroundColor: "#6E43A3",
                            height: "56px",
                            borderRadius: "16px",
                            fontFamily: "Outfit",
                            fontSize: "16px",
                            fontWeight: 600,
                        }}
                    >
                        Verify OTP
                    </button>

                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 text-sm text-[#8E98A8] hover:text-[#6E43A3] transition"
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
