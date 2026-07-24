import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailStep from "../Auth/ForgotPassword/EmailStep";
import OtpStep from "../Auth/ForgotPassword/OtpStep";
import ResetPasswordStep from "../Auth/ForgotPassword/ResetPasswordStep";

import RightPanel from "../Auth/ForgotPassword/RightPanel";
import LeftPanel from "../Auth/ForgotPassword/LeftPanel";

interface ForgotPasswordState {
    currentStep: "email" | "otp" | "reset";
    email: string;
    otp: string;
    sessionId: string;
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
}

const ManagerForgotPassword: React.FC = () => {
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
        navigate("/manager");
    };

    const handleBackToLogin = () => {
        navigate("/manager");
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
        <div className="flex h-screen w-full overflow-hidden">
            {/* Left Panel */}
            <div className="hidden lg:block lg:w-1/2 h-full flex-shrink-0">
                <LeftPanel logoUrl="/images/logo-white.png" />
            </div>

            {/* Right Panel */}
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

            {/* Success Modal */}
            {state.isSuccess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
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
                        <h3
                            className="text-2xl font-bold text-[#1F083B] mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Password Reset Successfully
                        </h3>
                        <p
                            className="text-[#5B646F] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Your password has been reset. You can now login with
                            your new password.
                        </p>
                        <button
                            onClick={handleComplete}
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
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

export default ManagerForgotPassword;
