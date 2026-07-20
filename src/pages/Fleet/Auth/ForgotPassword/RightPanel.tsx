import React from "react";
import { AlertCircle } from "lucide-react";

interface RightPanelProps {
    children: React.ReactNode;
    progressSteps: string[];
    currentStep: string;
    error: string | null;
    isLoading: boolean;
}

const RightPanel: React.FC<RightPanelProps> = ({
    children,
    progressSteps,
    currentStep,
    error,
    isLoading,
}) => {
    const stepLabels: Record<string, string> = {
        email: "Enter Email",
        otp: "Verify OTP",
        reset: "Reset Password",
    };

    const currentIndex = progressSteps.indexOf(currentStep);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white">
            {/* Progress Steps */}
            <div className="w-full max-w-[520px] mb-8">
                <div className="flex items-center justify-between">
                    {progressSteps.map((step, index) => (
                        <div key={step} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${
                                    index <= currentIndex
                                        ? "bg-[#6E43A3] text-white"
                                        : "bg-[#E5E7EB] text-[#8E98A8]"
                                }`}
                                style={{ fontFamily: "Outfit" }}
                            >
                                {index + 1}
                            </div>
                            {index < progressSteps.length - 1 && (
                                <div
                                    className={`w-16 h-0.5 mx-2 transition ${
                                        index < currentIndex
                                            ? "bg-[#6E43A3]"
                                            : "bg-[#E5E7EB]"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                    {progressSteps.map((step) => (
                        <span
                            key={step}
                            className={`text-xs font-medium ${
                                progressSteps.indexOf(step) <= currentIndex
                                    ? "text-[#6E43A3]"
                                    : "text-[#8E98A8]"
                            }`}
                            style={{ fontFamily: "Outfit" }}
                        >
                            {stepLabels[step]}
                        </span>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="w-full max-w-[520px] mb-4 p-3 bg-[#FE3F2124] rounded-xl flex items-center gap-2">
                    <AlertCircle
                        size={16}
                        className="text-[#FE3F21] flex-shrink-0"
                    />
                    <p
                        className="text-sm text-[#FE3F21]"
                        style={{ fontFamily: "Outfit" }}
                    >
                        {error}
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="w-full">{children}</div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E43A3]" />
                        <p
                            className="mt-4 text-[#8E98A8] text-sm"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Processing...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RightPanel;
