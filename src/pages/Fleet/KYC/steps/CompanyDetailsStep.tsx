import React, { useState } from "react";

interface CompanyDetailsStepProps {
    onNext: (data: any) => void;
}

const CompanyDetailsStep: React.FC<CompanyDetailsStepProps> = ({ onNext }) => {
    const [formData, setFormData] = useState({
        companyName: "",
        industry: "",
        fleetName: "",
        region: "",
        operationsContact: "",
        companyPhone: "",
        briefDescription: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext(formData);
    };

    return (
        <div
            className="flex w-full max-w-full flex-col px-4 sm:px-6 md:px-0"
            style={{ gap: "24px", paddingTop: "30px" }}
        >
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-black sm:text-[28px] md:text-[32px]">
                    Company Details
                </h2>
                <p className="text-sm text-[#8E98A8] sm:text-base">
                    This information helps us create and secure your account.
                </p>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="flex flex-col"
                style={{ gap: "24px" }}
            >
                {/* Row 1: Company Name & Industry */}
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                            Company Name
                        </label>
                        <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    companyName: e.target.value,
                                })
                            }
                            className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                            placeholder="Enter company name"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                            Industry
                        </label>
                        <input
                            type="text"
                            value={formData.industry}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    industry: e.target.value,
                                })
                            }
                            className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                            placeholder="Enter industry"
                            required
                        />
                    </div>
                </div>

                {/* Row 2: Fleet Name & Region */}
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                            Fleet Name
                        </label>
                        <input
                            type="text"
                            value={formData.fleetName}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    fleetName: e.target.value,
                                })
                            }
                            className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                            placeholder="Enter fleet name"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                            Region
                        </label>
                        <input
                            type="text"
                            value={formData.region}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    region: e.target.value,
                                })
                            }
                            className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                            placeholder="Enter region"
                            required
                        />
                    </div>
                </div>

                {/* Row 3: Operations Contact & Phone */}
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                            Operations Contact
                        </label>
                        <input
                            type="email"
                            value={formData.operationsContact}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    operationsContact: e.target.value,
                                })
                            }
                            className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                            placeholder="Enter contact email"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                            Company Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.companyPhone}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    companyPhone: e.target.value,
                                })
                            }
                            className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-base"
                            placeholder="Enter phone number"
                            required
                        />
                    </div>
                </div>

                {/* Row 4: Brief Description - Full width */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1F083B] sm:mb-2">
                        Brief Description
                    </label>
                    <textarea
                        value={formData.briefDescription}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                briefDescription: e.target.value,
                            })
                        }
                        className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:text-base"
                        placeholder="Tell us about your business"
                        rows={3}
                    />
                </div>

                {/* Continue Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-white transition hover:opacity-90 sm:w-auto sm:px-10"
                        style={{
                            backgroundColor: "#6E43A3",
                            height: "56px",
                            borderRadius: "12px",
                            fontFamily: "Outfit",
                            fontSize: "16px",
                            fontWeight: 600,
                        }}
                    >
                        Continue
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                        >
                            <path
                                d="M4.16667 10H15.8333"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M10.8333 15L15.8333 10L10.8333 5"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyDetailsStep;
