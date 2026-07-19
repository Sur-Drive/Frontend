import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import CompanyDetailsStep from "./steps/CompanyDetailsStep";
import PlanSelectionStep from "./steps/PlanSelectionStep";
import FleetSizeStep from "./steps/FleetSizeStep";
import SubscriptionSummaryStep from "./steps/SubscriptionSummaryStep";
import { createCompany, submitKYC } from "../../../api/kyc";

const API_BASE = "https://backend-production-01de.up.railway.app";

const KYC: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [companyData, setCompanyData] = useState<any>({});
    const [planData, setPlanData] = useState<any>({});
    const [fleetData, setFleetData] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(false);

    const steps = ["Company Information", "Plan", "Fleet Size", "Summary"];

    const handleCompanyNext = async (data: any) => {
        setCompanyData(data);
        setCurrentStep(1);
    };

    const handlePlanNext = (data: any) => {
        setPlanData(data);
        setCurrentStep(2);
    };

    const handleFleetNext = (data: any) => {
        setFleetData(data);
        setCurrentStep(3);
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Step 1: Create the company
            const companyResponse = await createCompany({
                ...companyData,
                ...planData,
                ...fleetData,
            });

            // Step 2: Submit KYC
            await submitKYC();

            // Step 3: Initialize payment if not free trial
            if (planData.plan !== "free") {
                const token = localStorage.getItem("token");

                // Calculate amount based on plan and vehicle count
                const planPrices: Record<string, number> = {
                    starter: 2250,
                    pro: 3500,
                    enterprise: 0,
                };
                const pricePerVehicle = planPrices[planData.plan] || 0;
                const totalAmount =
                    pricePerVehicle * (fleetData.numberOfVehicles || 0);

                const paymentResponse = await fetch(
                    `${API_BASE}/payment/initialize`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            plan: planData.plan,
                            amount: totalAmount,
                        }),
                    },
                );

                const paymentData = await paymentResponse.json();

                if (!paymentResponse.ok) {
                    throw new Error(
                        paymentData.message || "Failed to initialize payment",
                    );
                }

                // Store return URL and redirect to payment
                if (paymentData.paymentUrl) {
                    localStorage.setItem("returnUrl", "/fleet/dashboard");
                    window.location.href = paymentData.paymentUrl;
                } else {
                    // If no payment URL, go to dashboard
                    navigate("/fleet/dashboard");
                }
            } else {
                // Free plan - go directly to dashboard
                navigate("/fleet/dashboard");
            }
        } catch (error) {
            console.error("Failed to complete KYC:", error);
            // Show error to user
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <CompanyDetailsStep onNext={handleCompanyNext} />;
            case 1:
                return <PlanSelectionStep onNext={handlePlanNext} />;
            case 2:
                return (
                    <FleetSizeStep
                        onNext={handleFleetNext}
                        plan={planData.plan || "free"}
                    />
                );
            case 3:
                return (
                    <SubscriptionSummaryStep
                        data={{ ...planData, ...fleetData }}
                        onComplete={handleComplete}
                        onBack={() => setCurrentStep(1)}
                        loading={loading}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <div className="h-full flex-shrink-0">
                <Sidebar currentStep={currentStep} steps={steps} />
            </div>

            {/* Main Content */}
            <div className="flex flex-1 items-start justify-center overflow-y-auto bg-white p-8">
                <div
                    className={`w-full ${currentStep === 1 ? "max-w-[1200px] px-4" : "max-w-[740px]"}`}
                >
                    {renderStep()}
                </div>
            </div>
        </div>
    );
};

export default KYC;
