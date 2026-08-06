import React, { useState, useEffect } from "react";
import {
    Building2,
    LayoutDashboard,
    Truck,
    FileCheck,
    Menu,
    X,
} from "lucide-react";

interface SidebarProps {
    currentStep: number;
    steps: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentStep, steps }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setIsMobileOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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
        <>
            {/* Mobile Hamburger Button */}
            {isMobile && (
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="fixed left-4 top-4 z-50 rounded-lg bg-[#4A148C] p-2.5 text-white shadow-lg transition hover:bg-[#6E43A3] active:scale-95"
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>
            )}

            {/* Mobile Overlay */}
            {isMobile && isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    flex h-full flex-col bg-[#4A148C]
                    transition-all duration-300 ease-in-out
                    ${isMobile ? "fixed left-0 top-0 z-50 h-screen" : "relative"}
                    ${isMobile && !isMobileOpen ? "-translate-x-full" : "translate-x-0"}
                    ${isMobile ? "w-[280px]" : "w-full max-w-[320px]"}
                `}
                style={{
                    borderWidth: "1px",
                    borderRadius: isMobile ? "0" : "6px",
                    paddingTop: "40px",
                    paddingBottom: "40px",
                }}
            >
                {/* Mobile Close Button */}
                {isMobile && (
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="absolute right-4 top-4 rounded-lg p-2 text-white transition hover:bg-white/10"
                        aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>
                )}

                {/* Logo */}
                <div className="mb-6 px-4 sm:mb-8 sm:pl-4 md:pl-4">
                    <img
                        src="/images/logo-white.png"
                        alt="Logo"
                        className="h-8 w-auto object-contain opacity-100 sm:h-10"
                        style={{
                            maxWidth: isMobile ? "160px" : "180px",
                        }}
                    />
                </div>

                {/* Divider Line */}
                <div
                    className="mb-6 w-full sm:mb-8 md:mb-10"
                    style={{
                        height: "2px",
                        backgroundColor: "rgba(255,255,255,0.15)",
                    }}
                />

                {/* Steps */}
                <div className="flex flex-1 flex-col gap-2 px-4 sm:px-4 md:px-6">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        const isLast = index === steps.length - 1;

                        return (
                            <div key={index} className="flex items-start">
                                {/* Left side - Icon and vertical line */}
                                <div
                                    className="relative flex flex-col items-center flex-shrink-0"
                                    style={{ width: "44px" }}
                                >
                                    {/* Icon Circle */}
                                    <div
                                        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full sm:h-11 sm:w-11"
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

                                    {/* Vertical Line */}
                                    {!isLast && (
                                        <div
                                            className="mt-3 sm:mt-4"
                                            style={{
                                                width: "2px",
                                                height: "32px",
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
                                <div className="ml-3 flex flex-col justify-center pt-0.5 sm:ml-4">
                                    <div
                                        className="text-xs font-semibold sm:text-sm"
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
                                        className="text-[10px] sm:text-xs"
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

            {/* Spacer for mobile when sidebar is hidden */}
            {isMobile && !isMobileOpen && <div className="h-14" />}
        </>
    );
};

export default Sidebar;
