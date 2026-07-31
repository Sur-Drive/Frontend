import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, X } from "lucide-react";
import { login, getKYCStatus, type KYCStatusResponse } from "../../../api/auth";
import LeftPanel from "../components/LeftPanel";

interface ManagerSignInProps {
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
}

const ManagerSignIn: React.FC<ManagerSignInProps> = ({
    onSuccess,
    onError,
}) => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showExpiredModal, setShowExpiredModal] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identifier || !password) {
            setError("Please enter your email and password");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Step 1: Login
            const loginResponse = await login({ identifier, password });

            // Check user role from login response
            const userRole = loginResponse?.user?.role || loginResponse?.role;

            // If fleet owner, redirect to fleet login
            if (userRole === "fleet_owner" || userRole === "admin") {
                navigate("/fleet");
                return;
            }

            // Step 2: Check KYC Status
            const kycStatus: KYCStatusResponse = await getKYCStatus();

            // Step 3: Check if subscription is expired
            if (kycStatus.subscription?.isExpired) {
                setShowExpiredModal(true);
                setLoading(false);
                return;
            }

            // Step 4: Check if subscription is active
            const redirectPath = getRedirectPath(kycStatus);

            if (onSuccess) {
                onSuccess(loginResponse);
            }

            navigate(redirectPath);
        } catch (err: any) {
            setError(
                err.message || "Login failed. Please check your credentials.",
            );
            if (onError) {
                onError(
                    err.message ||
                        "Login failed. Please check your credentials.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const getRedirectPath = (kycStatus: KYCStatusResponse): string => {
        const { subscription } = kycStatus;

        // Check if subscription is expired
        if (subscription?.isExpired) {
            setShowExpiredModal(true);
            return "/manager";
        }

        // Allow access to manager dashboard
        return "/manager/dashboard";
    };

    const handleCloseExpiredModal = () => {
        setShowExpiredModal(false);
        navigate("/manager");
    };

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Left Panel */}
            <div className="hidden lg:block lg:w-1/2 h-full flex-shrink-0">
                <LeftPanel logoUrl="/images/logo-white.png" />
            </div>

            {/* Right Panel */}
            <div className="flex-1 h-full overflow-y-auto flex items-center justify-center bg-white p-8">
                <div className="w-full max-w-[520px]">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1
                            className="text-[40px] font-bold leading-[100%] text-black"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Welcome Back
                        </h1>
                        <p
                            className="text-[18px] font-normal leading-[150%] mt-2"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            Login to your manager account
                        </p>
                    </div>

                    {/* Error Message */}
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

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="w-full">
                        <div className="flex flex-col gap-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                                    Email
                                </label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) =>
                                        setIdentifier(e.target.value)
                                    }
                                    placeholder="Enter your email"
                                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                                    style={{
                                        height: "56px",
                                        fontFamily: "Outfit",
                                        fontSize: "16px",
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
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

                            {/* Forgot Password */}
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/manager/forgot-password")
                                    }
                                    className="text-sm font-medium text-[#6E43A3] hover:underline"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-4 w-full rounded-2xl px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        Signing in...
                                    </div>
                                ) : (
                                    "Login"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Subscription Expired Modal */}
            {showExpiredModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 rounded-full bg-[#FE3F2124] flex items-center justify-center">
                                <AlertCircle
                                    size={32}
                                    className="text-[#FE3F21]"
                                />
                            </div>
                            <button
                                onClick={handleCloseExpiredModal}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <h3
                            className="text-2xl font-bold text-[#1F083B] mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Subscription Expired
                        </h3>
                        <p
                            className="text-[#5B646F] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Your fleet subscription has expired. Please contact
                            your fleet administrator to renew the subscription
                            and regain access.
                        </p>
                        <button
                            onClick={handleCloseExpiredModal}
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerSignIn;
