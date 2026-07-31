import React, { type ReactNode } from "react";

interface RightPanelProps {
    children: ReactNode;
    className?: string;
    progressSteps?: string[];
    currentStep?: string;
    error?: string | null;
    isLoading?: boolean;
}

const RightPanel: React.FC<RightPanelProps> = ({
    children,
    className = "",
    progressSteps = [],
    currentStep = "",
    error = null,
    isLoading = false,
}) => {
    return (
        <div
            className={`flex h-full w-full items-start justify-center bg-white overflow-y-auto ${className}`}
        >
            <div
                className="flex flex-col items-center px-4 py-8 w-full"
                style={{
                    maxWidth: "520px",
                    gap: "40px",
                }}
            >
                {/* Progress Indicator */}
                {progressSteps.length > 0 && (
                    <div className="flex w-full justify-center gap-2">
                        {progressSteps.map((step) => (
                            <div
                                key={step}
                                className="h-1 rounded-full transition-all duration-300"
                                style={{
                                    width: "64px",
                                    backgroundColor:
                                        currentStep === step
                                            ? "#6E43A3"
                                            : "#E5E7EB",
                                    opacity: currentStep === step ? 1 : 0.5,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="w-full rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="w-full">{children}</div>

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                        <div className="rounded-xl bg-white p-6 shadow-xl">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6E43A3] border-t-transparent" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightPanel;
