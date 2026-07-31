import React from "react";
import { Building, Clock, FileText, Mail, Phone } from "lucide-react";
import BlurSidebar from "../../Dashboard/BlurSidebar";

const KYCPending: React.FC = () => {
    return (
        <BlurSidebar status="pending">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#F2A61820] mx-auto mb-6">
                        <Clock size={40} className="text-[#F2A618]" />
                    </div>

                    <h1
                        className="text-2xl font-bold text-center text-[#1F083B] mb-3"
                        style={{ fontFamily: "Outfit" }}
                    >
                        KYC Verification in Progress
                    </h1>

                    <p
                        className="text-[#5B646F] text-center mb-8"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Your KYC documents are being reviewed by our team. This
                        typically takes 24-48 hours.
                    </p>

                    <div className="border-t border-[#E5E7EB] pt-6">
                        <h3
                            className="text-sm font-semibold text-[#1F083B] mb-4"
                            style={{ fontFamily: "Outfit" }}
                        >
                            What happens next?
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#6E43A310] flex items-center justify-center flex-shrink-0">
                                    <FileText
                                        size={16}
                                        className="text-[#6E43A3]"
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Document Review
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Our team is verifying your submitted
                                        documents
                                    </p>
                                </div>
                            </div>

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
                                        Company Verification
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Your company details are being validated
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#6E43A310] flex items-center justify-center flex-shrink-0">
                                    <Mail
                                        size={16}
                                        className="text-[#6E43A3]"
                                    />
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Email Notification
                                    </p>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        You'll receive an email once
                                        verification is complete
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-[#F8F8F8] rounded-xl">
                        <div className="flex items-center gap-2">
                            <Phone size={16} className="text-[#6E43A3]" />
                            <p
                                className="text-sm text-[#5B646F]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Need help? Contact us at{" "}
                                <span className="text-[#6E43A3] font-medium">
                                    support@surdrive.com
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </BlurSidebar>
    );
};

export default KYCPending;
