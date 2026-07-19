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
            className="flex w-full flex-col"
            style={{ gap: "32px", paddingTop: "60px" }}
        >
            {/* Header */}
            <div>
                <h2
                    className="text-[32px] font-bold text-black"
                    style={{ fontFamily: "Outfit" }}
                >
                    Company Details
                </h2>
                <p
                    className="text-[#8E98A8]"
                    style={{ fontFamily: "Outfit", fontSize: "16px" }}
                >
                    This information helps us create and secure your account.
                </p>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="flex flex-col"
                style={{ gap: "32px" }}
            >
                {/* Row 1: Company Name & Industry */}
                <div className="flex gap-6">
                    <div className="flex-1" style={{ width: "354px" }}>
                        <label className="mb-2 block text-sm font-medium text-[#1F083B]">
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
                            className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                            placeholder="Enter company name"
                            required
                        />
                    </div>
                    <div className="flex-1" style={{ width: "354px" }}>
                        <label className="mb-2 block text-sm font-medium text-[#1F083B]">
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
                            className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                            placeholder="Enter industry"
                            required
                        />
                    </div>
                </div>

                {/* Row 2: Fleet Name & Region */}
                <div className="flex gap-6">
                    <div className="flex-1" style={{ width: "354px" }}>
                        <label className="mb-2 block text-sm font-medium text-[#1F083B]">
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
                            className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                            placeholder="Enter fleet name"
                            required
                        />
                    </div>
                    <div className="flex-1" style={{ width: "354px" }}>
                        <label className="mb-2 block text-sm font-medium text-[#1F083B]">
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
                            className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                            placeholder="Enter region"
                            required
                        />
                    </div>
                </div>

                {/* Row 3: Operations Contact & Phone */}
                <div className="flex gap-6">
                    <div className="flex-1" style={{ width: "354px" }}>
                        <label className="mb-2 block text-sm font-medium text-[#1F083B]">
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
                            className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                            placeholder="Enter contact email"
                            required
                        />
                    </div>
                    <div className="flex-1" style={{ width: "354px" }}>
                        <label className="mb-2 block text-sm font-medium text-[#1F083B]">
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
                            className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                            placeholder="Enter phone number"
                            required
                        />
                    </div>
                </div>

                {/* Row 4: Brief Description - Full width */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F083B]">
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
                        className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                        placeholder="Tell us about your business"
                        rows={3}
                    />
                </div>

                {/* Continue Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="flex items-center gap-2 rounded-xl px-10 py-3 text-white transition hover:opacity-90"
                        style={{
                            backgroundColor: "#6E43A3",
                            width: "188px",
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
