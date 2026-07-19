import React, { useState } from "react";
import {
    AlertCircle,
    Calendar,
    CreditCard,
    ArrowRight,
    CheckCircle,
} from "lucide-react";
import BlurSidebar from "../../Dashboard/BlurSidebar";

const SubscriptionRenew: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState<string>("pro");

    const plans = [
        {
            id: "starter",
            name: "Starter Fleet",
            price: "₦2,250/vehicle",
            minVehicles: 10,
        },
        {
            id: "pro",
            name: "Pro Fleet",
            price: "₦3,500/vehicle",
            minVehicles: 30,
        },
        {
            id: "enterprise",
            name: "Enterprise Fleet",
            price: "Contact us",
            minVehicles: 50,
        },
    ];

    return (
        <BlurSidebar status="expired">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-[#FE3F2124] flex items-center justify-center">
                            <AlertCircle size={24} className="text-[#FE3F21]" />
                        </div>
                        <div>
                            <h1
                                className="text-2xl font-bold text-[#1F083B]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Subscription Expired
                            </h1>
                            <p
                                className="text-[#5B646F]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Your subscription has expired. Please renew to
                                continue accessing your fleet.
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#FFF5F5] border border-[#FE3F2124] rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-[#FE3F21]" />
                            <span
                                className="text-sm text-[#5B646F]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Your subscription expired on{" "}
                                <strong className="text-[#1F083B]">
                                    July 19, 2026
                                </strong>
                            </span>
                        </div>
                    </div>

                    <h3
                        className="text-lg font-semibold text-[#1F083B] mb-4"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Choose a Plan
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`p-6 rounded-xl border-2 transition text-left ${
                                    selectedPlan === plan.id
                                        ? "border-[#6E43A3] bg-[#6E43A310]"
                                        : "border-[#E5E7EB] hover:border-[#6E43A3]"
                                }`}
                            >
                                <h4
                                    className="font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {plan.name}
                                </h4>
                                <p
                                    className="text-sm text-[#6E43A3] font-semibold mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {plan.price}
                                </p>
                                <p
                                    className="text-xs text-[#8E98A8] mt-2"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Min. {plan.minVehicles} vehicles
                                </p>
                                {selectedPlan === plan.id && (
                                    <div className="mt-2 flex items-center gap-1">
                                        <CheckCircle
                                            size={14}
                                            className="text-[#6E43A3]"
                                        />
                                        <span className="text-xs text-[#6E43A3] font-medium">
                                            Selected
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <button className="w-full mt-6 bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2">
                        <CreditCard size={18} />
                        Renew Subscription
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </BlurSidebar>
    );
};

export default SubscriptionRenew;
