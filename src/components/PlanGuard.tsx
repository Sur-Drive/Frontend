import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import DashSidebar from "../pages/Fleet/Dashboard/DashSidebar";
import ManagerSidebar from "../pages/Fleet/Manager/ManagerSidebar";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface PlanGuardProps {
    children: React.ReactNode;
    requiredPlans?: string[];
}

const PlanGuard: React.FC<PlanGuardProps> = ({
    children,
    requiredPlans = ["pro", "enterprise"],
}) => {
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [plan, setPlan] = useState<string>("");
    const [isManager, setIsManager] = useState(false);

    useEffect(() => {
        checkPlanAccess();
    }, []);

    const checkPlanAccess = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setPlan("starter");
                setHasAccess(false);
                setLoading(false);
                return;
            }

            // Check if user is a manager from token
            try {
                const tokenPayload = JSON.parse(atob(token.split(".")[1]));
                const role = tokenPayload.role || tokenPayload.role;
                setIsManager(role === "fleet_manager" || role === "manager");
            } catch (e) {
                setIsManager(false);
            }

            const response = await fetch(`${API_BASE}/fleet/current-plan`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch current plan");
            }

            const data = await response.json();
            const userPlan = data.plan || "starter";

            setPlan(userPlan);
            setHasAccess(requiredPlans.includes(userPlan));
        } catch (error) {
            console.error("Error checking plan access:", error);
            setPlan("starter");
            setHasAccess(false);
        } finally {
            setLoading(false);
        }
    };

    // Get the appropriate sidebar
    const Sidebar = isManager ? ManagerSidebar : DashSidebar;

    if (loading) {
        return (
            <Sidebar>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E43A3] mx-auto" />
                        <p
                            className="mt-4 text-[#8E98A8]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Checking access...
                        </p>
                    </div>
                </div>
            </Sidebar>
        );
    }

    if (!hasAccess) {
        const redirectPath = isManager
            ? "/manager/dashboard"
            : "/fleet/billing";
        const buttonText = isManager ? "Go to Dashboard" : "Upgrade Plan";

        return (
            <Sidebar>
                <div className="flex items-center justify-center min-h-[400px] p-6">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-sm border border-[#E5E7EB]">
                        <div className="w-16 h-16 rounded-full bg-[#F2A61820] flex items-center justify-center mx-auto mb-4">
                            <Lock size={32} className="text-[#F2A618]" />
                        </div>
                        <h3
                            className="text-2xl font-bold text-[#1F083B] mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Upgrade Required
                        </h3>
                        <p
                            className="text-[#5B646F] mb-4"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Reports are available on <strong>Pro</strong> and{" "}
                            <strong>Enterprise</strong> plans.
                        </p>
                        <p
                            className="text-sm text-[#8E98A8] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Your current plan:{" "}
                            <span className="font-semibold text-[#1F083B]">
                                {plan?.charAt(0).toUpperCase() +
                                    plan?.slice(1) || "Starter"}
                            </span>
                        </p>
                        <button
                            onClick={() =>
                                (window.location.href = redirectPath)
                            }
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </Sidebar>
        );
    }

    // Render the actual content (the component already has its own sidebar)
    return <>{children}</>;
};

export default PlanGuard;
