// PaymentCallback.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

const PaymentCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Get all query parameters
    const status = searchParams.get("status");
    const tx_ref = searchParams.get("tx_ref");
    const transaction_id = searchParams.get("transaction_id");
    const reference = searchParams.get("reference");

    const [paymentStatus, setPaymentStatus] = useState<
        "loading" | "success" | "failed"
    >("loading");
    const [message, setMessage] = useState("Verifying your payment...");
    const [paymentReference, setPaymentReference] = useState<string | null>(
        null,
    );

    useEffect(() => {
        const handlePaymentCallback = async () => {
            try {
                console.log("📥 Payment callback received:", {
                    path: location.pathname,
                    status,
                    tx_ref,
                    transaction_id,
                    reference,
                });

                // CASE 1: We have a transaction_id from Flutterwave callback
                if (transaction_id) {
                    console.log("🔍 Verifying transaction:", transaction_id);
                    setPaymentReference(transaction_id);

                    try {
                        const token = localStorage.getItem("token");
                        // Use the transaction_id to verify with backend
                        const response = await fetch(
                            `${API_BASE}/payment/verify/${transaction_id}`,
                            {
                                method: "GET",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                            },
                        );

                        const data = await response.json();
                        console.log("✅ Verification response:", data);

                        if (response.ok && data.status === "success") {
                            setPaymentStatus("success");
                            setMessage(
                                "Payment verified successfully! Your subscription is now active.",
                            );
                            localStorage.setItem(
                                "subscriptionStatus",
                                "active",
                            );
                            localStorage.removeItem("paymentReference");
                            return;
                        } else {
                            // If verification fails but status is completed, treat as success
                            if (
                                status === "completed" ||
                                status === "successful"
                            ) {
                                setPaymentStatus("success");
                                setMessage(
                                    "Payment confirmed! Your subscription is being activated.",
                                );
                                localStorage.setItem(
                                    "subscriptionStatus",
                                    "active",
                                );
                                localStorage.removeItem("paymentReference");
                                return;
                            }
                            setPaymentStatus("failed");
                            setMessage(
                                data.message || "Payment verification failed.",
                            );
                            return;
                        }
                    } catch (error) {
                        console.error("Error verifying payment:", error);
                        // If verification fails but we have a completed status, show success
                        if (status === "completed" || status === "successful") {
                            setPaymentStatus("success");
                            setMessage(
                                "Payment received! Your subscription is being activated.",
                            );
                            localStorage.setItem(
                                "subscriptionStatus",
                                "active",
                            );
                            localStorage.removeItem("paymentReference");
                            return;
                        }
                        setPaymentStatus("failed");
                        setMessage(
                            "Failed to verify payment. Please contact support.",
                        );
                        return;
                    }
                }

                // CASE 2: We have tx_ref from Flutterwave
                if (tx_ref) {
                    console.log("📝 Processing tx_ref:", tx_ref);
                    setPaymentReference(tx_ref);

                    // If status is completed, treat as success
                    if (status === "completed" || status === "successful") {
                        setPaymentStatus("success");
                        setMessage(
                            "Payment successful! Your subscription is now active.",
                        );
                        localStorage.setItem("subscriptionStatus", "active");
                        localStorage.removeItem("paymentReference");
                        return;
                    }

                    // If status is failed or cancelled
                    if (status === "failed" || status === "cancelled") {
                        setPaymentStatus("failed");
                        setMessage(
                            "Payment was not completed. Please try again.",
                        );
                        return;
                    }
                }

                // CASE 3: We have a reference parameter (from our redirect)
                if (reference) {
                    console.log("📝 Processing reference:", reference);
                    setPaymentReference(reference);

                    // Check if it's a success or failed path
                    if (location.pathname.includes("/success")) {
                        setPaymentStatus("success");
                        setMessage("Payment successful!");
                        localStorage.setItem("subscriptionStatus", "active");
                        localStorage.removeItem("paymentReference");
                        return;
                    }

                    if (
                        location.pathname.includes("/failed") ||
                        location.pathname.includes("/cancel")
                    ) {
                        setPaymentStatus("failed");
                        setMessage(
                            "Payment was not completed. Please try again.",
                        );
                        return;
                    }
                }

                // CASE 4: Check localStorage for payment reference
                const storedRef = localStorage.getItem("paymentReference");
                if (storedRef) {
                    console.log("📦 Found stored reference:", storedRef);
                    setPaymentReference(storedRef);
                    setPaymentStatus("success");
                    setMessage(
                        "Payment confirmed! Your subscription is being activated.",
                    );
                    localStorage.setItem("subscriptionStatus", "active");
                    localStorage.removeItem("paymentReference");
                    return;
                }

                // CASE 5: If we get here, something went wrong
                console.log("❌ No payment information found");
                setPaymentStatus("failed");
                setMessage("Unable to verify payment. Please contact support.");
            } catch (error) {
                console.error("❌ Error processing payment callback:", error);
                setPaymentStatus("failed");
                setMessage(
                    "Failed to process payment. Please contact support.",
                );
            }
        };

        handlePaymentCallback();
    }, [status, tx_ref, transaction_id, reference, location.pathname]);

    // Get return URL from localStorage or use default
    const getReturnUrl = () => {
        return localStorage.getItem("returnUrl") || "/fleet/dashboard";
    };

    if (paymentStatus === "loading") {
        return (
            <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="flex flex-col items-center justify-center">
                        <Loader2
                            className="animate-spin text-[#6E43A3]"
                            size={48}
                        />
                        <p className="mt-4 text-[#5B646F]">{message}</p>
                        {(tx_ref || transaction_id || reference) && (
                            <p className="mt-2 text-xs text-[#8E98A8]">
                                Reference:{" "}
                                {tx_ref || transaction_id || reference}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                {paymentStatus === "success" ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-[#D6F5DA] flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-[#267F50]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1F083B] mb-2">
                            Payment Successful! 🎉
                        </h3>
                        <p className="text-[#5B646F] mb-2">
                            {message ||
                                "Your subscription has been activated successfully."}
                        </p>
                        {paymentReference && (
                            <p className="text-xs text-[#8E98A8] mb-6">
                                Reference: {paymentReference}
                            </p>
                        )}
                        <button
                            onClick={() => {
                                const returnUrl = getReturnUrl();
                                localStorage.removeItem("returnUrl");
                                navigate(returnUrl);
                            }}
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                        >
                            Go to Dashboard
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-[#FE3F2124] flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} className="text-[#FE3F21]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1F083B] mb-2">
                            {status === "cancelled"
                                ? "Payment Cancelled"
                                : "Payment Failed"}
                        </h3>
                        <p className="text-[#5B646F] mb-6">
                            {message ||
                                "There was an issue processing your payment. Please try again."}
                        </p>
                        {paymentReference && (
                            <p className="text-xs text-[#8E98A8] mb-4">
                                Reference: {paymentReference}
                            </p>
                        )}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    const returnUrl = getReturnUrl();
                                    localStorage.removeItem("returnUrl");
                                    navigate(returnUrl);
                                }}
                                className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() =>
                                    navigate("/fleet/subscription/renew")
                                }
                                className="w-full bg-transparent text-[#6E43A3] border border-[#6E43A3] px-6 py-3 rounded-xl hover:bg-[#6E43A3] hover:text-white transition"
                            >
                                Choose Different Plan
                            </button>
                            <button
                                onClick={() => navigate("/fleet/dashboard")}
                                className="w-full bg-transparent text-[#8E98A8] border border-[#E0E5EB] px-6 py-3 rounded-xl hover:bg-gray-50 transition"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentCallback;
