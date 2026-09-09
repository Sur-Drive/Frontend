import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Building,
    FileText,
    Mail,
    Phone,
    ArrowRight,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Users,
    CreditCard,
    HelpCircle,
} from "lucide-react";
import BlurSidebar from "../../Dashboard/BlurSidebar";

const KYCPending: React.FC = () => {
    const navigate = useNavigate();

    const handleResolveKYC = () => {
        navigate("/fleet/kyc");
    };

    return (
        <BlurSidebar status="pending">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#F2A61820] mx-auto mb-6">
                        <AlertCircle size={40} className="text-[#F2A618]" />
                    </div>

                    <h1
                        className="text-2xl font-bold text-center text-[#1F083B] mb-3"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Complete Your KYC Verification
                    </h1>

                    <p
                        className="text-[#5B646F] text-center mb-8"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Your KYC verification is incomplete. Please complete all
                        steps below to activate your fleet management account.
                    </p>

                    <div className="border-t border-[#E5E7EB] pt-6">
                        <h3
                            className="text-sm font-semibold text-[#1F083B] mb-4"
                            style={{ fontFamily: "Outfit" }}
                        >
                            KYC Process (4 Steps):
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#6E43A310] flex items-center justify-center flex-shrink-0">
                                    <Building
                                        size={16}
                                        className="text-[#6E43A3]"
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Step 1: Company Information
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Provide your company name, industry,
                                        region, and contact details
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#6E43A310] flex items-center justify-center flex-shrink-0">
                                    <CreditCard
                                        size={16}
                                        className="text-[#6E43A3]"
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Step 2: Plan Selection
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Choose your subscription plan (Free
                                        Trial, Starter, Pro, or Enterprise)
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#6E43A310] flex items-center justify-center flex-shrink-0">
                                    <Users
                                        size={16}
                                        className="text-[#6E43A3]"
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Step 3: Fleet Size
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Specify the number of vehicles in your
                                        fleet
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#6E43A310] flex items-center justify-center flex-shrink-0">
                                    <CheckCircle
                                        size={16}
                                        className="text-[#6E43A3]"
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Step 4: Subscription Summary
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Review your details and complete payment
                                        (if applicable)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleResolveKYC}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#6E43A3] text-white rounded-xl font-medium hover:bg-[#5A3485] transition-colors duration-200"
                            style={{ fontFamily: "Outfit" }}
                        >
                            <RefreshCw size={18} />
                            <span>Complete KYC Now</span>
                            <ArrowRight size={18} />
                        </button>

                        <button
                            onClick={() =>
                                (window.location.href =
                                    "mailto:surdriveht@gmail.com?subject=KYC Verification Issue - Please Help")
                            }
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F8F8F8] text-[#1F083B] rounded-xl font-medium hover:bg-[#F0F0F0] transition-colors duration-200"
                            style={{ fontFamily: "Outfit" }}
                        >
                            <HelpCircle size={18} />
                            <span>Contact Support</span>
                        </button>
                    </div>

                    {/* Contact Support Message */}
                    <div className="mt-6 p-4 bg-[#FEF3C7] rounded-xl border border-[#F2A618]/20">
                        <div className="flex items-start gap-3">
                            <Phone
                                size={18}
                                className="text-[#F2A618] mt-0.5 flex-shrink-0"
                            />
                            <div>
                                <p
                                    className="text-sm text-[#92400E]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    <span className="font-semibold">
                                        If the issue persists:
                                    </span>{" "}
                                    Please send us an email at{" "}
                                    <a
                                        href="mailto:surdriveht@gmail.com?subject=KYC Verification Issue - Please Help"
                                        className="text-[#6E43A3] font-medium hover:underline"
                                    >
                                        surdriveht@gmail.com
                                    </a>{" "}
                                    and we'll help resolve it as soon as
                                    possible.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BlurSidebar>
    );
};

export default KYCPending;
