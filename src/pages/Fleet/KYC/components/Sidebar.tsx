import React from "react";
import { Building2, LayoutDashboard, Truck, FileCheck } from "lucide-react";

interface SidebarProps {
    currentStep: number;
    steps: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentStep, steps }) => {
    const getIcon = (step: string, isActive: boolean) => {
        const color = isActive ? "#6E43A3" : "#9D9DAF";
        const size = 20;

        switch (step) {
            case "Company Information":
                return <Building2 size={size} color={color} />;
            case "Plan":
                return <LayoutDashboard size={size} color={color} />;
            case "Fleet Size":
                return <Truck size={size} color={color} />;
            case "Summary":
                return <FileCheck size={size} color={color} />;
            default:
                return <Building2 size={size} color={color} />;
        }
    };

    return (
        <div
            className="flex h-full flex-col bg-[#4A148C]"
            style={{
                width: "320px",
                borderWidth: "1px",
                borderRadius: "6px",
                padding: "40px 0px",
            }}
        >
            {/* Logo - Moved way more to the left */}
            <div className="pl-4 pb-8">
                <img
                    src="/images/logo-white.png"
                    alt="Logo"
                    style={{
                        width: "234.91903686523438px",
                        height: "40px",
                        objectFit: "contain",
                        opacity: 1,
                    }}
                />
            </div>

            {/* Divider Line */}
            <div
                className="w-full"
                style={{
                    height: "2px",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    marginBottom: "40px",
                }}
            />

            {/* Steps */}
            <div className="flex flex-1 flex-col px-6">
                {steps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={index} className="flex items-start">
                            {/* Left side - Icon and vertical line */}
                            <div
                                className="relative flex flex-col items-center"
                                style={{ width: "44px", flexShrink: 0 }}
                            >
                                {/* Icon Circle */}
                                <div
                                    className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full"
                                    style={{
                                        backgroundColor:
                                            isActive || isCompleted
                                                ? "white"
                                                : "transparent",
                                        border:
                                            isActive || isCompleted
                                                ? "2px solid #6E43A3"
                                                : "2px solid rgba(255,255,255,0.15)",
                                    }}
                                >
                                    {isActive || isCompleted
                                        ? getIcon(step, true)
                                        : getIcon(step, false)}
                                </div>

                                {/* Vertical Line - With MORE gap from circles */}
                                {!isLast && (
                                    <div
                                        className="mt-4"
                                        style={{
                                            width: "2px",
                                            height: "40px",
                                            position: "relative",
                                        }}
                                    >
                                        {/* Bottom half - always grey */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0"
                                            style={{
                                                height: "50%",
                                                background:
                                                    "rgba(255,255,255,0.1)",
                                            }}
                                        />

                                        {/* Top half - purple if completed or active */}
                                        <div
                                            className="absolute top-0 left-0 right-0"
                                            style={{
                                                height: "50%",
                                                background: isCompleted
                                                    ? "#6E43A3"
                                                    : isActive
                                                      ? "#6E43A3"
                                                      : "rgba(255,255,255,0.1)",
                                                transition:
                                                    "background 0.3s ease",
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right side - Step Text */}
                            <div className="ml-4 flex flex-col justify-center pt-1">
                                <div
                                    className="text-sm font-semibold"
                                    style={{
                                        color:
                                            isActive || isCompleted
                                                ? "white"
                                                : "rgba(255,255,255,0.4)",
                                        fontFamily: "Outfit",
                                    }}
                                >
                                    {step}
                                </div>
                                <div
                                    className="text-xs"
                                    style={{
                                        color: isActive
                                            ? "rgba(255,255,255,0.7)"
                                            : "rgba(255,255,255,0.3)",
                                        fontFamily: "Outfit",
                                    }}
                                >
                                    {isActive &&
                                        index === 0 &&
                                        "Tell us about your business"}
                                    {isActive &&
                                        index === 1 &&
                                        "Choose a subscription"}
                                    {isActive &&
                                        index === 2 &&
                                        "Enter your fleet size"}
                                    {isActive &&
                                        index === 3 &&
                                        "Review your selection"}
                                    {!isActive &&
                                        index === 0 &&
                                        "Company details"}
                                    {!isActive &&
                                        index === 1 &&
                                        "Subscription plan"}
                                    {!isActive &&
                                        index === 2 &&
                                        "Vehicle count"}
                                    {!isActive &&
                                        index === 3 &&
                                        "Review & confirm"}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom spacer */}
            <div className="mt-auto" />
        </div>
    );
};

export default Sidebar;
