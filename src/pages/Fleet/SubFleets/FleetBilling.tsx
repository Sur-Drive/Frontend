import React, { useState, useEffect } from "react";
import {
    CheckCircle,
    ChevronRight,
    Download,
    AlertCircle,
    Calendar,
    Truck,
    Users,
    ArrowRight,
    X,
    Check,
    Plus,
    Minus,
    Info,
} from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface Subscription {
    id: string;
    plan: string;
    status: "active" | "expired" | "pending" | "cancelled";
    billingCycle: string;
    pricePerVehicle: string;
    totalPrice: string;
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

interface VehicleUsage {
    limit: number;
    current: number;
    remaining: number;
    plan: string;
    isFreeTrial: boolean;
    message: string;
}

const Billing: React.FC = () => {
    const [company, setCompany] = useState<Company | null>(null);
    const [activeSubscription, setActiveSubscription] =
        useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [showChangePlanModal, setShowChangePlanModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [newVehicleCount, setNewVehicleCount] = useState<number>(10);
    const [showIncreaseModal, setShowIncreaseModal] = useState(false);
    const [increaseVehicleCount, setIncreaseVehicleCount] =
        useState<number>(10);
    const [isIncreasing, setIsIncreasing] = useState(false);
    const [usage, setUsage] = useState<VehicleUsage | null>(null);

    const allPlans = [
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

    // Fetch company data
    const fetchCompany = async () => {
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

            // Find active subscription
            const active = data.subscriptions?.find(
                (sub: Subscription) => sub.status === "active",
            );
            setActiveSubscription(active || null);
        } catch (error) {
            console.error("Error fetching company:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompany();
    }, []);

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return "-";
        }
    };

    // Format currency
    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(amount));
    };

    // Get plan display name
    const getPlanDisplayName = (planId: string) => {
        const plan = allPlans.find((p) => p.id === planId);
        return plan
            ? plan.name
            : planId.charAt(0).toUpperCase() + planId.slice(1);
    };

    // Get current plan features
    const getCurrentPlanFeatures = () => {
        const planId = activeSubscription?.plan || company?.plan || "starter";
        const plan = allPlans.find((p) => p.id === planId);
        return plan?.features || [];
    };

    const getCurrentPlanDescription = () => {
        const planId = activeSubscription?.plan || company?.plan || "starter";
        const plan = allPlans.find((p) => p.id === planId);
        return plan?.description || "";
    };

    // Fetch vehicle usage
    const fetchVehicleUsage = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/vehicles/usage`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                console.warn("Vehicle usage endpoint not available");
                setUsage(null);
                return;
            }

            const data = await response.json();
            setUsage(data);
        } catch (error) {
            console.warn("Failed to fetch vehicle usage:", error);
            setUsage(null);
        }
    };

    const handlePlanChange = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");

            const selectedPlanData = allPlans.find(
                (p) => p.id === selectedPlan,
            );

            const response = await fetch(`${API_BASE}/fleet/plan/change`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    newPlan: selectedPlan,
                    newVehicleCount: newVehicleCount, // Use the state value
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to change plan");
            }

            setShowChangePlanModal(false);

            if (data.paymentRequired && data.paymentUrl) {
                localStorage.setItem("returnUrl", window.location.pathname);
                window.location.href = data.paymentUrl;
            } else {
                setSuccessMessage(
                    `Successfully switched to ${selectedPlanData?.name || selectedPlan} plan!`,
                );
                setShowSuccessModal(true);
                fetchCompany();
            }
        } catch (error: any) {
            console.error("Error changing plan:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIncreaseFleet = async () => {
        try {
            setIsIncreasing(true);
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE}/fleet/vehicles/update-count`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        newVehicleCount: increaseVehicleCount,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update vehicle count",
                );
            }

            setShowIncreaseModal(false);

            if (data.paymentRequired && data.paymentUrl) {
                localStorage.setItem("returnUrl", window.location.pathname);
                window.location.href = data.paymentUrl;
            } else {
                setSuccessMessage("Vehicle count updated successfully!");
                setShowSuccessModal(true);
                fetchCompany();
                fetchVehicleUsage();
            }
        } catch (error: any) {
            console.error("Error increasing fleet size:", error);
        } finally {
            setIsIncreasing(false);
        }
    };

    // Get status badge color
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return "bg-[#2E7D3224] text-[#2E7D32]";
            case "expired":
                return "bg-[#FE3F2124] text-[#FE3F21]";
            case "pending":
                return "bg-[#F2A61824] text-[#F2A618]";
            default:
                return "bg-gray-100 text-gray-500";
        }
    };

    const capitalizeFirstLetter = (str: string | undefined) => {
        if (!str) return "Monthly";
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F7F7] p-6 flex items-center justify-center">
                <div className="text-[#8E98A8]">Loading...</div>
            </div>
        );
    }

    const currentPlanFeatures = getCurrentPlanFeatures();
    const halfLength = Math.ceil(currentPlanFeatures.length / 2);
    const leftFeatures = currentPlanFeatures.slice(0, halfLength);
    const rightFeatures = currentPlanFeatures.slice(halfLength);

    return (
        <div className="min-h-screen bg-[#F7F7F7] p-6">
            <div className="max-w-[1126px] mx-auto space-y-6">
                {/* Header */}

                <div className="bg-white rounded-xl p-6 flex justify-between items-center">
                    <div>
                        <h1
                            className="text-2xl font-bold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Billing & Subscription
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className="text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Nigeria pricing · per vehicle / month
                            </span>
                        </div>
                    </div>
                </div>

                {/* Current Plan Section */}
                <div className="bg-white rounded-2xl p-8">
                    <div className="flex justify-between items-start mb-6">
                        <h2
                            className="text-xl font-bold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Current Plan
                        </h2>
                        <button
                            onClick={() => {
                                setIncreaseVehicleCount(
                                    company?.numberOfVehicles || 10,
                                );
                                setShowIncreaseModal(true);
                            }}
                            className="px-6 py-2.5 bg-[#6E43A3] text-white rounded-xl hover:opacity-90 transition font-medium text-sm flex items-center gap-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            <Plus size={16} />
                            Increase Fleet Size
                        </button>
                    </div>

                    {/* Current Plan Card */}
                    <div className="bg-[#F8F8F8] rounded-2xl p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {getPlanDisplayName(
                                        activeSubscription?.plan ||
                                            company?.plan ||
                                            "starter",
                                    )}
                                </h3>
                                <div className="flex items-center gap-6 mt-2">
                                    <div>
                                        <p
                                            className="text-sm text-[#7A8492]"
                                            style={{
                                                fontFamily: "Outfit",
                                                fontWeight: 400,
                                                fontSize: "16px",
                                                lineHeight: "150%",
                                            }}
                                        >
                                            {getCurrentPlanDescription()}
                                        </p>
                                        <div className="flex items-end gap-1 mt-1">
                                            <span
                                                className="font-semibold text-[#170F49]"
                                                style={{
                                                    fontFamily: "Inter",
                                                    fontWeight: 600,
                                                    fontSize: "36px",
                                                    lineHeight: "115%",
                                                }}
                                            >
                                                {activeSubscription
                                                    ? formatCurrency(
                                                          activeSubscription.totalPrice,
                                                      )
                                                    : "₦0"}
                                            </span>
                                            <span
                                                className="text-[#A0A3BD]"
                                                style={{
                                                    fontFamily: "Outfit",
                                                    fontWeight: 400,
                                                    fontSize: "20px",
                                                    lineHeight: "115%",
                                                }}
                                            >
                                                /month
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-8 w-px bg-[#E0E5EB]" />
                                </div>
                            </div>
                            <div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(activeSubscription?.status || "")}`}
                                >
                                    {activeSubscription?.status?.toUpperCase() ||
                                        "ACTIVE"}
                                </span>
                            </div>
                        </div>

                        {/* Plan Features - 2 columns */}
                        {currentPlanFeatures.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#E0E5EB]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                    {leftFeatures.map((feature, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-2"
                                        >
                                            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#13243A]">
                                                <Check
                                                    size={12}
                                                    className="text-white"
                                                />
                                            </div>
                                            <span
                                                className="text-sm text-[#7A8492]"
                                                style={{ fontFamily: "Outfit" }}
                                            >
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                    {rightFeatures.map((feature, idx) => (
                                        <div
                                            key={idx + halfLength}
                                            className="flex items-start gap-2"
                                        >
                                            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#13243A]">
                                                <Check
                                                    size={12}
                                                    className="text-white"
                                                />
                                            </div>
                                            <span
                                                className="text-sm text-[#7A8492]"
                                                style={{ fontFamily: "Outfit" }}
                                            >
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Next Billing Date with Change Plan button */}
                        <div className="mt-4 pt-4 border-t border-[#E0E5EB]">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Next Billing Date
                                    </p>
                                    <p
                                        className="text-base font-semibold text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {formatDate(
                                            activeSubscription?.endDate || "",
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowChangePlanModal(true)}
                                    className="px-6 py-2.5 bg-[#6E43A3] text-white rounded-xl hover:opacity-90 transition font-medium text-sm"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Change Plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Available Plans Section */}
                <div className="bg-white rounded-2xl p-8">
                    <h2
                        className="text-xl font-bold text-[#1F083B] mb-6"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Available Plans
                    </h2>

                    {/* Filter out the current plan */}
                    {(() => {
                        const availablePlans = allPlans.filter(
                            (plan) =>
                                plan.id !==
                                (activeSubscription?.plan ||
                                    company?.plan ||
                                    "starter"),
                        );
                        const lastPlan =
                            availablePlans[availablePlans.length - 1];
                        const otherPlans = availablePlans.slice(0, -1);

                        return (
                            <div className="grid grid-cols-2 gap-6">
                                {/* First row - 2 columns for other plans */}
                                {otherPlans.map((plan) => {
                                    const isCurrentPlan =
                                        plan.id ===
                                        (activeSubscription?.plan ||
                                            company?.plan ||
                                            "starter");

                                    return (
                                        <div
                                            key={plan.id}
                                            className="flex flex-col rounded-2xl border border-[#E5E7EB] p-6 hover:shadow-lg transition bg-white"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3
                                                        className="text-xl font-bold text-[#1F083B]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {plan.name}
                                                    </h3>
                                                    <p
                                                        className="mt-1 text-sm text-[#8E98A8]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {plan.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div
                                                    className="text-lg font-bold text-[#1F083B]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {plan.price}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setSelectedPlan(plan.id);
                                                    setShowChangePlanModal(
                                                        true,
                                                    );
                                                }}
                                                className="mt-4 w-full rounded-xl px-6 py-3 font-semibold transition hover:opacity-80"
                                                style={{
                                                    fontFamily: "Outfit",
                                                    backgroundColor:
                                                        "#1B235512",
                                                    color: "#170F49",
                                                }}
                                            >
                                                {plan.id === "enterprise"
                                                    ? "Send a message"
                                                    : "Switch to Plan"}
                                            </button>

                                            {/* Features - Single column */}
                                            <div className="mt-4 pt-4 border-t border-[#E0E5EB]">
                                                <div className="flex flex-col gap-y-2">
                                                    {plan.features.map(
                                                        (feature, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-start gap-2"
                                                            >
                                                                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#13243A]">
                                                                    <Check
                                                                        size={
                                                                            12
                                                                        }
                                                                        className="text-white"
                                                                    />
                                                                </div>
                                                                <span
                                                                    className="text-sm text-[#7A8492]"
                                                                    style={{
                                                                        fontFamily:
                                                                            "Outfit",
                                                                    }}
                                                                >
                                                                    {feature}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Last plan - Full width row with 2 columns for features */}
                                {lastPlan && (
                                    <div className="col-span-2 flex flex-col rounded-2xl border border-[#E5E7EB] p-6 hover:shadow-lg transition bg-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3
                                                    className="text-xl font-bold text-[#1F083B]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {lastPlan.name}
                                                </h3>
                                                <p
                                                    className="mt-1 text-sm text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {lastPlan.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <div
                                                className="text-lg font-bold text-[#1F083B]"
                                                style={{ fontFamily: "Outfit" }}
                                            >
                                                {lastPlan.price}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedPlan(lastPlan.id);
                                                setShowChangePlanModal(true);
                                            }}
                                            className="mt-4 w-full rounded-xl px-6 py-3 font-semibold transition hover:opacity-80"
                                            style={{
                                                fontFamily: "Outfit",
                                                backgroundColor: "#1B235512",
                                                color: "#170F49",
                                            }}
                                        >
                                            {lastPlan.id === "enterprise"
                                                ? "Send a message"
                                                : "Switch to Plan"}
                                        </button>

                                        {/* Features - 2 columns for last plan */}
                                        <div className="mt-4 pt-4 border-t border-[#E0E5EB]">
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                                {(() => {
                                                    const halfLength =
                                                        Math.ceil(
                                                            lastPlan.features
                                                                .length / 2,
                                                        );
                                                    const leftFeatures =
                                                        lastPlan.features.slice(
                                                            0,
                                                            halfLength,
                                                        );
                                                    const rightFeatures =
                                                        lastPlan.features.slice(
                                                            halfLength,
                                                        );

                                                    return (
                                                        <>
                                                            {leftFeatures.map(
                                                                (
                                                                    feature,
                                                                    idx,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="flex items-start gap-2"
                                                                    >
                                                                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#13243A]">
                                                                            <Check
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="text-white"
                                                                            />
                                                                        </div>
                                                                        <span
                                                                            className="text-sm text-[#7A8492]"
                                                                            style={{
                                                                                fontFamily:
                                                                                    "Outfit",
                                                                            }}
                                                                        >
                                                                            {
                                                                                feature
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                            {rightFeatures.map(
                                                                (
                                                                    feature,
                                                                    idx,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx +
                                                                            halfLength
                                                                        }
                                                                        className="flex items-start gap-2"
                                                                    >
                                                                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#13243A]">
                                                                            <Check
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="text-white"
                                                                            />
                                                                        </div>
                                                                        <span
                                                                            className="text-sm text-[#7A8492]"
                                                                            style={{
                                                                                fontFamily:
                                                                                    "Outfit",
                                                                            }}
                                                                        >
                                                                            {
                                                                                feature
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Payment History */}
                <div className="bg-white rounded-2xl p-8">
                    <h2
                        className="text-xl font-bold text-[#1F083B] mb-6"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Payment History
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#E0E5EB]">
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Reference
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Plan
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Amount
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Date
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Status
                                    </th>
                                    <th
                                        className="text-right py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {company?.subscriptions &&
                                company.subscriptions.length > 0 ? (
                                    company.subscriptions.map((sub) => (
                                        <tr
                                            key={sub.id}
                                            className="border-b border-[#E0E5EB] hover:bg-[#F7F7F7] transition"
                                        >
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#111827]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {sub.paymentReference?.slice(
                                                        0,
                                                        12,
                                                    ) || "-"}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#111827]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {getPlanDisplayName(
                                                        sub.plan,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#111827]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {formatCurrency(
                                                        sub.totalPrice,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#111827]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {formatDate(
                                                        sub.paidAt ||
                                                            sub.createdAt,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(sub.paymentStatus)}`}
                                                >
                                                    {sub.paymentStatus
                                                        ?.charAt(0)
                                                        .toUpperCase() +
                                                        sub.paymentStatus?.slice(
                                                            1,
                                                        ) || "Unknown"}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <button className="p-1.5 text-[#6E43A3] hover:bg-[#F8F8F8] rounded-lg transition">
                                                    <Download size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            No payment history available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Change Plan Modal */}
            {showChangePlanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3
                                className="text-2xl font-bold text-[#1F083B]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Change Plan
                            </h3>
                            <button
                                onClick={() => {
                                    setShowChangePlanModal(false);
                                    setSelectedPlan("");
                                    setNewVehicleCount(10);
                                }}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        <p
                            className="text-[#5B646F] mb-4"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Select a new plan and configure your vehicle count.
                        </p>

                        {/* Plan Selection */}
                        <div className="space-y-2 mb-4">
                            <label
                                className="block text-sm font-medium text-[#5B646F] mb-1.5"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Select Plan
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {allPlans
                                    .filter(
                                        (plan) =>
                                            plan.id !==
                                            (activeSubscription?.plan ||
                                                company?.plan ||
                                                "starter"),
                                    )
                                    .map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() => {
                                                setSelectedPlan(plan.id);
                                                // Set default vehicle count based on plan
                                                if (plan.id === "starter")
                                                    setNewVehicleCount(10);
                                                else if (plan.id === "pro")
                                                    setNewVehicleCount(30);
                                                else if (
                                                    plan.id === "enterprise"
                                                )
                                                    setNewVehicleCount(50);
                                                else setNewVehicleCount(5);
                                            }}
                                            className={`p-3 rounded-xl border-2 transition text-left ${
                                                selectedPlan === plan.id
                                                    ? "border-[#6E43A3] bg-[#6E43A310]"
                                                    : "border-[#E0E5EB] hover:border-[#6E43A3]"
                                            }`}
                                        >
                                            <div
                                                className="font-semibold text-[#1F083B] text-sm"
                                                style={{ fontFamily: "Outfit" }}
                                            >
                                                {plan.name}
                                            </div>
                                            <div
                                                className="text-xs text-[#8E98A8] mt-0.5"
                                                style={{ fontFamily: "Outfit" }}
                                            >
                                                {plan.price}
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>

                        {/* Vehicle Count */}
                        <div className="bg-[#F8F8F8] rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-center">
                                <span
                                    className="text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Vehicle Count
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            setNewVehicleCount((prev) =>
                                                Math.max(1, prev - 1),
                                            )
                                        }
                                        className="w-8 h-8 rounded-lg border border-[#E0E5EB] flex items-center justify-center hover:bg-gray-50 transition"
                                    >
                                        <Minus
                                            size={16}
                                            className="text-[#8E98A8]"
                                        />
                                    </button>
                                    <input
                                        type="number"
                                        value={newVehicleCount}
                                        onChange={(e) =>
                                            setNewVehicleCount(
                                                Math.max(
                                                    1,
                                                    parseInt(e.target.value) ||
                                                        1,
                                                ),
                                            )
                                        }
                                        className="w-20 px-3 py-1.5 text-center border border-[#E0E5EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
                                        min="1"
                                    />
                                    <button
                                        onClick={() =>
                                            setNewVehicleCount(
                                                (prev) => prev + 1,
                                            )
                                        }
                                        className="w-8 h-8 rounded-lg border border-[#E0E5EB] flex items-center justify-center hover:bg-gray-50 transition"
                                    >
                                        <Plus
                                            size={16}
                                            className="text-[#8E98A8]"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Validation Messages */}
                            {selectedPlan === "starter" && (
                                <div className="flex items-center gap-2 mt-2">
                                    {newVehicleCount < 10 ? (
                                        <AlertCircle
                                            size={14}
                                            className="text-[#FE3F21] flex-shrink-0"
                                        />
                                    ) : (
                                        <CheckCircle
                                            size={14}
                                            className="text-[#2E7D32] flex-shrink-0"
                                        />
                                    )}
                                    <span
                                        className={`text-xs ${
                                            newVehicleCount < 10
                                                ? "text-[#FE3F21]"
                                                : "text-[#2E7D32]"
                                        }`}
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {newVehicleCount < 10
                                            ? `Minimum 10 vehicles required (currently ${newVehicleCount})`
                                            : `${newVehicleCount} vehicles (minimum met)`}
                                    </span>
                                </div>
                            )}
                            {selectedPlan === "pro" && (
                                <div className="flex items-center gap-2 mt-2">
                                    {newVehicleCount < 30 ? (
                                        <AlertCircle
                                            size={14}
                                            className="text-[#FE3F21] flex-shrink-0"
                                        />
                                    ) : (
                                        <CheckCircle
                                            size={14}
                                            className="text-[#2E7D32] flex-shrink-0"
                                        />
                                    )}
                                    <span
                                        className={`text-xs ${
                                            newVehicleCount < 30
                                                ? "text-[#FE3F21]"
                                                : "text-[#2E7D32]"
                                        }`}
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {newVehicleCount < 30
                                            ? `Minimum 30 vehicles required (currently ${newVehicleCount})`
                                            : `${newVehicleCount} vehicles (minimum met)`}
                                    </span>
                                </div>
                            )}
                            {selectedPlan === "enterprise" && (
                                <div className="flex items-center gap-2 mt-2">
                                    {newVehicleCount < 50 ? (
                                        <AlertCircle
                                            size={14}
                                            className="text-[#FE3F21] flex-shrink-0"
                                        />
                                    ) : (
                                        <CheckCircle
                                            size={14}
                                            className="text-[#2E7D32] flex-shrink-0"
                                        />
                                    )}
                                    <span
                                        className={`text-xs ${
                                            newVehicleCount < 50
                                                ? "text-[#FE3F21]"
                                                : "text-[#2E7D32]"
                                        }`}
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {newVehicleCount < 50
                                            ? `Minimum 50 vehicles recommended (currently ${newVehicleCount})`
                                            : `${newVehicleCount} vehicles (recommended met)`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Current Plan Summary */}
                        <div className="bg-[#F8F8F8] rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-center">
                                <span
                                    className="text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Current Plan
                                </span>
                                <span
                                    className="text-sm font-semibold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {getPlanDisplayName(
                                        activeSubscription?.plan ||
                                            company?.plan ||
                                            "starter",
                                    )}
                                </span>
                            </div>
                            {selectedPlan && (
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E0E5EB]">
                                    <span
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        New Plan
                                    </span>
                                    <span
                                        className="text-sm font-semibold text-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {selectedPlan
                                            ? allPlans.find(
                                                  (p) => p.id === selectedPlan,
                                              )?.name
                                            : "None selected"}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-3">
                            <button
                                onClick={() => {
                                    setShowChangePlanModal(false);
                                    setSelectedPlan("");
                                    setNewVehicleCount(10);
                                }}
                                className="w-full px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePlanChange}
                                disabled={
                                    !selectedPlan ||
                                    isSubmitting ||
                                    (selectedPlan === "starter" &&
                                        newVehicleCount < 10) ||
                                    (selectedPlan === "pro" &&
                                        newVehicleCount < 30) ||
                                    (selectedPlan === "enterprise" &&
                                        newVehicleCount < 50)
                                }
                                className={`w-full px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:cursor-not-allowed ${
                                    !selectedPlan ||
                                    isSubmitting ||
                                    (selectedPlan === "starter" &&
                                        newVehicleCount < 10) ||
                                    (selectedPlan === "pro" &&
                                        newVehicleCount < 30) ||
                                    (selectedPlan === "enterprise" &&
                                        newVehicleCount < 50)
                                        ? "bg-[#8E98A8] text-white"
                                        : "bg-[#6E43A3] text-white hover:opacity-90"
                                }`}
                                style={{ fontFamily: "Outfit" }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Proceed to Payment{" "}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Increase Fleet Size Modal */}
            {showIncreaseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3
                                className="text-2xl font-bold text-[#1F083B]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Increase Fleet Size
                            </h3>
                            <button
                                onClick={() => {
                                    setShowIncreaseModal(false);
                                }}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        <p
                            className="text-[#5B646F] mb-4"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Update your fleet size by adding more vehicles.
                        </p>

                        <div className="bg-[#F8F8F8] rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-center">
                                <span
                                    className="text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Current Vehicles
                                </span>
                                <span
                                    className="text-sm font-semibold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {company?.numberOfVehicles || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E0E5EB]">
                                <span
                                    className="text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    New Vehicle Count
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            setIncreaseVehicleCount((prev) =>
                                                Math.max(1, prev - 1),
                                            )
                                        }
                                        className="w-8 h-8 rounded-lg border border-[#E0E5EB] flex items-center justify-center hover:bg-gray-50 transition"
                                    >
                                        <Minus
                                            size={16}
                                            className="text-[#8E98A8]"
                                        />
                                    </button>
                                    <input
                                        type="number"
                                        value={increaseVehicleCount}
                                        onChange={(e) =>
                                            setIncreaseVehicleCount(
                                                Math.max(
                                                    1,
                                                    parseInt(e.target.value) ||
                                                        1,
                                                ),
                                            )
                                        }
                                        className="w-20 px-3 py-1.5 text-center border border-[#E0E5EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
                                        min="1"
                                    />
                                    <button
                                        onClick={() =>
                                            setIncreaseVehicleCount(
                                                (prev) => prev + 1,
                                            )
                                        }
                                        className="w-8 h-8 rounded-lg border border-[#E0E5EB] flex items-center justify-center hover:bg-gray-50 transition"
                                    >
                                        <Plus
                                            size={16}
                                            className="text-[#8E98A8]"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Show difference */}
                            {increaseVehicleCount >
                                (company?.numberOfVehicles || 0) && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Info
                                        size={14}
                                        className="text-[#6E43A3] flex-shrink-0"
                                    />
                                    <span
                                        className="text-xs text-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Adding{" "}
                                        {increaseVehicleCount -
                                            (company?.numberOfVehicles ||
                                                0)}{" "}
                                        vehicle(s)
                                    </span>
                                </div>
                            )}
                            {increaseVehicleCount <
                                (company?.numberOfVehicles || 0) && (
                                <div className="flex items-center gap-2 mt-2">
                                    <AlertCircle
                                        size={14}
                                        className="text-[#F2A618] flex-shrink-0"
                                    />
                                    <span
                                        className="text-xs text-[#F2A618]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Reducing fleet size (current:{" "}
                                        {company?.numberOfVehicles || 0})
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-3">
                            <button
                                onClick={() => {
                                    setShowIncreaseModal(false);
                                }}
                                className="w-full px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleIncreaseFleet}
                                disabled={
                                    isIncreasing ||
                                    increaseVehicleCount ===
                                        (company?.numberOfVehicles || 0)
                                }
                                className={`w-full px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:cursor-not-allowed ${
                                    isIncreasing ||
                                    increaseVehicleCount ===
                                        (company?.numberOfVehicles || 0)
                                        ? "bg-[#8E98A8] text-white"
                                        : "bg-[#6E43A3] text-white hover:opacity-90"
                                }`}
                                style={{ fontFamily: "Outfit" }}
                            >
                                {isIncreasing ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {increaseVehicleCount >
                                        (company?.numberOfVehicles || 0)
                                            ? `Add ${increaseVehicleCount - (company?.numberOfVehicles || 0)} Vehicle(s)`
                                            : "Update Fleet Size"}{" "}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#D6F5DA] flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-[#267F50]" />
                        </div>
                        <h3
                            className="text-2xl font-bold text-[#1F083B] mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Plan Changed Successfully
                        </h3>
                        <p
                            className="text-[#5B646F] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {successMessage}
                        </p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                setSelectedPlan("");
                            }}
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
