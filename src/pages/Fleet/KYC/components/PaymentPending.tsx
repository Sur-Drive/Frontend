import React, { useState } from "react";
import { Clock, CreditCard, Mail, RefreshCw, CheckCircle } from "lucide-react";
import BlurSidebar from "../../Dashboard/BlurSidebar";

const PaymentPending: React.FC = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 2000);
    };

    return (
        <BlurSidebar status="payment_pending">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#F2A61820] mx-auto mb-6">
                        <Clock size={40} className="text-[#F2A618]" />
                    </div>

                    <h1
                        className="text-2xl font-bold text-center text-[#1F083B] mb-3"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Payment Pending
                    </h1>

                    <p
                        className="text-[#5B646F] text-center mb-8"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Your payment is being processed. You'll get access to
                        your fleet dashboard once confirmed.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                            <p
                                className="text-sm text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Payment Method
                            </p>
                            <p
                                className="text-sm font-semibold text-[#1F083B] flex items-center justify-center gap-2"
                                style={{ fontFamily: "Outfit" }}
                            >
                                <CreditCard
                                    size={16}
                                    className="text-[#6E43A3]"
                                />
                                Card Payment
                            </p>
                        </div>
                        <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                            <p
                                className="text-sm text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Reference
                            </p>
                            <p
                                className="text-sm font-semibold text-[#1F083B]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                PLAN-1784477732670-43049
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-[#E5E7EB] pt-6">
                        <h3
                            className="text-sm font-semibold text-[#1F083B] mb-4"
                            style={{ fontFamily: "Outfit" }}
                        >
                            What happens next?
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#6E43A310] flex items-center justify-center flex-shrink-0">
                                    <CheckCircle
                                        size={16}
                                        className="text-[#6E43A3]"
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Payment Confirmation
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        We're verifying your payment with the
                                        provider
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#6E43A310] flex items-center justify-center flex-shrink-0">
                                    <Mail
                                        size={16}
                                        className="text-[#6E43A3]"
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Email Notification
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        You'll receive a confirmation email once
                                        payment is complete
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#6E43A310] flex items-center justify-center flex-shrink-0">
                                    <Clock
                                        size={16}
                                        className="text-[#6E43A3]"
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Dashboard Access
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Your fleet dashboard will be unlocked
                                        upon payment confirmation
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex-1 px-6 py-3 rounded-xl bg-[#6E43A3] text-white hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isRefreshing ? (
                                <RefreshCw size={18} className="animate-spin" />
                            ) : (
                                <RefreshCw size={18} />
                            )}
                            {isRefreshing ? "Checking..." : "Check Status"}
                        </button>
                        <button className="flex-1 px-6 py-3 rounded-xl text-[#6E43A3] border border-[#6E43A3] hover:bg-[#6E43A3] hover:text-white transition">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </BlurSidebar>
    );
};

export default PaymentPending;
