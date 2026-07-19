import React, { useState } from "react";

interface PlanSelectionStepProps {
    onNext: (data: any) => void;
}

const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({ onNext }) => {
    const [selectedPlan, setSelectedPlan] = useState<string>("free");
    const [selectedCard, setSelectedCard] = useState<string>("free");

    const plans = [
        {
            id: "free",
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
            className="flex w-full flex-col"
            style={{ gap: "32px", paddingTop: "20px", paddingBottom: "20px" }}
        >
            {/* Header - Left Aligned */}
            <div className="text-left">
                <h2
                    className="text-[40px] font-bold leading-[100%] text-black"
                    style={{ fontFamily: "Outfit" }}
                >
                    Pick a subscription
                </h2>
                <p
                    className="text-[#8E98A8]"
                    style={{ fontFamily: "Outfit", fontSize: "18px" }}
                >
                    14-day free trial. Cancel anytime.
                </p>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {plans.map((plan) => {
                    const isSelected = selectedCard === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className="flex flex-col rounded-xl border p-6 transition-all w-full h-fit"
                            style={{
                                borderColor: isSelected ? "#6E43A3" : "#E5E7EB",
                                backgroundColor: "white",
                                boxShadow: isSelected
                                    ? "0 4px 20px rgba(110, 67, 163, 0.15)"
                                    : "none",
                            }}
                        >
                            {/* Plan Name */}
                            <h3
                                className="text-2xl font-bold text-[#1F083B]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {plan.name}
                            </h3>

                            {/* Description */}
                            <p
                                className="mt-2 text-sm text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {plan.description}
                            </p>

                            {/* Price */}
                            <div className="my-4">
                                <span
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {plan.price}
                                </span>
                            </div>

                            {/* Select Button - Changes to "Selected" when clicked */}
                            <button
                                onClick={() => handleSelect(plan.id)}
                                className="w-full rounded-xl px-6 py-3 font-semibold transition"
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
                                {isSelected ? "Selected" : plan.buttonText}
                            </button>

                            {/* Features */}
                            <div className="mt-4 flex flex-col gap-2">
                                {plan.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-2"
                                    >
                                        <div
                                            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                                            style={{
                                                backgroundColor: isSelected
                                                    ? "#6E43A3"
                                                    : "#13243A",
                                            }}
                                        >
                                            <svg
                                                width="12"
                                                height="12"
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
                                            className="text-sm"
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
            <div className="flex justify-end w-full">
                <button
                    onClick={handleContinue}
                    className="rounded-xl px-10 py-3 text-white transition hover:opacity-90 flex items-center gap-2"
                    style={{
                        backgroundColor: "#6E43A3",
                        width: "188px",
                        height: "56px",
                        borderRadius: "12px",
                        fontFamily: "Outfit",
                        fontSize: "16px",
                        fontWeight: 600,
                        justifyContent: "center",
                    }}
                >
                    Continue
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
                </button>
            </div>
        </div>
    );
};

export default PlanSelectionStep;
