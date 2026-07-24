// src/pages/Fleet/ManagerAcceptInvite.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import LeftPanel from "../components/LeftPanel";

const API_BASE = "https://backend-production-01de.up.railway.app";

const ManagerAcceptInvite: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError(
                "Invalid invitation link. Please contact your fleet manager.",
            );
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError("Invalid invitation token");
            return;
        }

        if (!password || !confirmPassword) {
            setError("Please enter both password fields");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE}/fleet/managers/accept-invite`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                        password,
                        confirmPassword,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to accept invitation");
            }

            if (data.accessToken) {
                localStorage.setItem("token", data.accessToken);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate("/manager");
            }, 3000);
        } catch (err: any) {
            setError(
                err.message || "Failed to accept invitation. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex h-screen w-full overflow-hidden">
                <div className="hidden lg:block lg:w-1/2 h-full flex-shrink-0">
                    <LeftPanel logoUrl="/images/logo-white.png" />
                </div>
                <div className="flex-1 h-full overflow-y-auto flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#FE3F2124] flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-[#FE3F21]" />
                        </div>
                        <h3
                            className="text-2xl font-bold text-[#1F083B] mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Invalid Invitation
                        </h3>
                        <p
                            className="text-[#5B646F] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {error ||
                                "This invitation link is invalid or has expired."}
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex h-screen w-full overflow-hidden">
                <div className="hidden lg:block lg:w-1/2 h-full flex-shrink-0">
                    <LeftPanel logoUrl="/images/logo-white.png" />
                </div>
                <div className="flex-1 h-full overflow-y-auto flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#D6F5DA] flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-[#267F50]" />
                        </div>
                        <h3
                            className="text-2xl font-bold text-[#1F083B] mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Welcome to SurDrive!
                        </h3>
                        <p
                            className="text-[#5B646F] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Your invitation has been accepted successfully.
                            Redirecting to dashboard...
                        </p>
                        <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-[#6E43A3] h-1.5 rounded-full animate-pulse"
                                style={{ width: "100%" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Left Panel */}
            <div className="hidden lg:block lg:w-1/2 h-full flex-shrink-0">
                <LeftPanel logoUrl="/images/logo-white.png" />
            </div>

            {/* Right Panel */}
            <div className="flex-1 h-full overflow-y-auto flex items-center justify-center bg-white">
                <div className="w-full max-w-[520px] px-8 py-12">
                    <div className="text-center mb-8">
                        <h1
                            className="text-[32px] font-bold text-black"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Accept Invitation
                        </h1>
                        <p
                            className="text-[16px] text-[#8E98A8] mt-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Set up your account to join the fleet
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-[#FE3F2124] rounded-xl flex items-center gap-2">
                            <AlertCircle
                                size={16}
                                className="text-[#FE3F21] flex-shrink-0"
                            />
                            <p
                                className="text-sm text-[#FE3F21]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#1F083B] mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Enter your password"
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
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8] hover:text-[#1F083B]"
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#1F083B] mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    placeholder="Confirm your password"
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
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
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
                            {confirmPassword &&
                                password !== confirmPassword && (
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
                            disabled={
                                loading ||
                                !password ||
                                !confirmPassword ||
                                password !== confirmPassword
                            }
                            className="w-full rounded-2xl px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: "#6E43A3",
                                height: "56px",
                                borderRadius: "16px",
                                fontFamily: "Outfit",
                                fontSize: "16px",
                                fontWeight: 600,
                            }}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    Setting up...
                                </div>
                            ) : (
                                "Accept Invitation"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ManagerAcceptInvite;
