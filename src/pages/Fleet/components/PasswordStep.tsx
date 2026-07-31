import React, { useState } from "react";
import { setPassword } from "../../../api/auth";

interface PasswordStepProps {
    onSuccess: () => void;
    onError: (error: string) => void;
    setLoading: (loading: boolean) => void;
}

const PasswordStep: React.FC<PasswordStepProps> = ({
    onSuccess,
    onError,
    setLoading,
}) => {
    const [password, setPasswordValue] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const checkPasswordStrength = (pwd: string) => {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (pwd.match(/[a-z]/)) strength++;
        if (pwd.match(/[A-Z]/)) strength++;
        if (pwd.match(/[0-9]/)) strength++;
        if (pwd.match(/[^a-zA-Z0-9]/)) strength++;
        return strength;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pwd = e.target.value;
        setPasswordValue(pwd);
        setPasswordStrength(checkPasswordStrength(pwd));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            onError("Password must be at least 8 characters");
            return;
        }

        if (passwordStrength < 3) {
            onError(
                "Please use a stronger password (mix of letters, numbers, and special characters)",
            );
            return;
        }

        if (password !== confirmPassword) {
            onError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await setPassword({ password, confirmPassword });
            onSuccess();
        } catch (err: any) {
            onError(err.message || "Failed to set password");
        } finally {
            setLoading(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 2) return "#FF383C";
        if (passwordStrength === 3) return "#DAAF3A";
        return "#4CAF50";
    };

    const getStrengthText = () => {
        if (passwordStrength <= 2) return "Weak";
        if (passwordStrength === 3) return "Medium";
        return "Strong";
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full"
            style={{ width: "520px" }}
        >
            <div className="flex flex-col gap-6">
                <div className="text-center">
                    <h2
                        className="text-[32px] font-bold leading-[100%] text-black"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Set Your Password
                    </h2>
                    <p
                        className="mt-2 text-[#8E98A8]"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Create a strong password for your account
                    </p>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                        Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={handlePasswordChange}
                            className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                            placeholder="Enter your password"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8] hover:text-[#1F083B]"
                        >
                            {showPassword ? (
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M12 4C5 4 1 12 1 12C1 12 5 20 12 20C19 20 23 12 23 12C23 12 19 4 12 4Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="3"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M12 4C5 4 1 12 1 12C1 12 5 20 12 20C19 20 23 12 23 12C23 12 19 4 12 4Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="3"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                    <line
                                        x1="3"
                                        y1="3"
                                        x2="21"
                                        y2="21"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                        <div className="mt-2">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                        key={level}
                                        className="h-1 flex-1 rounded-full"
                                        style={{
                                            backgroundColor:
                                                level <= passwordStrength
                                                    ? getStrengthColor()
                                                    : "#E5E7EB",
                                        }}
                                    />
                                ))}
                            </div>
                            <span
                                className="mt-1 text-xs font-medium"
                                style={{ color: getStrengthColor() }}
                            >
                                {getStrengthText()} password
                            </span>
                        </div>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                        Confirm Password *
                    </label>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                        placeholder="Confirm your password"
                        required
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <p className="mt-1 text-xs text-[#FF383C]">
                            Passwords do not match
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full rounded-2xl px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{
                        backgroundColor: "#6E43A3",
                        height: "56px",
                        borderRadius: "16px",
                        fontFamily: "Outfit",
                        fontSize: "16px",
                        fontWeight: 600,
                    }}
                    disabled={
                        !password ||
                        !confirmPassword ||
                        password !== confirmPassword
                    }
                >
                    Complete Setup
                </button>
            </div>
        </form>
    );
};

export default PasswordStep;
