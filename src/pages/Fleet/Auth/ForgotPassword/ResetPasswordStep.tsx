import React, { useState } from "react";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface ResetPasswordStepProps {
    sessionId: string;
    onSuccess: () => void;
    onError: (error: string) => void;
    setLoading: (loading: boolean) => void;
    onBack: () => void;
}

const ResetPasswordStep: React.FC<ResetPasswordStepProps> = ({
    sessionId,
    onSuccess,
    onError,
    setLoading,
    onBack,
}) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            onError("Please enter both password fields");
            return;
        }

        if (password.length < 8) {
            onError("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            onError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionId}`,
                },
                body: JSON.stringify({
                    password,
                    confirmPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to reset password");
            }

            onSuccess();
        } catch (err: any) {
            onError(
                err.message || "Failed to reset password. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[a-z]/.test(pass)) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^a-zA-Z0-9]/.test(pass)) score++;
        return score;
    };

    const strength = getPasswordStrength(password);
    const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
    const strengthColors = [
        "#FE3F21",
        "#F2A618",
        "#F2A618",
        "#2E7D32",
        "#2E7D32",
    ];

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
                    Create New Password
                </h1>
                <p
                    className="text-sm text-[#8E98A8] sm:text-base"
                    style={{ fontFamily: "Outfit" }}
                >
                    Enter your new password below.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-[520px]">
                <div className="flex flex-col gap-4 sm:gap-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                                style={{
                                    fontFamily: "Outfit",
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8] transition hover:text-[#1F083B]"
                            >
                                {showPassword ? (
                                    <EyeOff
                                        size={18}
                                        className="sm:size-[20px]"
                                    />
                                ) : (
                                    <Eye size={18} className="sm:size-[20px]" />
                                )}
                            </button>
                        </div>

                        {/* Password Strength */}
                        {password && (
                            <div className="mt-2">
                                <div className="flex gap-1">
                                    {[0, 1, 2, 3, 4].map((index) => (
                                        <div
                                            key={index}
                                            className="h-1 flex-1 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    index < strength
                                                        ? strengthColors[
                                                              strength - 1
                                                          ]
                                                        : "#E5E7EB",
                                            }}
                                        />
                                    ))}
                                </div>
                                <p
                                    className="mt-1 text-xs"
                                    style={{
                                        fontFamily: "Outfit",
                                        color:
                                            strength > 0
                                                ? strengthColors[strength - 1]
                                                : "#8E98A8",
                                    }}
                                >
                                    {strength > 0
                                        ? strengthLabels[strength - 1]
                                        : "Enter a password"}
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Confirm new password"
                                className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                                style={{
                                    fontFamily: "Outfit",
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8] transition hover:text-[#1F083B]"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff
                                        size={18}
                                        className="sm:size-[20px]"
                                    />
                                ) : (
                                    <Eye size={18} className="sm:size-[20px]" />
                                )}
                            </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p
                                className="mt-1 text-xs text-[#FE3F21]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Passwords do not match
                            </p>
                        )}
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
                        Reset Password
                    </button>

                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 text-sm text-[#8E98A8] transition hover:text-[#6E43A3] sm:text-base"
                        style={{ fontFamily: "Outfit" }}
                    >
                        <ArrowLeft size={16} />
                        Back to OTP
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ResetPasswordStep;
