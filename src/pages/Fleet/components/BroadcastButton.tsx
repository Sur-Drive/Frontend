import React, { useState, useEffect } from "react";
import { Megaphone, Lock } from "lucide-react";
import BroadcastModal from "./BroadcastModal";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface BroadcastButtonProps {
    className?: string;
    onBroadcastSent?: () => void;
}

const BroadcastButton: React.FC<BroadcastButtonProps> = ({
    className = "",
    onBroadcastSent,
}) => {
    const [showModal, setShowModal] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState("");

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
                setPlan(userPlan);
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

    if (loading) {
        return (
            <button
                className={`flex items-center justify-center gap-2 rounded-lg py-3 px-4 transition w-full opacity-50 cursor-not-allowed ${className}`}
                style={{ backgroundColor: "#2E7D3233" }}
                disabled
            >
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#2E7D3233" }}
                >
                    <Megaphone size={18} style={{ color: "#2E7D32" }} />
                </div>
                <span
                    className="text-xs font-medium whitespace-nowrap"
                    style={{
                        fontFamily: "Outfit",
                        color: "#2E7D32",
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
                    style={{ backgroundColor: "#2E7D3233" }}
                    disabled
                >
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#2E7D3233" }}
                    >
                        <Megaphone size={18} style={{ color: "#8E98A8" }} />
                    </div>
                    <span
                        className="text-xs font-medium whitespace-nowrap"
                        style={{
                            fontFamily: "Outfit",
                            color: "#8E98A8",
                        }}
                    >
                        Broadcast
                    </span>
                    <Lock
                        size={14}
                        className="ml-auto text-[#8E98A8] flex-shrink-0"
                    />
                </button>
                {/* Tooltip - Wrapped and positioned properly */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1F083B] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 max-w-[220px] text-center pointer-events-none">
                    Upgrade to Pro or Enterprise to broadcast messages
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1F083B]"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`flex items-center justify-center gap-2 rounded-lg py-3 px-4 transition hover:opacity-80 w-full ${className}`}
                style={{ backgroundColor: "#2E7D3233" }}
            >
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#2E7D3233" }}
                >
                    <Megaphone size={18} style={{ color: "#2E7D32" }} />
                </div>
                <span
                    className="text-xs font-medium whitespace-nowrap"
                    style={{
                        fontFamily: "Outfit",
                        color: "#2E7D32",
                    }}
                >
                    Broadcast
                </span>
            </button>

            <BroadcastModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={onBroadcastSent}
            />
        </>
    );
};

export default BroadcastButton;
