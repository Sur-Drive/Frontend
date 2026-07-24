import React, { useState } from "react";
import {
    login,
    getKYCStatus,
    type KYCStatusResponse,
} from "../../../../api/auth";
import GoogleLoginButton from "../../components/GoogleLoginButton";

interface LoginStepProps {
    onSuccess: (data: any) => void;
    onError: (error: string) => void;
    setLoading: (loading: boolean) => void;
    onRedirect: (path: string) => void;
}

const LoginStep: React.FC<LoginStepProps> = ({
    onSuccess,
    onError,
    setLoading,
    onRedirect,
}) => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identifier || !password) {
            onError("Please enter your email and password");
            return;
        }

        setLoading(true);
        try {
            // Step 1: Login
            const loginResponse = await login({ identifier, password });

            // Check user role from login response
            const userRole = loginResponse?.user?.role || loginResponse?.role;

            // If fleet manager, redirect to manager login
            if (userRole === "fleet_manager" || userRole === "manager") {
                onRedirect("/manager");
                return;
            }

            // Step 2: Check KYC Status
            const kycStatus: KYCStatusResponse = await getKYCStatus();

            // Step 3: Determine redirect based on KYC and subscription status
            const redirectPath = getRedirectPath(kycStatus);
            onRedirect(redirectPath);

            onSuccess(loginResponse);
        } catch (err: any) {
            onError(
                err.message || "Login failed. Please check your credentials.",
            );
        } finally {
            setLoading(false);
        }
    };

    const getRedirectPath = (kycStatus: KYCStatusResponse): string => {
        const { isKycCompleted, isVerified, status, subscription } = kycStatus;

        // Case 1: No company exists or KYC not started
        if (status === "no_company" || !isKycCompleted) {
            return "/fleet/kyc";
        }

        // Case 2: KYC is pending approval
        if (status === "pending") {
            return "/fleet/kyc-pending";
        }

        // Case 4: KYC is completed
        if (isKycCompleted) {
            // Check subscription status
            if (!subscription) {
                return "/fleet/kyc";
            }

            // Check if subscription is expired
            if (subscription.isExpired) {
                return "/fleet/subscription/renew";
            }

            // Check if payment is pending
            if (
                subscription.status === "active" &&
                subscription.paymentStatus === "pending"
            ) {
                return "/fleet/payment/pending";
            }

            // Check if it's a trial or active paid subscription
            // Allow access even if isVerified is false
            if (
                subscription.isTrial ||
                (subscription.status === "active" &&
                    subscription.paymentStatus === "paid")
            ) {
                return "/fleet/dashboard";
            }

            // Default to KYC if nothing else matches
            return "/fleet/kyc";
        }

        // Default fallback
        return "/fleet/kyc";
    };

    return (
        <div
            className="flex w-full flex-col items-center"
            style={{ gap: "40px" }}
        >
            {/* Header */}
            <div
                className="flex flex-col items-center text-center"
                style={{ width: "520px", gap: "8px" }}
            >
                <h1
                    className="text-[40px] font-bold leading-[100%] text-black"
                    style={{ fontFamily: "Outfit" }}
                >
                    Welcome Back
                </h1>
                <p
                    className="text-[18px] font-normal leading-[150%]"
                    style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                >
                    Login to your fleet management dashboard
                </p>
            </div>

            <div className="w-full" style={{ maxWidth: "520px" }}>
                <GoogleLoginButton />
            </div>

            {/* Divider */}
            <div className="flex w-full items-center gap-4">
                <div
                    className="flex-1 border-t"
                    style={{ borderColor: "#7A8492" }}
                />
                <span className="text-sm text-[#7A8492]">OR</span>
                <div
                    className="flex-1 border-t"
                    style={{ borderColor: "#7A8492" }}
                />
            </div>

            {/* Login Form */}
            <form
                onSubmit={handleLogin}
                className="w-full"
                style={{ maxWidth: "520px" }}
            >
                <div className="flex flex-col gap-6">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                            Email or Phone
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Enter your email or phone number"
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
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98A8] hover:text-[#1F083B]"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                        <button
                            type="button"
                            onClick={() =>
                                (window.location.href =
                                    "/fleet/forgot-password")
                            }
                            className="text-sm font-medium text-[#6E43A3] hover:underline"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="mt-4 w-full rounded-2xl px-6 py-3 text-white transition hover:opacity-90"
                        style={{
                            backgroundColor: "#6E43A3",
                            height: "56px",
                            borderRadius: "16px",
                            fontFamily: "Outfit",
                            fontSize: "16px",
                            fontWeight: 600,
                        }}
                    >
                        Login
                    </button>
                </div>
            </form>

            {/* Sign up link */}
            <div className="text-center">
                <p
                    className="text-sm text-[#8E98A8]"
                    style={{ fontFamily: "Outfit" }}
                >
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() => (window.location.href = "/fleet")}
                        className="font-semibold text-[#6E43A3] hover:underline"
                    >
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginStep;
