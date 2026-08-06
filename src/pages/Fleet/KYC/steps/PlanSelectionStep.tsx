import React, { useState } from "react";

interface PlanSelectionStepProps {
    onNext: (data: any) => void;
}

const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({ onNext }) => {
    const [selectedPlan, setSelectedPlan] = useState<string>("free_trial");
    const [selectedCard, setSelectedCard] = useState<string>("free_trial");

    const plans = [
        {
            id: "free_trial",
            name: "Free Trial",
            description:
                "For small fleets just getting started with road intelligence.",
            price: "Free/30 days",
            buttonText: "Select Plan",
            features: [
                "Up to 5 vehicles",
                "Live vehicle tracking (30-second refresh)",
                "Driver app for all enrolled drivers",
                "Basic driving behaviour score",
                "Trip history (7 days rolling)",
                "Hazard alerts across Nigerian roads",
                "SOS button + Fleet Manager notification",
                "One Fleet Manager account",
                "Email support",
            ],
        },
        {
            id: "starter",
            name: "Starter Fleet",
            description:
                "For growing logistics teams that need real-time insight.",
            price: "₦2,250/per vehicle month",
            buttonText: "Select Plan",
            features: [
                "Minimum of 10 vehicles",
                "Live vehicle tracking (30-second refresh)",
                "Driver app & Basic driving behaviour score",
                "Basic driving behaviour score",
                "30-day trip history",
                "Hazard alerts",
                "SOS with Fleet Manager notification",
                "Monthly fleet summary",
                "Email support (48-hour SLA)",
                "Up to 3 Fleet Manager accounts",
            ],
        },
        {
            id: "pro",
            name: "Pro Fleet",
            description:
                "For growing logistics teams that need real-time insight.",
            price: "₦3,500/per vehicle month",
            buttonText: "Select Plan",
            features: [
                "Minimum of 30 vehicles",
                "10-second location refresh",
                "Advanced driving behaviour score",
                "90-day trip history & Unlimited geofences",
                "Trip scheduling & pre-departure hazard checks",
                "Unlimited geofences",
                "Driver leaderboard & Custom alerts",
                "Weekly performance reports",
                "Custom alerts",
                "Route compliance monitoring",
                "Cross-state route intelligence",
                "Up to 10 Fleet Manager accounts",
                "Read-only API access",
                "Phone support (8-hour SLA) and dedicated WhatsApp support",
            ],
        },
        {
            id: "enterprise",
            name: "Enterprise Fleet",
            description: "Custom solutions for large teams & organizations.",
            price: "Contact us",
            buttonText: "Send a message",
            features: [
                "Sub-fleet management",
                "White-label driver app",
                "Custom reports",
                "Raw trip data export",
                "Multi-state SOS escalation",
                "99.9% uptime SLA",
                "Dedicated Account Manager",
                "Quarterly Business Reviews",
                "ERP/TMS integration",
                "Unlimited Fleet Manager accounts",
                "Priority support (2-hour response)",
            ],
        },
    ];

    const handleSelect = (planId: string) => {
        setSelectedPlan(planId);
        setSelectedCard(planId);
    };

    const handleContinue = () => {
        onNext({ plan: selectedPlan });
    };

    return (
        <div
            className="flex w-full max-w-full flex-col px-4 sm:px-8 md:px-12 lg:px-0"
            style={{ gap: "32px", paddingTop: "30px", paddingBottom: "30px" }}
        >
            {/* Header - Left Aligned */}
            <div className="text-left">
                <h2 className="text-3xl font-bold leading-[100%] text-black sm:text-4xl md:text-[40px]">
                    Pick a subscription
                </h2>
                <p className="mt-2 text-base text-[#8E98A8] sm:text-lg md:text-[18px]">
                    14-day free trial. Cancel anytime.
                </p>
            </div>

            {/* Plan Cards */}
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                {plans.map((plan) => {
                    const isSelected = selectedCard === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className="flex h-fit w-full flex-col rounded-2xl border-2 p-6 transition-all hover:shadow-lg sm:p-8"
                            style={{
                                borderColor: isSelected ? "#6E43A3" : "#E5E7EB",
                                backgroundColor: "white",
                                boxShadow: isSelected
                                    ? "0 8px 30px rgba(110, 67, 163, 0.15)"
                                    : "none",
                            }}
                        >
                            {/* Plan Name */}
                            <h3 className="text-2xl font-bold text-[#1F083B] sm:text-3xl">
                                {plan.name}
                            </h3>

                            {/* Description */}
                            <p className="mt-2 text-base text-[#8E98A8] sm:text-lg">
                                {plan.description}
                            </p>

                            {/* Price */}
                            <div className="my-4 sm:my-6">
                                <span className="text-3xl font-bold text-[#1F083B] sm:text-4xl">
                                    {plan.price}
                                </span>
                                {plan.id === "starter" && (
                                    <span className="ml-2 text-base text-[#8E98A8] sm:text-lg">
                                        /month
                                    </span>
                                )}
                                {plan.id === "pro" && (
                                    <span className="ml-2 text-base text-[#8E98A8] sm:text-lg">
                                        /month
                                    </span>
                                )}
                                {plan.id === "enterprise" && (
                                    <span className="ml-2 text-base text-[#8E98A8] sm:text-lg">
                                        /custom
                                    </span>
                                )}
                            </div>

                            {/* Select Button */}
                            <button
                                onClick={() => handleSelect(plan.id)}
                                className="w-full rounded-xl px-6 py-3.5 text-base font-semibold transition hover:opacity-80 sm:py-4 sm:text-lg"
                                style={{
                                    backgroundColor: isSelected
                                        ? "transparent"
                                        : "#1B235512",
                                    color: isSelected ? "#6E43A3" : "#1F083B",
                                    border: isSelected
                                        ? "2px solid #6E43A3"
                                        : "none",
                                    fontFamily: "Outfit",
                                }}
                            >
                                {isSelected ? "✓ Selected" : plan.buttonText}
                            </button>

                            {/* Features */}
                            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:gap-3.5">
                                {plan.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3"
                                    >
                                        <div
                                            className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                                            style={{
                                                backgroundColor: isSelected
                                                    ? "#6E43A3"
                                                    : "#13243A",
                                            }}
                                        >
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                            >
                                                <path
                                                    d="M2 6L5 9L10 3"
                                                    stroke="white"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </div>
                                        <span
                                            className="text-base"
                                            style={{
                                                color: isSelected
                                                    ? "#1F083B"
                                                    : "#7A8492",
                                                fontFamily: "Outfit",
                                            }}
                                        >
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Continue Button */}
            <div className="flex w-full justify-end pt-4">
                <button
                    onClick={handleContinue}
                    className="flex w-full items-center justify-center gap-3 rounded-xl px-8 py-4 text-base font-semibold text-white transition hover:opacity-90 sm:w-auto sm:px-12 sm:py-4 sm:text-lg"
                    style={{
                        backgroundColor: "#6E43A3",
                        borderRadius: "12px",
                        fontFamily: "Outfit",
                    }}
                >
                    Continue
                    <svg
                        width="22"
                        height="22"
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
                </button>
            </div>
        </div>
    );
};

export default PlanSelectionStep;
