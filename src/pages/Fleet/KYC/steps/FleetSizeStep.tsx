import React, { useState } from "react";

interface FleetSizeStepProps {
    onNext: (data: any) => void;
    plan: string;
}

const FleetSizeStep: React.FC<FleetSizeStepProps> = ({ onNext, plan }) => {
    const [vehicleCount, setVehicleCount] = useState<number | string>("");
    const [error, setError] = useState<string>("");

    const handleChange = (value: string) => {
        const numValue = parseInt(value) || 0;
        setVehicleCount(value);
        setError("");

        // Validation based on plan
        if (numValue > 0) {
            if (plan === "free_trial" && numValue > 5) {
                setError(
                    "The Free Trial supports up to 5 vehicles. Choose a paid plan to manage more vehicles.",
                );
            } else if (plan === "starter" && numValue < 10) {
                setError("Starter Fleet requires a minimum of 10 vehicles.");
            } else if (plan === "pro" && numValue < 30) {
                setError("Pro Fleet requires at least 30 vehicles.");
            }
        }
    };

    const handleContinue = () => {
        const numValue = parseInt(vehicleCount as string) || 0;

        if (numValue === 0) {
            setError("Please enter the number of vehicles");
            return;
        }

        // Check minimum requirements
        if (plan === "free_trial" && numValue > 5) {
            setError(
                "The Free Trial supports up to 5 vehicles. Choose a paid plan to manage more vehicles.",
            );
            return;
        }
        if (plan === "starter" && numValue < 10) {
            setError("Starter Fleet requires a minimum of 10 vehicles.");
            return;
        }
        if (plan === "pro" && numValue < 30) {
            setError("Pro Fleet requires at least 30 vehicles.");
            return;
        }

        onNext({ numberOfVehicles: numValue });
    };

    const isValid = parseInt(vehicleCount as string) > 0 && !error;

    return (
        <div
            className="flex w-full max-w-full flex-col px-4 sm:px-8 md:px-12 lg:px-0 pt-14 sm:pt-0"
            style={{ gap: "32px" }}
        >
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-black sm:text-[28px] md:text-[32px]">
                    Fleet Size
                </h2>
                <p className="mt-1 text-sm text-[#8E98A8] sm:text-base">
                    Enter the number of vehicles you want to register under your
                    fleet.
                </p>
            </div>

            {/* Text Field */}
            <div className="flex w-full flex-col items-center gap-2">
                <label
                    className="w-full text-sm font-medium text-[#1F083B] sm:text-base"
                    style={{ fontFamily: "Outfit" }}
                >
                    Number of vehicles
                </label>
                <input
                    type="number"
                    min="0"
                    value={vehicleCount}
                    onChange={(e) => handleChange(e.target.value)}
                    className="h-12 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-base outline-none transition focus:border-[#6E43A3] focus:ring-1 focus:ring-[#6E43A3] sm:h-14 sm:text-lg"
                    style={{
                        fontFamily: "Outfit",
                        background: "white",
                    }}
                    placeholder="Enter number of vehicles"
                />

                {/* Error/Warning Messages */}
                {error && (
                    <div
                        className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-3"
                        style={{
                            backgroundColor: "#F2A6181F",
                            border: "1px solid #F2A618",
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="flex-shrink-0"
                        >
                            <path
                                d="M10 2L1 17H19L10 2Z"
                                stroke="#F2A618"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M10 8V12"
                                stroke="#F2A618"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="10" cy="15" r="1" fill="#F2A618" />
                        </svg>
                        <span
                            className="text-sm font-medium sm:text-base"
                            style={{ color: "#F2A618", fontFamily: "Outfit" }}
                        >
                            {error}
                        </span>
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <button
                    className="w-full rounded-xl px-6 py-3 text-center font-medium transition hover:bg-gray-50 sm:w-auto"
                    style={{
                        color: "#8E98A8",
                        fontFamily: "Outfit",
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleContinue}
                    disabled={!isValid}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-8"
                    style={{
                        backgroundColor: isValid ? "#6E43A3" : "#8E98A8",
                        fontFamily: "Outfit",
                        minWidth: "140px",
                    }}
                >
                    Continue
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M4 10H16"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M12 6L16 10L12 14"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default FleetSizeStep;
