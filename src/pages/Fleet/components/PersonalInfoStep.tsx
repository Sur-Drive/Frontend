import React, { useState } from "react";
import { sendPersonalInfo } from "../../../api/auth";

interface PersonalInfoStepProps {
    onSuccess: (data: any) => void;
    onError: (error: string) => void;
    setLoading: (loading: boolean) => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
    onSuccess,
    onError,
    setLoading,
}) => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        gender: "",
        dateOfBirth: "",
        occupation: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !formData.firstName ||
            !formData.lastName ||
            !formData.gender ||
            !formData.dateOfBirth
        ) {
            onError("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            await sendPersonalInfo(formData);
            onSuccess(formData);
        } catch (err: any) {
            onError(err.message || "Failed to save personal information");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full"
            style={{ width: "520px" }}
        >
            <div className="flex flex-col gap-6">
                {/* Heading */}
                <div className="text-center">
                    <h2
                        className="text-[32px] font-bold leading-[100%] text-black"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Personal Information
                    </h2>
                    <p
                        className="mt-2 text-[#8E98A8]"
                        style={{ fontFamily: "Outfit", fontSize: "16px" }}
                    >
                        Please provide your personal details
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                            First Name
                        </label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    firstName: e.target.value,
                                })
                            }
                            className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                            placeholder="Enter your first name"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                            Last Name
                        </label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    lastName: e.target.value,
                                })
                            }
                            className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                            placeholder="Enter your last name"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                        Gender
                    </label>
                    <select
                        value={formData.gender}
                        onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                        required
                    >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                        Date of Birth
                    </label>
                    <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                dateOfBirth: e.target.value,
                            })
                        }
                        className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                        required
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-[#1F083B]">
                        Occupation
                    </label>
                    <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                occupation: e.target.value,
                            })
                        }
                        className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3]"
                        placeholder="Enter your occupation (optional)"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full rounded-2xl px-6 py-3 text-white transition hover:opacity-90"
                    style={{
                        backgroundColor: "#6E43A3",
                        height: "56px",
                        borderRadius: "16px",
                        fontFamily: "Outfit",
                        fontSize: "16px",
                        fontWeight: 600,
                    }}
                >
                    Continue
                </button>
            </div>
        </form>
    );
};

export default PersonalInfoStep;
