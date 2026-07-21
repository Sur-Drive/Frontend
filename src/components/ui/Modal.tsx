import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormData {
    userType: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    country: string;
    state: string;
    city: string;
    agreeToUpdates: boolean;
    // Driver fields
    vehicleType: string;
    navigationApp: string;
    driverFeatures: string[];
    // Fleet fields
    companyName: string;
    contactPerson: string;
    businessEmail: string;
    businessType: string;
    fleetSize: number;
    vehicleTypes: string;
    fleetFeatures: string[];
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const modalRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<FormData>({
        userType: "driver",
        fullName: "",
        email: "",
        phoneNumber: "",
        country: "",
        state: "",
        city: "",
        agreeToUpdates: true,
        vehicleType: "car",
        navigationApp: "google_maps",
        driverFeatures: ["hazard_alerts", "sos"],
        companyName: "",
        contactPerson: "",
        businessEmail: "",
        businessType: "",
        fleetSize: 0,
        vehicleTypes: "",
        fleetFeatures: ["fleet_dashboard", "live_tracking"],
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            setStep(1);
            setStatus("idle");
            setErrorMessage("");
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : value,
        });
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleCheckboxChange = (feature: string, field: string) => {
        const currentFeatures = formData[field as keyof FormData] as string[];
        if (currentFeatures.includes(feature)) {
            setFormData({
                ...formData,
                [field]: currentFeatures.filter((f) => f !== feature),
            });
        } else {
            setFormData({
                ...formData,
                [field]: [...currentFeatures, feature],
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus("idle");
        setErrorMessage("");

        try {
            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3001";

            // Build payload based on user type
            const payload: any = {
                userType: formData.userType,
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                country: formData.country,
                state: formData.state,
                city: formData.city,
                agreeToUpdates: formData.agreeToUpdates,
            };

            if (formData.userType === "driver") {
                payload.vehicleType = formData.vehicleType;
                payload.navigationApp = formData.navigationApp;
                payload.driverFeatures = formData.driverFeatures;
            } else {
                payload.companyName = formData.companyName;
                payload.contactPerson = formData.contactPerson;
                payload.businessEmail = formData.businessEmail;
                payload.businessType = formData.businessType;
                payload.fleetSize = formData.fleetSize;
                payload.vehicleTypes = formData.vehicleTypes;
                payload.fleetFeatures = formData.fleetFeatures;
            }

            const response = await fetch(`${API_URL}/waitlist`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setTimeout(() => {
                    onClose();
                    setStatus("idle");
                    setStep(1);
                }, 3000);
            } else {
                setStatus("error");
                setErrorMessage(
                    data.message || "Something went wrong. Please try again.",
                );
            }
        } catch (error) {
            setStatus("error");
            setErrorMessage(
                "Network error. Please check your connection and try again.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-archivo text-purple-700">
                        <i className="fas fa-road text-3xl text-purple-700"></i>
                    </span>
                </div>
                <h3 className="text-xl font-archivo text-purple-900">
                    Join the Waitlist
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                    Be the first to know when we launch
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        I am a
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                setFormData({ ...formData, userType: "driver" })
                            }
                            className={`p-3 rounded-xl border-2 transition-all ${
                                formData.userType === "driver"
                                    ? "border-purple-700 bg-purple-50 text-purple-700"
                                    : "border-gray-200 hover:border-purple-300"
                            }`}
                        >
                            {/* <i className="fas fa-car text-lg block mb-1"></i> */}
                            <span className="text-sm font-medium">Driver</span>
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setFormData({
                                    ...formData,
                                    userType: "fleet_owner",
                                })
                            }
                            className={`p-3 rounded-xl border-2 transition-all ${
                                formData.userType === "fleet_owner"
                                    ? "border-purple-700 bg-purple-50 text-purple-700"
                                    : "border-gray-200 hover:border-purple-300"
                            }`}
                        >
                            {/* <i className="fas fa-truck text-lg block mb-1"></i> */}
                            <span className="text-sm font-medium">
                                Fleet Owner
                            </span>
                        </button>
                    </div>
                </div>

                <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                    required
                />

                <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                    required
                />

                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="text"
                        name="country"
                        placeholder="Country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                        required
                    />
                    <input
                        type="text"
                        name="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                        required
                    />
                </div>

                <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                    required
                />
            </div>

            <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full px-6 py-3 bg-purple-700 text-white rounded-xl hover:bg-purple-800 transition-all font-medium shadow-lg shadow-purple-700/30"
            >
                Continue
            </button>
        </div>
    );

    const renderStep2 = () => {
        const isDriver = formData.userType === "driver";

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                    >
                        ← Back
                    </button>
                    <span className="text-xs text-gray-400">Step 2 of 2</span>
                </div>

                <div className="text-center mb-4">
                    <h3 className="text-lg font-archivo text-purple-900">
                        {isDriver ? "Driver Preferences" : "Fleet Details"}
                    </h3>
                    <p className="text-gray-500 text-sm">
                        Help us personalize your experience
                    </p>
                </div>

                {isDriver ? (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vehicle Type
                            </label>
                            <select
                                name="vehicleType"
                                value={formData.vehicleType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            >
                                <option value="car">Car</option>
                                <option value="suv">SUV</option>
                                <option value="bus">Bus</option>
                                <option value="truck">Truck</option>
                                <option value="motorcycle">Motorcycle</option>
                                <option value="others">Others</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Navigation App
                            </label>
                            <select
                                name="navigationApp"
                                value={formData.navigationApp}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            >
                                <option value="google_maps">Google Maps</option>
                                <option value="waze">Waze</option>
                                <option value="apple_maps">Apple Maps</option>
                                <option value="others">Others</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Features I'm interested in
                            </label>
                            <div className="space-y-2">
                                {[
                                    {
                                        value: "hazard_alerts",
                                        label: "Hazard Alerts",
                                    },
                                    {
                                        value: "scout_mode",
                                        label: "Scout Mode",
                                    },
                                    { value: "sos", label: "SOS" },
                                    {
                                        value: "navigation",
                                        label: "Navigation",
                                    },
                                    {
                                        value: "community_reporting",
                                        label: "Community Reporting",
                                    },
                                ].map((feature) => (
                                    <label
                                        key={feature.value}
                                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.driverFeatures.includes(
                                                feature.value,
                                            )}
                                            onChange={() =>
                                                handleCheckboxChange(
                                                    feature.value,
                                                    "driverFeatures",
                                                )
                                            }
                                            className="w-4 h-4 text-purple-700 rounded focus:ring-purple-700"
                                            style={{ accentColor: "#4A148C" }}
                                        />
                                        <span className="text-sm text-gray-700">
                                            {feature.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <input
                            type="text"
                            name="companyName"
                            placeholder="Company Name"
                            value={formData.companyName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            required
                        />
                        <input
                            type="text"
                            name="contactPerson"
                            placeholder="Contact Person"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            required
                        />
                        <input
                            type="email"
                            name="businessEmail"
                            placeholder="Business Email"
                            value={formData.businessEmail}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            required
                        />
                        <input
                            type="text"
                            name="businessType"
                            placeholder="Business Type (e.g., Transportation, Logistics)"
                            value={formData.businessType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            required
                        />
                        <input
                            type="number"
                            name="fleetSize"
                            placeholder="Fleet Size (Number of Vehicles)"
                            value={formData.fleetSize || ""}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            required
                        />
                        <input
                            type="text"
                            name="vehicleTypes"
                            placeholder="Vehicle Types (e.g., Trucks, Vans, Buses)"
                            value={formData.vehicleTypes}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fleet Features
                            </label>
                            <div className="space-y-2">
                                {[
                                    {
                                        value: "fleet_dashboard",
                                        label: "Fleet Dashboard",
                                    },
                                    {
                                        value: "live_tracking",
                                        label: "Live Tracking",
                                    },
                                    {
                                        value: "driver_management",
                                        label: "Driver Management",
                                    },
                                    {
                                        value: "hazard_alerts",
                                        label: "Hazard Alerts",
                                    },
                                    {
                                        value: "reports_analytics",
                                        label: "Reports & Analytics",
                                    },
                                    {
                                        value: "route_intelligence",
                                        label: "Route Intelligence",
                                    },
                                    { value: "sos", label: "SOS" },
                                ].map((feature) => (
                                    <label
                                        key={feature.value}
                                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.fleetFeatures.includes(
                                                feature.value,
                                            )}
                                            onChange={() =>
                                                handleCheckboxChange(
                                                    feature.value,
                                                    "fleetFeatures",
                                                )
                                            }
                                            className="w-4 h-4 text-purple-700 rounded focus:ring-purple-700"
                                            style={{ accentColor: "#4A148C" }}
                                        />
                                        <span className="text-sm text-gray-700">
                                            {feature.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="agreeToUpdates"
                        checked={formData.agreeToUpdates}
                        onChange={handleChange}
                        className="w-4 h-4 rounded focus:ring-gold-500"
                        style={{ accentColor: "#D4AF37" }}
                        required
                    />
                    <label className="text-xs text-gray-600">
                        I agree to receive updates about SUR-DRIVEHT
                    </label>
                </div>

                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-xl hover:from-purple-800 hover:to-purple-900 transition-all font-medium shadow-lg shadow-purple-700/30 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    {isLoading ? (
                        <>
                            <svg
                                className="animate-spin h-4 w-4 text-white"
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
                            <span>Submitting...</span>
                        </>
                    ) : (
                        <>
                            <i className="fas fa-rocket"></i>
                            <span>Join Waitlist</span>
                        </>
                    )}
                </button>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-900/70 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 md:p-8 shadow-2xl border-2 border-gold-500/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {status === "success" ? (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i className="fas fa-check-circle text-4xl text-green-600"></i>
                                </div>
                                <h3 className="text-2xl font-archivo text-purple-900 mb-2">
                                    You're In! 🎉
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                    Thanks for joining the waitlist! We'll
                                    notify you when SUR-DRIVEHT launches.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all text-sm font-medium"
                                >
                                    Got it!
                                </button>
                            </div>
                        ) : status === "error" ? (
                            <div className="text-center py-4">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i className="fas fa-exclamation-circle text-4xl text-red-600"></i>
                                </div>
                                <h3 className="text-xl font-archivo text-purple-900 mb-2">
                                    Oops!
                                </h3>
                                <p className="text-red-600 text-sm mb-4">
                                    {errorMessage}
                                </p>
                                <button
                                    onClick={() => setStatus("idle")}
                                    className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all text-sm font-medium"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : step === 1 ? (
                            renderStep1()
                        ) : (
                            renderStep2()
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
