import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getKYCStatus, type KYCStatusResponse } from "../../../api/auth";

const GoogleCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getRedirectPath = (kycStatus: KYCStatusResponse): string => {
        const { isKycCompleted, status, subscription } = kycStatus;

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

    useEffect(() => {
        const token = searchParams.get("token");
        const errorParam = searchParams.get("error");

        const handleCallback = async () => {
            if (errorParam) {
                setError("Google authentication failed. Please try again.");
                setLoading(false);
                return;
            }

            if (!token) {
                setError("Authentication failed. No token received.");
                setLoading(false);
                return;
            }

            try {
                // Store the token
                localStorage.setItem("token", token);

                // Check KYC Status
                const kycStatus: KYCStatusResponse = await getKYCStatus();

                // Determine redirect based on KYC and subscription status
                const redirectPath = getRedirectPath(kycStatus);

                setLoading(false);
                navigate(redirectPath);
            } catch (err: any) {
                console.error("Error checking KYC status:", err);
                setError(
                    "Failed to verify your account status. Please try again.",
                );
                setLoading(false);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E43A3] mx-auto" />
                    <p
                        className="mt-4 text-[#8E98A8]"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Signing in with Google...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] p-6">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#FE3F2124] flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-[#FE3F21]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3
                        className="text-2xl font-bold text-[#1F083B] mb-2"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Authentication Failed
                    </h3>
                    <p
                        className="text-[#5B646F] mb-6"
                        style={{ fontFamily: "Outfit" }}
                    >
                        {error}
                    </p>
                    <button
                        onClick={() => navigate("/fleet")}
                        className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default GoogleCallback;
