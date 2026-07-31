import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LeftPanel from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";
import EmailStep from "./components/EmailStep";
import OtpStep from "./components/OtpStep";
import PersonalInfoStep from "./components/PersonalInfoStep";
import PasswordStep from "./components/PasswordStep";

import SuccessModal from "./components/SuccessModal";
import { type FleetRegistrationState } from "./types/fleet.types";
import LoginStep from "./KYC/components/LoginStep";

const FleetRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [state, setState] = useState<FleetRegistrationState>({
        currentStep: "email",
        email: "",
        otp: "",
        personalInfo: null,
        password: "",
        isLoading: false,
        error: null,
        isSuccess: false,
        otpTimer: 300,
    });

    const [showLogin, setShowLogin] = useState(false);

    const updateState = (updates: Partial<FleetRegistrationState>) => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    const steps = ["email", "otp", "personal", "password"];

    const handleEmailSuccess = (email: string) => {
        updateState({ email, currentStep: "otp", error: null });
    };

    const handleOtpSuccess = (otp: string) => {
        updateState({ otp, currentStep: "personal", error: null });
    };

    const handlePersonalSuccess = (data: any) => {
        updateState({
            personalInfo: data,
            currentStep: "password",
            error: null,
        });
    };

    const handlePasswordSuccess = () => {
        updateState({ isSuccess: true });
    };

    const handleLoginRedirect = (path: string) => {
        navigate(path);
    };

    const handleComplete = () => {
        navigate("/fleet/kyc");
    };

    const renderStep = () => {
        if (showLogin) {
            return (
                <LoginStep
                    onSuccess={(data) => console.log("Login success:", data)}
                    onError={(error) => updateState({ error })}
                    setLoading={(loading) =>
                        updateState({ isLoading: loading })
                    }
                    onRedirect={handleLoginRedirect}
                />
            );
        }

        switch (state.currentStep) {
            case "email":
                return (
                    <EmailStep
                        onSuccess={handleEmailSuccess}
                        onError={(error) => updateState({ error })}
                        setLoading={(loading) =>
                            updateState({ isLoading: loading })
                        }
                    />
                );
            case "otp":
                return (
                    <OtpStep
                        email={state.email}
                        onSuccess={handleOtpSuccess}
                        onError={(error) => updateState({ error })}
                        setLoading={(loading) =>
                            updateState({ isLoading: loading })
                        }
                    />
                );
            case "personal":
                return (
                    <PersonalInfoStep
                        onSuccess={handlePersonalSuccess}
                        onError={(error) => updateState({ error })}
                        setLoading={(loading) =>
                            updateState({ isLoading: loading })
                        }
                    />
                );
            case "password":
                return (
                    <PasswordStep
                        onSuccess={handlePasswordSuccess}
                        onError={(error) => updateState({ error })}
                        setLoading={(loading) =>
                            updateState({ isLoading: loading })
                        }
                    />
                );
            default:
                return null;
        }
    };

    // Get current step for progress indicator
    const getCurrentStep = () => {
        if (showLogin) return "login";
        return state.currentStep;
    };

    const allSteps = showLogin ? ["login"] : steps;

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Left Panel */}
            <div className="hidden lg:block lg:w-1/2 h-full flex-shrink-0">
                <LeftPanel logoUrl="/images/logo-white.png" />
            </div>

            {/* Right Panel */}
            <div className="flex-1 h-full overflow-y-auto">
                <RightPanel
                    progressSteps={allSteps}
                    currentStep={getCurrentStep()}
                    error={state.error}
                    isLoading={state.isLoading}
                >
                    {/* Toggle between Login and Signup */}
                    <div className="mb-4 flex w-full justify-center gap-4">
                        <button
                            onClick={() => setShowLogin(false)}
                            className={`px-6 py-2 text-sm font-medium transition ${
                                !showLogin
                                    ? "border-b-2 border-[#6E43A3] text-[#6E43A3]"
                                    : "text-[#8E98A8] hover:text-[#1F083B]"
                            }`}
                            style={{ fontFamily: "Outfit" }}
                        >
                            Sign Up
                        </button>
                        <button
                            onClick={() => setShowLogin(true)}
                            className={`px-6 py-2 text-sm font-medium transition ${
                                showLogin
                                    ? "border-b-2 border-[#6E43A3] text-[#6E43A3]"
                                    : "text-[#8E98A8] hover:text-[#1F083B]"
                            }`}
                            style={{ fontFamily: "Outfit" }}
                        >
                            Login
                        </button>
                    </div>

                    {renderStep()}
                </RightPanel>
            </div>

            {/* Success Modal */}
            {state.isSuccess && <SuccessModal onComplete={handleComplete} />}
        </div>
    );
};

export default FleetRegistration;
