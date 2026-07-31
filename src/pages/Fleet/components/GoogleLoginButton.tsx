// src/components/GoogleLoginButton.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { getKYCStatus, type KYCStatusResponse } from "../../../api/auth";

interface GoogleLoginButtonProps {
    text?: string;
    className?: string;
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
    text = "Continue with Google",
    className = "",
    onSuccess,
    onError,
}) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const API_BASE = "https://backend-production-01de.up.railway.app";

    const getRedirectPath = (kycStatus: KYCStatusResponse): string => {
        const { isKycCompleted, status, subscription } = kycStatus;

        if (status === "no_company" || !isKycCompleted) {
            return "/fleet/kyc";
        }

        if (status === "pending") {
            return "/fleet/kyc-pending";
        }

        if (isKycCompleted) {
            if (!subscription) {
                return "/fleet/kyc";
            }

            if (subscription.isExpired) {
                return "/fleet/subscription/renew";
            }

            if (
                subscription.status === "active" &&
                subscription.paymentStatus === "pending"
            ) {
                return "/fleet/payment/pending";
            }

            if (
                subscription.isTrial ||
                (subscription.status === "active" &&
                    subscription.paymentStatus === "paid")
            ) {
                return "/fleet/dashboard";
            }

            return "/fleet/kyc";
        }

        return "/fleet/kyc";
    };

    const handleSuccess = async (response: any) => {
        try {
            setLoading(true);
            console.log("Google credential response:", response);

            const idToken = response.credential;

            if (!idToken) {
                throw new Error("No ID token received from Google");
            }

            const apiResponse = await fetch(`${API_BASE}/auth/google`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    idToken: idToken,
                    role: "fleet_owner",
                }),
            });

            const data = await apiResponse.json();

            if (!apiResponse.ok) {
                throw new Error(data.message || "Google authentication failed");
            }

            if (data.tokens?.accessToken) {
                localStorage.setItem("token", data.tokens.accessToken);
            } else if (data.token) {
                localStorage.setItem("token", data.token);
            }

            // Check KYC Status
            const kycStatus: KYCStatusResponse = await getKYCStatus();

            // Determine redirect
            const redirectPath = getRedirectPath(kycStatus);

            if (onSuccess) {
                onSuccess(data);
            }

            navigate(redirectPath);
        } catch (err: any) {
            console.error("Google login error:", err);
            if (onError) {
                onError(err.message || "Failed to authenticate with Google");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleError = () => {
        console.error("Google login failed");
        setLoading(false);
        if (onError) {
            onError("Google authentication failed. Please try again.");
        }
    };

    return (
        <div className="w-full">
            {loading ? (
                <button
                    className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-9 py-4 opacity-50 cursor-not-allowed"
                    style={{
                        height: "56px",
                        borderRadius: "16px",
                        fontFamily: "Outfit",
                        fontSize: "16px",
                        fontWeight: 600,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#6E43A3] border-t-transparent" />
                        <span className="text-base font-medium text-[#1F083B]">
                            Signing in...
                        </span>
                    </div>
                </button>
            ) : (
                <div className="w-full">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="outline"
                        shape="pill"
                        size="large"
                        width="100%"
                        text="continue_with"
                        logo_alignment="center"
                    />
                </div>
            )}
        </div>
    );
};

export default GoogleLoginButton;
