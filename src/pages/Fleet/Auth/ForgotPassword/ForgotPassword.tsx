import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OtpStep from "./OtpStep";
import EmailStep from "./EmailStep";
import ResetPasswordStep from "./ResetPasswordStep";
import RightPanel from "./RightPanel";
import LeftPanel from "./LeftPanel";

interface ForgotPasswordState {
    currentStep: "email" | "otp" | "reset";
    email: string;
    otp: string;
    sessionId: string;
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
}

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [state, setState] = useState<ForgotPasswordState>({
        currentStep: "email",
        email: "",
        otp: "",
        sessionId: "",
        isLoading: false,
        error: null,
        isSuccess: false,
    });

    const updateState = (updates: Partial<ForgotPasswordState>) => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    const handleEmailSuccess = (email: string, sessionId: string) => {
        updateState({
            email,
            sessionId,
            currentStep: "otp",
            error: null,
        });
    };

    const handleOtpSuccess = (otp: string) => {
        updateState({
            otp,
            currentStep: "reset",
            error: null,
        });
    };

    const handleResetSuccess = () => {
        updateState({ isSuccess: true });
    };

    const handleComplete = () => {
        navigate("/fleet");
    };

    const handleBackToLogin = () => {
        navigate("/fleet");
    };

    const steps = ["email", "otp", "reset"];

    const renderStep = () => {
        switch (state.currentStep) {
            case "email":
                return (
                    <EmailStep
                        onSuccess={handleEmailSuccess}
                        onError={(error) => updateState({ error })}
                        setLoading={(loading) =>
                            updateState({ isLoading: loading })
                        }
                        onBack={handleBackToLogin}
                    />
                );
            case "otp":
                return (
                    <OtpStep
                        email={state.email}
                        sessionId={state.sessionId}
                        onSuccess={handleOtpSuccess}
                        onError={(error) => updateState({ error })}
                        setLoading={(loading) =>
                            updateState({ isLoading: loading })
                        }
                        onBack={() => updateState({ currentStep: "email" })}
                    />
                );
            case "reset":
                return (
                    <ResetPasswordStep
                        sessionId={state.sessionId}
                        onSuccess={handleResetSuccess}
                        onError={(error) => updateState({ error })}
                        setLoading={(loading) =>
                            updateState({ isLoading: loading })
                        }
                        onBack={() => updateState({ currentStep: "otp" })}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden md:flex-row">
            {/* Left Panel - Hidden on mobile, visible on tablet+ */}
            <div className="hidden md:block md:w-2/5 lg:w-1/2 h-full flex-shrink-0">
                <LeftPanel logoUrl="/images/logo-white.png" />
            </div>

            {/* Right Panel - Full width on mobile */}
            <div className="flex-1 h-full overflow-y-auto">
                <RightPanel
                    progressSteps={steps}
                    currentStep={state.currentStep}
                    error={state.error}
                    isLoading={state.isLoading}
                >
                    {renderStep()}
                </RightPanel>
            </div>

            {/* Success Modal - Responsive */}
            {state.isSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D6F5DA]">
                            <svg
                                className="h-8 w-8 text-[#267F50]"
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
                        <h3
                            className="mb-2 text-xl font-bold text-[#1F083B] sm:text-2xl"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Password Reset Successfully
                        </h3>
                        <p
                            className="mb-6 text-sm text-[#5B646F] sm:text-base"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Your password has been reset. You can now login with
                            your new password.
                        </p>
                        <button
                            onClick={handleComplete}
                            className="w-full rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Login Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;
