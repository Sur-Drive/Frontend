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
            if (plan === "free" && numValue > 5) {
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
        if (plan === "free" && numValue > 5) {
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
        <div className="flex w-full flex-col" style={{ gap: "40px" }}>
            {/* Header */}
            <div>
                <h2
                    className="text-[32px] font-bold text-black"
                    style={{ fontFamily: "Outfit" }}
                >
                    Fleet Size
                </h2>
                <p
                    className="text-[#8E98A8]"
                    style={{ fontFamily: "Outfit", fontSize: "16px" }}
                >
                    Enter the number of vehicles you want to register under your
                    fleet.
                </p>
            </div>

            {/* Text Field */}
            <div className="flex flex-col items-center gap-2">
                <label
                    className="text-sm font-medium text-[#1F083B] w-full"
                    style={{ fontFamily: "Outfit" }}
                >
                    Number of vehicles
                </label>
                <input
                    type="number"
                    min="0"
                    value={vehicleCount}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] px-4 py-3 text-lg outline-none focus:border-[#6E43A3]"
                    style={{
                        fontFamily: "Outfit",
                        background: "white",
                    }}
                    placeholder="Enter number of vehicles"
                />

                {/* Error/Warning Messages */}
                {error && (
                    <div
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 mt-2"
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
                            className="text-sm font-medium"
                            style={{ color: "#F2A618", fontFamily: "Outfit" }}
                        >
                            {error}
                        </span>
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center gap-4">
                <button
                    className="rounded-xl px-6 py-3 font-medium transition hover:bg-gray-50"
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
                    className="rounded-xl px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    style={{
                        backgroundColor: isValid ? "#6E43A3" : "#8E98A8",
                        fontFamily: "Outfit",
                        minWidth: "140px",
                        justifyContent: "center",
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
