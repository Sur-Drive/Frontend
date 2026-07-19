import React from "react";

interface SubscriptionSummaryStepProps {
    data: any;
    onComplete: () => void;
    onBack?: () => void;
    loading?: boolean;
}

const SubscriptionSummaryStep: React.FC<SubscriptionSummaryStepProps> = ({
    data,
    onComplete,
    onBack,
    loading = false,
}) => {
    // Calculate costs based on plan
    const getPlanDetails = () => {
        switch (data.plan) {
            case "free":
                return { price: 0, label: "Free Trial" };
            case "starter":
                return { price: 2250, label: "Starter Fleet" };
            case "pro":
                return { price: 3500, label: "Pro Fleet" };
            case "enterprise":
                return { price: 0, label: "Enterprise Fleet" };
            default:
                return { price: 0, label: "Free Trial" };
        }
    };

    const planDetails = getPlanDetails();
    const vehicleCount = data.numberOfVehicles || 0;
    const monthlyCost = planDetails.price * vehicleCount;
    const totalCost = monthlyCost;

    const isFreePlan = data.plan === "free" || data.plan === "enterprise";

    return (
        <div className="flex w-full flex-col" style={{ gap: "40px" }}>
            {/* Header */}
            <div>
                <h2
                    className="text-[32px] font-bold text-black"
                    style={{ fontFamily: "Outfit" }}
                >
                    Subscription Summary
                </h2>
                <p
                    className="text-[#8E98A8]"
                    style={{ fontFamily: "Outfit", fontSize: "16px" }}
                >
                    Review your subscription details before proceeding to
                    payment.
                </p>
            </div>
            {/* Selected Plan Container */}
            <div
                className="flex justify-between items-center"
                style={{
                    width: "100%",
                    maxWidth: "558px",
                    border: "1px solid #E0E5EB",
                    borderRadius: "12px",
                    padding: "24px",
                    backgroundColor: "white",
                }}
            >
                <div className="flex flex-col gap-1">
                    <span
                        className="text-sm"
                        style={{
                            fontFamily: "Outfit",
                            color: "#6F6C8F",
                            fontWeight: 500,
                        }}
                    >
                        Selected Plan
                    </span>
                    <span
                        className="text-base font-semibold"
                        style={{
                            fontFamily: "Outfit",
                            color: "#03272E",
                        }}
                    >
                        {planDetails.label}
                    </span>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition hover:bg-gray-50"
                    style={{
                        color: "#6E43A3",
                        fontFamily: "Outfit",
                        fontSize: "14px",
                        fontWeight: 500,
                    }}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M8.5 2.5H3.5C2.94772 2.5 2.5 2.94772 2.5 3.5V14.5C2.5 15.0523 2.94772 15.5 3.5 15.5H14.5C15.0523 15.5 15.5 15.0523 15.5 14.5V9.5"
                            stroke="#6E43A3"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M13.5 2.5L15.5 4.5L9 11L6.5 11.5L7 9L13.5 2.5Z"
                            stroke="#6E43A3"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Change
                </button>
            </div>
            {/* Summary Container */}
            <div
                className="flex flex-col"
                style={{
                    width: "100%",
                    maxWidth: "558px",
                    border: "1px solid #E0E5EB",
                    borderRadius: "12px",
                    padding: "24px",
                    gap: "12px",
                    backgroundColor: "white",
                }}
            >
                {/* Vehicle Row */}
                <div className="flex justify-between items-center">
                    <span
                        className="text-sm"
                        style={{
                            fontFamily: "Outfit",
                            color: "#6F6C8F",
                            fontWeight: 500,
                        }}
                    >
                        Vehicle
                    </span>
                    <span
                        className="text-sm font-semibold"
                        style={{
                            fontFamily: "Outfit",
                            color: "#03272E",
                        }}
                    >
                        {vehicleCount}
                    </span>
                </div>

                {/* Price Row */}
                <div className="flex justify-between items-center">
                    <span
                        className="text-sm"
                        style={{
                            fontFamily: "Outfit",
                            color: "#6F6C8F",
                            fontWeight: 500,
                        }}
                    >
                        Price
                    </span>
                    <span
                        className="text-sm"
                        style={{
                            fontFamily: "Outfit",
                            color: "#03272E",
                        }}
                    >
                        {planDetails.price > 0
                            ? `₦${planDetails.price.toLocaleString()} Price Per Vehicle`
                            : "Free Trial"}
                    </span>
                </div>

                {/* Billing Row */}
                <div className="flex justify-between items-center">
                    <span
                        className="text-sm"
                        style={{
                            fontFamily: "Outfit",
                            color: "#6F6C8F",
                            fontWeight: 500,
                        }}
                    >
                        Billing
                    </span>
                    <span
                        className="text-sm"
                        style={{
                            fontFamily: "Outfit",
                            color: "#03272E",
                        }}
                    >
                        Monthly
                    </span>
                </div>

                {/* Estimated Monthly Cost */}
                <div className="flex justify-between items-center">
                    <span
                        className="text-sm"
                        style={{
                            fontFamily: "Outfit",
                            color: "#6F6C8F",
                            fontWeight: 500,
                        }}
                    >
                        Estimated Monthly Cost
                    </span>
                    <span
                        className="text-sm font-semibold"
                        style={{
                            fontFamily: "Outfit",
                            color: "#03272E",
                        }}
                    >
                        {planDetails.price > 0
                            ? `₦${monthlyCost.toLocaleString()}`
                            : "Free"}
                    </span>
                </div>

                {/* Dotted Divider */}
                <div
                    className="w-full"
                    style={{
                        borderTop: "1px dashed #D1D5DB",
                        margin: "4px 0",
                    }}
                />

                {/* Total Payment */}
                <div className="flex justify-between items-center">
                    <span
                        className="text-sm font-semibold"
                        style={{
                            fontFamily: "Outfit",
                            color: "#6F6C8F",
                        }}
                    >
                        Total Payment
                    </span>
                    <span
                        className="text-lg font-bold"
                        style={{
                            fontFamily: "Outfit",
                            color: "#03272E",
                        }}
                    >
                        {planDetails.price > 0
                            ? `₦${totalCost.toLocaleString()}`
                            : "Free"}
                    </span>
                </div>
            </div>
            {/* Buttons */}
            <div className="flex justify-between items-center gap-4">
                <div></div>
                <button
                    onClick={onComplete}
                    disabled={loading}
                    className="rounded-xl px-6 py-3 font-semibold text-white transition hover:opacity-90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: "#6E43A3",
                        fontFamily: "Outfit",
                        minWidth: "200px",
                        justifyContent: "center",
                    }}
                >
                    {loading ? (
                        <>
                            <svg
                                className="animate-spin h-5 w-5"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Processing...
                        </>
                    ) : (
                        <>
                            {isFreePlan
                                ? "Complete Registration"
                                : "Continue to payment"}
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M4 10H16"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M12 6L16 10L12 14"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SubscriptionSummaryStep;
