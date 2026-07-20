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
                    Create New Password
                </h1>
                <p
                    className="text-[16px] text-[#8E98A8]"
                    style={{ fontFamily: "Outfit" }}
                >
                    Enter your new password below.
                </p>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="w-full"
                style={{ maxWidth: "520px" }}
            >
                <div className="flex flex-col gap-6">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                                style={{
                                    height: "56px",
                                    fontFamily: "Outfit",
                                    fontSize: "16px",
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8] hover:text-[#1F083B]"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
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
                        <label className="mb-1 block text-sm font-medium text-[#1F083B]">
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
                                className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                                style={{
                                    height: "56px",
                                    fontFamily: "Outfit",
                                    fontSize: "16px",
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8] hover:text-[#1F083B]"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
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
                        Reset Password
                    </button>

                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 text-sm text-[#8E98A8] hover:text-[#6E43A3] transition"
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
