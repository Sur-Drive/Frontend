import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const PaymentCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const reference = searchParams.get("reference");
    const [status, setStatus] = useState<"loading" | "success" | "failed">(
        "loading",
    );

    useEffect(() => {
        if (reference) {
            setStatus("success");
        } else {
            setStatus("failed");
        }
    }, [reference]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E43A3] mx-auto"></div>
                    <p className="mt-4 text-[#8E98A8]">
                        Verifying your payment...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                {status === "success" ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-[#D6F5DA] flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-8 h-8 text-[#267F50]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-[#1F083B] mb-2">
                            Payment Successful!
                        </h3>
                        <p className="text-[#5B646F] mb-6">
                            Your plan has been upgraded successfully.
                        </p>
                        <button
                            onClick={() =>
                                (window.location.href = "/fleet/billing")
                            }
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                        >
                            Return to Billing
                        </button>
                        {reference && (
                            <p className="mt-4 text-xs text-[#8E98A8]">
                                Reference: {reference}
                            </p>
                        )}
                    </>
                ) : (
                    <>
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
                        <h3 className="text-2xl font-bold text-[#1F083B] mb-2">
                            Payment Failed
                        </h3>
                        <p className="text-[#5B646F] mb-6">
                            There was an issue processing your payment. Please
                            try again.
                        </p>
                        <button
                            onClick={() =>
                                (window.location.href = "/fleet/billing")
                            }
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                        >
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentCallback;
