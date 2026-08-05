import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Locate } from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface LiveTrackingButtonProps {
    className?: string;
    text?: string;
}

const LiveTrackingButton: React.FC<LiveTrackingButtonProps> = ({
    className = "",
    text = "Live Tracking",
}) => {
    const navigate = useNavigate();
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkPlanAccess();
    }, []);

    const checkPlanAccess = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE}/fleet/current-plan`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                const userPlan = data.plan || "starter";
                setHasAccess(userPlan === "pro" || userPlan === "enterprise");
            } else {
                setHasAccess(false);
            }
        } catch (error) {
            console.error("Error checking plan:", error);
            setHasAccess(false);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = () => {
        if (hasAccess) {
            navigate("/fleet/live-tracking");
        }
    };

    if (loading) {
        return (
            <button
                className={`flex items-center justify-center gap-2 rounded-lg py-3 px-4 transition w-full opacity-50 cursor-not-allowed ${className}`}
                style={{ backgroundColor: "#F2A61833" }}
                disabled
            >
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#F2A61833" }}
                >
                    <Locate size={18} style={{ color: "#F2A618" }} />
                </div>
                <span
                    className="text-xs font-medium whitespace-nowrap"
                    style={{
                        fontFamily: "Outfit",
                        color: "#F2A618",
                    }}
                >
                    Loading...
                </span>
            </button>
        );
    }

    if (!hasAccess) {
        return (
            <div className="relative group w-full">
                <button
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 px-4 transition w-full opacity-60 cursor-not-allowed ${className}`}
                    style={{ backgroundColor: "#F2A61833" }}
                    disabled
                >
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#F2A61833" }}
                    >
                        <Locate size={18} style={{ color: "#8E98A8" }} />
                    </div>
                    <span
                        className="text-xs font-medium whitespace-nowrap"
                        style={{
                            fontFamily: "Outfit",
                            color: "#8E98A8",
                        }}
                    >
                        {text}
                    </span>
                    <Lock
                        size={14}
                        className="ml-auto text-[#8E98A8] flex-shrink-0"
                    />
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1F083B] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 max-w-[220px] text-center pointer-events-none">
                    Live Tracking requires Pro or Enterprise plan
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1F083B]"></div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`flex items-center justify-center gap-2 rounded-lg py-3 px-4 transition hover:opacity-80 w-full ${className}`}
            style={{ backgroundColor: "#F2A61833" }}
        >
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#F2A61833" }}
            >
                <Locate size={18} style={{ color: "#F2A618" }} />
            </div>
            <span
                className="text-xs font-medium whitespace-nowrap"
                style={{
                    fontFamily: "Outfit",
                    color: "#F2A618",
                }}
            >
                {text}
            </span>
        </button>
    );
};

export default LiveTrackingButton;
