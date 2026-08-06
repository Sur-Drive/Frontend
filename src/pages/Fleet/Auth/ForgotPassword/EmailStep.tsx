import React, { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface EmailStepProps {
    onSuccess: (email: string, resetToken: string) => void;
    onError: (error: string) => void;
    setLoading: (loading: boolean) => void;
    onBack: () => void;
}

const EmailStep: React.FC<EmailStepProps> = ({
    onSuccess,
    onError,
    setLoading,
    onBack,
}) => {
    const [identifier, setIdentifier] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identifier) {
            onError("Please enter your email or phone number");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ identifier }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to send reset link");
            }

            const sessionId = data.sessionId || data.data?.sessionId || "";

            if (!sessionId) {
                console.error("No sessionId received in response:", data);
                onError("Failed to get reset session. Please try again.");
                return;
            }

            onSuccess(identifier, sessionId);
        } catch (err: any) {
            onError(
                err.message || "Failed to send reset link. Please try again.",
            );
        } finally {
            setLoading(false);
        }
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
                    Forgot Password?
                </h1>
                <p
                    className="text-sm text-[#8E98A8] sm:text-base"
                    style={{ fontFamily: "Outfit" }}
                >
                    Enter your email or phone number to receive a password reset
                    otp.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-[520px]">
                <div className="flex flex-col gap-4 sm:gap-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                            Email or Phone
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Enter your email or phone number"
                            className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                            style={{
                                fontFamily: "Outfit",
                            }}
                            required
                        />
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
                        Send Reset OTP
                    </button>

                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 text-sm text-[#8E98A8] transition hover:text-[#6E43A3] sm:text-base"
                        style={{ fontFamily: "Outfit" }}
                    >
                        <ArrowLeft size={16} />
                        Back to Login
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmailStep;
