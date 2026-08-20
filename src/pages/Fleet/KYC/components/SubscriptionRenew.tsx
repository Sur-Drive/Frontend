import React, { useState, useEffect } from "react";
import {
    AlertCircle,
    Calendar,
    CreditCard,
    ArrowRight,
    CheckCircle,
    Loader2,
} from "lucide-react";
import BlurSidebar from "../../Dashboard/BlurSidebar";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface Subscription {
    id: string;
    plan: string;
    status: "active" | "expired" | "pending" | "cancelled";
    billingCycle: string;
    pricePerVehicle: number;
    totalPrice: number;
    startDate: string;
    endDate: string;
    vehicleLimit: number;
    vehicleCount: number;
    minVehicles: number;
    features: Record<string, any>;
    paymentReference: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    paidAt: string | null;
}

interface Company {
    id: string;
    companyName: string;
    fleetName: string;
    plan: string;
    numberOfVehicles: number;
    subscriptions: Subscription[];
}

const SubscriptionRenew: React.FC = () => {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<string>("pro");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [company, setCompany] = useState<Company | null>(null);
    const [activeSubscription, setActiveSubscription] =
        useState<Subscription | null>(null);
    const [error, setError] = useState<string | null>(null);

    const plans = [
        {
            id: "starter",
            name: "Starter Fleet",
            price: "₦2,250/vehicle",
            minVehicles: 10,
            description:
                "For growing logistics teams that need real-time insight.",
            pricePerVehicle: 2250,
        },
        {
            id: "pro",
            name: "Pro Fleet",
            price: "₦3,500/vehicle",
            minVehicles: 30,
            description:
                "For growing logistics teams that need real-time insight.",
            pricePerVehicle: 3500,
        },
        {
            id: "enterprise",
            name: "Enterprise Fleet",
            price: "Contact us",
            minVehicles: 50,
            description: "Custom solutions for large teams & organizations.",
            pricePerVehicle: 0,
        },
    ];

    // Fetch company and subscription data
    const fetchCompanyData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/company`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch company data");
            }

            const data = await response.json();
            setCompany(data);

            // Find the expired or most recent subscription
            const expiredSub = data.subscriptions?.find(
                (sub: Subscription) => sub.status === "expired",
            );
            const activeSub = data.subscriptions?.find(
                (sub: Subscription) => sub.status === "active",
            );
            const pendingSub = data.subscriptions?.find(
                (sub: Subscription) => sub.status === "pending",
            );

            setActiveSubscription(
                expiredSub || activeSub || pendingSub || null,
            );

            // Set the selected plan to the current plan
            if (expiredSub || activeSub) {
                const currentPlan =
                    expiredSub?.plan || activeSub?.plan || "pro";
                setSelectedPlan(currentPlan);
            }
        } catch (error) {
            console.error("Error fetching company:", error);
            setError("Failed to load subscription data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const handleRenewSubscription = async () => {
        try {
            setSubmitting(true);
            setError(null);
            const token = localStorage.getItem("token");

            // The renew endpoint doesn't accept a plan field
            // It renews with the existing plan
            const payload = {}; // Empty payload

            console.log("📤 Sending renewal request (no payload needed)");

            const response = await fetch(
                `${API_BASE}/fleet/subscription/renew`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );

            const data = await response.json();
            console.log("📥 Renewal response:", data);

            if (!response.ok) {
                throw new Error(data.message || "Failed to renew subscription");
            }

            // Handle the response based on the backend structure
            const paymentRequired =
                data.paymentRequired || data.data?.paymentRequired || false;
            const paymentUrl = data.paymentUrl || data.data?.paymentUrl;
            const paymentReference =
                data.paymentReference || data.data?.paymentReference;
            const subscription = data.subscription || data.data?.subscription;
            const isFreeTrial =
                data.isFreeTrial || data.data?.isFreeTrial || false;
            const message = data.message || data.data?.message || "";

            console.log("🔗 Payment Required:", paymentRequired);
            console.log("🔗 Payment URL:", paymentUrl);
            console.log("📝 Payment Reference:", paymentReference);
            console.log("📝 Message:", message);

            // If payment is required and we have a URL, redirect to payment
            if (paymentRequired && paymentUrl) {
                localStorage.setItem("returnUrl", "/fleet/dashboard");
                if (paymentReference) {
                    localStorage.setItem("paymentReference", paymentReference);
                }
                // Redirect to payment
                window.location.href = paymentUrl;
            } else if (!paymentRequired || isFreeTrial) {
                // Free trial or no payment required - subscription activated immediately
                console.log(
                    "✅ Subscription renewed successfully (no payment required)",
                );
                localStorage.setItem("subscriptionStatus", "active");
                // Show success message and redirect
                alert(message || "Subscription renewed successfully!");
                window.location.href = "/fleet/dashboard";
            } else {
                // Something went wrong - no payment URL but payment is required
                console.error(
                    "❌ Payment required but no payment URL provided",
                );
                setError("Unable to initialize payment. Please try again.");
            }
        } catch (error: any) {
            console.error("❌ Error renewing subscription:", error);
            setError(
                error.message ||
                    "Failed to renew subscription. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate total price based on selected plan and vehicle count
    const getTotalPrice = () => {
        const plan = plans.find((p) => p.id === selectedPlan);
        if (!plan || !company) return 0;
        return plan.pricePerVehicle * (company.numberOfVehicles || 1);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex items-center gap-2 text-[#6E43A3]">
                        <Loader2 className="animate-spin" size={24} />
                        <span>Loading subscription details...</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-4xl mx-auto w-full">
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-[#FE3F2124] flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={24} className="text-[#FE3F21]" />
                        </div>
                        <div>
                            <h1
                                className="text-xl sm:text-2xl font-bold text-[#1F083B]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Subscription Expired
                            </h1>
                            <p
                                className="text-sm sm:text-base text-[#5B646F]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Your subscription has expired. Please renew to
                                continue accessing your fleet.
                            </p>
                        </div>
                    </div>

                    {/* Company info */}
                    {company && (
                        <div className="bg-[#F8F8F8] rounded-xl p-4 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <span className="text-sm text-[#8E98A8]">
                                        Company
                                    </span>
                                    <p className="font-semibold text-[#1F083B]">
                                        {company.companyName ||
                                            company.fleetName}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-[#8E98A8]">
                                        Current Vehicles
                                    </span>
                                    <p className="font-semibold text-[#1F083B]">
                                        {company.numberOfVehicles || 0}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-[#8E98A8]">
                                        Current Plan
                                    </span>
                                    <p className="font-semibold text-[#1F083B] capitalize">
                                        {company.plan || "None"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Current subscription details */}
                    {activeSubscription && (
                        <div className="bg-[#FFF5F5] border border-[#FE3F2124] rounded-xl p-4 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar
                                        size={16}
                                        className="text-[#FE3F21]"
                                    />
                                    <span
                                        className="text-sm text-[#5B646F]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {activeSubscription.status === "expired"
                                            ? "Expired"
                                            : "Current"}{" "}
                                        on{" "}
                                        <strong className="text-[#1F083B]">
                                            {new Date(
                                                activeSubscription.endDate,
                                            ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </strong>
                                    </span>
                                </div>
                                <span className="text-sm text-[#8E98A8]">
                                    • {activeSubscription.plan.toUpperCase()}{" "}
                                    Plan
                                </span>
                                <span
                                    className={`text-sm px-2 py-0.5 rounded-full ${
                                        activeSubscription.status === "expired"
                                            ? "bg-[#FE3F2124] text-[#FE3F21]"
                                            : "bg-[#2E7D3224] text-[#2E7D32]"
                                    }`}
                                >
                                    {activeSubscription.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                                <span className="text-[#5B646F]">
                                    Vehicles:{" "}
                                    <strong>
                                        {activeSubscription.vehicleCount}
                                    </strong>
                                </span>
                                <span className="text-[#5B646F]">
                                    Price:{" "}
                                    <strong>
                                        ₦
                                        {activeSubscription.totalPrice.toLocaleString()}
                                    </strong>
                                </span>
                                {activeSubscription.paymentReference && (
                                    <span className="text-[#5B646F]">
                                        Ref:{" "}
                                        <strong className="text-xs">
                                            {
                                                activeSubscription.paymentReference
                                            }
                                        </strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-[#F0F7FF] rounded-xl p-4 mb-6 border border-[#6E43A320]">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                <AlertCircle
                                    size={16}
                                    className="text-[#6E43A3] flex-shrink-0"
                                />
                            </div>
                            <div>
                                <p
                                    className="text-sm text-[#5B646F]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    You are renewing your current plan:{" "}
                                    <strong className="text-[#1F083B]">
                                        {activeSubscription?.plan?.toUpperCase() ||
                                            "PRO"}
                                    </strong>
                                </p>
                                <p className="text-xs text-[#8E98A8] mt-1">
                                    To change your plan, please visit the
                                    Billing page.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRenewSubscription}
                        disabled={submitting}
                        className={`w-full px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 ${
                            submitting
                                ? "bg-[#8E98A8] text-white cursor-not-allowed"
                                : "bg-[#6E43A3] text-white hover:opacity-90"
                        }`}
                        style={{ fontFamily: "Outfit" }}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard size={18} />
                                Renew Subscription
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="mt-4 p-3 bg-[#FE3F2124] rounded-lg">
                            <p
                                className="text-sm text-[#FE3F21]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <button
                            onClick={() => navigate("/fleet/billing")}
                            className="text-sm text-[#6E43A3] hover:underline transition"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Want to change your plan? Go to Billing →
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return <BlurSidebar status="expired">{renderContent()}</BlurSidebar>;
};

export default SubscriptionRenew;
