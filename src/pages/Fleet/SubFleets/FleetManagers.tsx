import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    UserPlus,
    Eye,
    Mail,
    UserX,
    Trash2,
    Shield,
    AlertTriangle,
    CheckCircle,
    Users,
    UserCheck,
    UserMinus,
    Clock,
    UserCog,
    Ban,
    RefreshCw,
    MoreVertical,
    ArrowRight,
    X,
} from "lucide-react";

// API functions
const API_BASE = "https://backend-production-01de.up.railway.app";

interface Manager {
    id: string;
    userId: string;
    fleetCompanyId: string;
    subFleetId: string;
    role: "owner" | "manager";
    status: "active" | "suspended" | "invited" | "pending";
    invitedAt: string;
    acceptedAt: string | null;
    lastActive: string | null;
    inviteToken: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        identifier: string;
        authMethod: string;
        phoneNumber: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        gender: string | null;
        dateOfBirth: string | null;
        occupation: string | null;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        hasCompletedOnboarding: boolean;
        otpCode: string | null;
        otpExpiresAt: string | null;
        role: string;
        isActive: boolean;
        refreshToken: string;
        deviceTokens: any[];
        notificationPreferences: string | null;
        createdAt: string;
        updatedAt: string;
    };
    subFleet: {
        id: string;
        fleetCompanyId: string;
        name: string;
        region: string;
        managerId: string | null;
        status: string;
        vehicleCount: number;
        driverCount: number;
        createdAt: string;
        updatedAt: string;
    };
}

interface ManagerStats {
    totalManagers: number;
    activeManagers: number;
    pendingInvites: number;
    suspendedManagers: number;
    signedInThisWeek: number;
    awaitingSetup: number;
    accountDeactivated: number;
    planLimit: number;
}

interface SubFleet {
    id: string;
    fleetCompanyId: string;
    name: string;
    region: string;
    managerId: string | null;
    status: string;
    vehicleCount: number;
    driverCount: number;
    createdAt: string;
    updatedAt: string;
}

const FleetManagers: React.FC = () => {
    const [managers, setManagers] = useState<Manager[]>([]);
    const [stats, setStats] = useState<ManagerStats>({
        totalManagers: 0,
        activeManagers: 0,
        pendingInvites: 0,
        suspendedManagers: 0,
        signedInThisWeek: 0,
        awaitingSetup: 0,
        accountDeactivated: 0,
        planLimit: 10,
    });
    const [showViewModal, setShowViewModal] = useState(false);

    const [subscription, setSubscription] = useState<any>(null);
    const [subFleets, setSubFleets] = useState<SubFleet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<any>(null);
    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showResendModal, setShowResendModal] = useState(false);
    const [selectedManager, setSelectedManager] = useState<Manager | null>(
        null,
    );
    const [successTitle, setSuccessTitle] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccessAction, setShowSuccessAction] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isResending, setIsResending] = useState(false);

    // Invite form state
    const [inviteForm, setInviteForm] = useState({
        fullName: "",
        email: "",
        role: "manager",
        subFleetId: "",
    });

    const fetchSubscription = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/subscription`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch subscription");
            }

            const data = await response.json();
            setSubscription(data);

            // Update plan limit from subscription
            if (data?.features?.fleetManagerAccount) {
                setStats((prev) => ({
                    ...prev,
                    planLimit: data.features.fleetManagerAccount,
                }));
            }
        } catch (error) {
            console.error("Error fetching subscription:", error);
        }
    };

    // Fetch managers data
    const fetchManagers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/managers`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch managers");
            }

            const data = await response.json();
            const managersData = Array.isArray(data) ? data : [];
            setManagers(managersData);

            // Update stats
            const total = managersData.length;
            const active = managersData.filter(
                (m: Manager) => m.status === "active",
            ).length;
            const pending = managersData.filter(
                (m: Manager) =>
                    m.status === "pending" || m.status === "invited",
            ).length;
            const suspended = managersData.filter(
                (m: Manager) => m.status === "suspended",
            ).length;

            setStats((prev) => ({
                ...prev,
                totalManagers: total,
                activeManagers: active,
                pendingInvites: pending,
                suspendedManagers: suspended,
            }));
        } catch (error) {
            console.error("Error fetching managers:", error);
            setManagers([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/managers/stats`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch stats");
            }

            const data = await response.json();
            setStats((prev) => ({
                ...prev,
                ...data,
            }));
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    // Fetch sub-fleets
    const fetchSubFleets = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/sub-fleets`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch sub-fleets");
            }

            const data = await response.json();
            const fleets = Array.isArray(data) ? data : [];
            setSubFleets(fleets);

            // Set default sub-fleet if available
            if (fleets.length > 0 && !inviteForm.subFleetId) {
                setInviteForm((prev) => ({
                    ...prev,
                    subFleetId: fleets[0].id,
                }));
            }
        } catch (error) {
            console.error("Error fetching sub-fleets:", error);
            setSubFleets([]);
        }
    };

    useEffect(() => {
        fetchManagers();
        fetchStats();
        fetchSubFleets();
        fetchSubscription();
    }, []);

    // Add this useEffect to close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown) {
                const target = event.target as HTMLElement;
                if (!target.closest(".relative")) {
                    setActiveDropdown(null);
                }
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [activeDropdown]);

    // Invite manager
    const handleInvite = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/managers/invite`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(inviteForm),
            });

            // Parse the response body once
            const data = await response.json();

            if (!response.ok) {
                // Check if it's a plan limit error
                if (
                    response.status === 403 &&
                    data.code === "PLAN_LIMIT_REACHED"
                ) {
                    setErrorDetails(data);
                    setShowInviteModal(false);
                    setShowErrorModal(true);
                    setIsSubmitting(false);
                    return;
                }

                throw new Error(data.message || "Failed to send invitation");
            }

            // Success case
            setShowInviteModal(false);
            setSuccessTitle("Invitation Sent");
            setSuccessMessage(
                `An invitation has been sent to ${inviteForm.email}. The user will receive an email with instructions to join your fleet.`,
            );
            setShowSuccessModal(true);
            setShowSuccessAction(true);
            setInviteForm({
                fullName: "",
                email: "",
                role: "manager",
                subFleetId: subFleets[0]?.id || "",
            });
            fetchManagers();
            fetchStats();
        } catch (error: any) {
            console.error("Error inviting manager:", error);
            // If we get here with a plan limit error that wasn't caught above
            if (
                error.message?.includes("limit") ||
                error.message?.includes("plan")
            ) {
                setErrorDetails({
                    message: error.message,
                    code: "PLAN_LIMIT_REACHED",
                    details: {
                        current: 3,
                        limit: 3,
                        plan: "starter",
                        feature: "managers",
                    },
                });
                setShowInviteModal(false);
                setShowErrorModal(true);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update manager status
    const handleUpdateStatus = async (managerId: string, status: string) => {
        try {
            setIsUpdating(true);
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE}/fleet/managers/${managerId}/status`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status }),
                },
            );

            if (!response.ok) {
                throw new Error("Failed to update manager status");
            }

            const data = await response.json();

            // Close modals
            setShowSuspendModal(false);
            setShowReactivateModal(false);
            setSelectedManager(null);

            // Show success message
            if (status === "suspended") {
                setSuccessTitle("Fleet Manager Suspended Successfully");
                setSuccessMessage(
                    "The Fleet Manager has been suspended and can no longer access the fleet dashboard. You can reactivate this account at any time from the Fleet Managers page.",
                );
            } else if (status === "active") {
                setSuccessTitle("Fleet Manager Reactivated Successfully");
                setSuccessMessage(
                    "The Fleet Manager's account has been reactivated and they can now sign in and access the fleet dashboard again.",
                );
            }
            setShowSuccessModal(true);
            setShowSuccessAction(false);
            fetchManagers();
            fetchStats();
        } catch (error) {
            console.error("Error updating manager status:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Remove manager
    const handleRemoveManager = async (managerId: string) => {
        try {
            setIsRemoving(true);
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE}/fleet/managers/${managerId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to remove manager");
            }

            setShowRemoveModal(false);
            setSelectedManager(null);
            setSuccessTitle("Fleet Manager Removed Successfully");
            setSuccessMessage(
                "The Fleet Manager has been removed from your organization and no longer has access to the fleet dashboard.\n\nYou can invite them again at any time if needed.",
            );
            setShowSuccessModal(true);
            setShowSuccessAction(false);
            fetchManagers();
            fetchStats();
        } catch (error) {
            console.error("Error removing manager:", error);
        } finally {
            setIsRemoving(false);
        }
    };

    const handleResendInvitation = async (managerId: string) => {
        try {
            setIsResending(true);
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE}/fleet/managers/${managerId}/resend`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to resend invitation");
            }

            setShowResendModal(false);
            setSelectedManager(null);
            setSuccessTitle("Invitation Resent");
            setSuccessMessage(
                `A new invitation has been sent to ${selectedManager?.user.email}. They can now complete their account setup.`,
            );
            setShowSuccessModal(true);
            setShowSuccessAction(false);
        } catch (error) {
            console.error("Error resending invitation:", error);
        } finally {
            setIsResending(false);
        }
    };

    const StatCard = ({
        icon: Icon,
        label,
        value,
        subtext,
        valueColor,
    }: any) => (
        <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
            <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                {Icon && (
                    <Icon
                        size={18}
                        className={valueColor || "text-[#6E43A3]"}
                    />
                )}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div
                className={`text-3xl font-bold ${valueColor || "text-[#03272E]"}`}
            >
                {value}
            </div>
            {subtext && (
                <div className="text-xs text-[#8E98A8] mt-1">{subtext}</div>
            )}
        </div>
    );

    // Get initials from name
    const getInitials = (manager: Manager) => {
        const firstName = manager.user?.firstName || "";
        const lastName = manager.user?.lastName || "";
        if (!firstName && !lastName) return "??";
        return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "-";
        try {
            return new Date(dateString).toLocaleDateString("en-CA");
        } catch {
            return "-";
        }
    };
    // Get status color
    const getStatusColor = (status: string) => {
        if (!status) return "text-gray-500 bg-gray-100";
        switch (status) {
            case "active":
                return "text-[#2E7D32] bg-[#2E7D3224]";
            case "suspended":
                return "text-[#FE3F21] bg-[#FE3F2124]";
            case "invited":
            case "pending":
                return "text-[#F2A618] bg-[#F2A61824]";
            default:
                return "text-gray-500 bg-gray-100";
        }
    };

    // Get role color
    const getRoleColor = (role: string) => {
        if (!role) return "text-gray-500 bg-gray-100";
        return role === "owner"
            ? "text-[#2E7D32] bg-[#2E7D3224]"
            : "text-[#6E43A3] bg-[#6E43A324]";
    };

    const filteredManagers = managers.filter((manager) => {
        const searchLower = searchTerm.toLowerCase();
        const fullName =
            manager.user?.firstName && manager.user?.lastName
                ? `${manager.user.firstName} ${manager.user.lastName}`
                : "";
        const email = manager.user?.email || "";
        const nameMatch = fullName.toLowerCase().includes(searchLower);
        const emailMatch = email.toLowerCase().includes(searchLower);
        const matchesSearch = nameMatch || emailMatch;
        const matchesStatus =
            selectedStatus === "all" || manager.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    const totalItems = filteredManagers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentManagers = filteredManagers.slice(startIndex, endIndex);
    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus]);
    return (
        <div className="min-h-screen bg-[#F7F7F7] p-6">
            <div className="max-w-[1190px] mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-xl p-6 flex justify-between items-center">
                    <div>
                        <h1
                            className="text-2xl font-bold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Fleet Managers
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className="text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {stats.totalManagers} accounts
                            </span>
                            <span
                                className="text-[#8E98A8] text-sm"
                                style={{ fontFamily: "Outfit" }}
                            >
                                • {subscription?.plan} plan allows up to{" "}
                                {stats.planLimit}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-[#6E43A3] text-white px-6 py-2.5 rounded-xl hover:opacity-90 transition flex items-center gap-2"
                        style={{ fontFamily: "Outfit" }}
                    >
                        <UserPlus size={20} />
                        Invite Manager
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4 flex-wrap">
                    <StatCard
                        label="Total Managers"
                        value={stats.totalManagers}
                        subtext={`${subscription?.plan} allows ${stats.planLimit}`}
                        valueColor="text-[#6E43A3]"
                    />

                    <StatCard
                        label="Active Managers"
                        value={stats.activeManagers}
                        subtext={`Signed in this week`}
                        valueColor="text-[#6DE28E]"
                    />

                    <StatCard
                        label="Pending Invites"
                        value={stats.pendingInvites}
                        subtext={`Awaiting setup`}
                        valueColor="text-[#F2A618]"
                    />

                    <StatCard
                        label="Suspended Managers"
                        value={stats.suspendedManagers}
                        subtext={`Account deactivated`}
                        valueColor="text-[#FE3F21]"
                    />
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl p-6">
                    {/* Table Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2
                            className="text-lg font-semibold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            All Managers ({totalItems})
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E98A8]"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Search managers..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 pr-4 py-2 bg-[#F8F8F8] rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-[#8E98A8]" />
                                <select
                                    value={selectedStatus}
                                    onChange={(e) =>
                                        setSelectedStatus(e.target.value)
                                    }
                                    className="bg-[#F8F8F8] px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="invited">Invited</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#E0E5EB]">
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Manager
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Role
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Sub-fleet
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Joined Date
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Status
                                    </th>
                                    <th
                                        className="text-right py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    ></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            Loading managers...
                                        </td>
                                    </tr>
                                ) : currentManagers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            No managers found
                                        </td>
                                    </tr>
                                ) : (
                                    currentManagers.map((manager) => (
                                        <tr
                                            key={manager.id}
                                            className="border-b border-[#E0E5EB] hover:bg-[#F7F7F7] transition"
                                        >
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#EDE8F4] flex items-center justify-center text-[#6E43A3] font-semibold">
                                                        {getInitials(manager)}
                                                    </div>
                                                    <div>
                                                        <div
                                                            className="text-sm font-medium text-[#111827]"
                                                            style={{
                                                                fontFamily:
                                                                    "Outfit",
                                                            }}
                                                        >
                                                            {manager.user
                                                                ?.firstName &&
                                                            manager.user
                                                                ?.lastName
                                                                ? `${manager.user.firstName} ${manager.user.lastName}`
                                                                : "Unknown"}
                                                        </div>
                                                        <div
                                                            className="text-xs text-[#8E98A8]"
                                                            style={{
                                                                fontFamily:
                                                                    "Outfit",
                                                            }}
                                                        >
                                                            {manager.user
                                                                ?.email || ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getRoleColor(manager.role)}`}
                                                >
                                                    <Shield size={14} />
                                                    {manager.role
                                                        ? manager.role
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          manager.role.slice(1)
                                                        : "Manager"}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#111827]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {manager.subFleet?.name ||
                                                        "-"}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#111827]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {formatDate(
                                                        manager.acceptedAt ||
                                                            manager.createdAt,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(manager.status)}`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {manager.status
                                                        ? manager.status
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          manager.status.slice(
                                                              1,
                                                          )
                                                        : "Unknown"}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedManager(
                                                                manager,
                                                            );
                                                            setActiveDropdown(
                                                                activeDropdown ===
                                                                    manager.id
                                                                    ? null
                                                                    : manager.id,
                                                            );
                                                        }}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                                                    >
                                                        <MoreVertical
                                                            size={18}
                                                            className="text-[#8E98A8]"
                                                        />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {activeDropdown ===
                                                        manager.id && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E0E5EB] min-w-[180px] z-10 py-1">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdown(
                                                                        null,
                                                                    );
                                                                    setShowViewModal(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-[#0B0015] hover:bg-[#F7F7F7] flex items-center gap-2"
                                                            >
                                                                <Eye
                                                                    size={16}
                                                                />
                                                                View Details
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    if (
                                                                        manager.status ===
                                                                            "invited" ||
                                                                        manager.status ===
                                                                            "pending"
                                                                    ) {
                                                                        setShowResendModal(
                                                                            true,
                                                                        );
                                                                    }
                                                                    setActiveDropdown(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-[#0B0015] hover:bg-[#F7F7F7] flex items-center gap-2"
                                                            >
                                                                <Mail
                                                                    size={16}
                                                                />
                                                                Send Mail
                                                            </button>

                                                            {manager.status !==
                                                                "suspended" &&
                                                                manager.status !==
                                                                    "pending" &&
                                                                manager.status !==
                                                                    "invited" && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowSuspendModal(
                                                                                true,
                                                                            );
                                                                            setActiveDropdown(
                                                                                null,
                                                                            );
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm text-[#F2A618] hover:bg-[#F7F7F7] flex items-center gap-2"
                                                                    >
                                                                        <Ban
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                        Suspend
                                                                    </button>
                                                                )}

                                                            {manager.status ===
                                                                "suspended" && (
                                                                <button
                                                                    onClick={() => {
                                                                        setShowReactivateModal(
                                                                            true,
                                                                        );
                                                                        setActiveDropdown(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-[#6DE28E] hover:bg-[#F7F7F7] flex items-center gap-2"
                                                                >
                                                                    <RefreshCw
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                    Reactivate
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => {
                                                                    setShowRemoveModal(
                                                                        true,
                                                                    );
                                                                    setActiveDropdown(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-[#B71C1C] hover:bg-[#F7F7F7] flex items-center gap-2 border-t border-[#E0E5EB] mt-1 pt-1"
                                                            >
                                                                <Trash2
                                                                    size={16}
                                                                />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalItems > 0 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E0E5EB]">
                            <div
                                className="flex items-center gap-3 text-sm text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                <span>Show</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-2 py-1 border border-[#E0E5EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>entries</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(prev - 1, 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg border border-[#E0E5EB] transition ${
                                        currentPage === 1
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-[#F7F7F7] hover:border-[#6E43A3]"
                                    }`}
                                >
                                    <svg
                                        className="w-4 h-4 text-[#8E98A8]"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>

                                {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (
                                            currentPage >=
                                            totalPages - 2
                                        ) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() =>
                                                    setCurrentPage(pageNum)
                                                }
                                                className={`w-8 h-8 rounded-lg text-sm transition ${
                                                    currentPage === pageNum
                                                        ? "bg-[#6E43A3] text-white"
                                                        : "text-[#8E98A8] hover:bg-[#F7F7F7]"
                                                }`}
                                                style={{ fontFamily: "Outfit" }}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    },
                                )}

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(prev + 1, totalPages),
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg border border-[#E0E5EB] transition ${
                                        currentPage === totalPages
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-[#F7F7F7] hover:border-[#6E43A3]"
                                    }`}
                                >
                                    <svg
                                        className="w-4 h-4 text-[#8E98A8]"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ERROR / WARNING MODAL (Plan Limit) */}

            {showErrorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#FFEED4] flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle
                                size={32}
                                className="text-[#F09205]"
                            />
                        </div>
                        <h3
                            className="text-2xl font-bold text-[#1F083B] text-center mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Upgrade Required
                        </h3>
                        <p
                            className="text-[#5B646F] text-center mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            You've Reached Your Plan Limit. Your current
                            subscription has reached its limit for this feature.
                        </p>
                        <p
                            className="text-[#5B646F] text-sm text-center mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Upgrade your plan to unlock additional Fleet
                            Managers, sub-fleets, and more advanced fleet
                            management capabilities.
                        </p>
                        <div className="flex items-center justify-between bg-[#4C577D05] rounded-xl px-4 py-3 mb-3 border border-[#E0E5EB]">
                            <span className="text-[#5B646F] text-sm">
                                Current Plan:
                            </span>
                            <span className="text-[#6E43A3] font-semibold text-sm">
                                {errorDetails?.details?.plan
                                    ? errorDetails.details.plan
                                          .charAt(0)
                                          .toUpperCase() +
                                      errorDetails.details.plan.slice(1)
                                    : "Starter"}{" "}
                                Fleet
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-[#4C577D05] rounded-xl px-4 py-3 mb-6 border border-[#E0E5EB]">
                            <span className="text-[#5B646F] text-sm">
                                Managers:
                            </span>
                            <span className="text-[#1F083B] font-semibold text-sm">
                                {errorDetails?.details?.current || 0} /{" "}
                                {errorDetails?.details?.limit || 0}
                            </span>
                        </div>
                        <div className="flex flex-col-reverse gap-3">
                            <button
                                onClick={() => {
                                    setShowErrorModal(false);
                                    setErrorDetails(null);
                                }}
                                className="w-full px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Navigate to subscription/plans page
                                    setShowErrorModal(false);
                                    setErrorDetails(null);
                                    // window.location.href = '/subscription';
                                    // or use your router
                                }}
                                className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Upgrade Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#D6F5DA] flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-[#267F50]" />
                        </div>
                        <h3
                            className="text-2xl font-bold text-[#1F083B] mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {successTitle}
                        </h3>
                        <p
                            className="text-[#5B646F] mb-6 whitespace-pre-line"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {successMessage}
                        </p>

                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                setShowSuccessAction(false);
                            }}
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Done
                        </button>

                        {showSuccessAction && (
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setShowInviteModal(true);
                                    setShowSuccessAction(false);
                                }}
                                className="w-full text-[#6E43A3] text-sm mt-3 hover:underline transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Invite Another
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* INVITE MANAGER MODAL */}
            {/* {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <h3
                            className="text-2xl font-bold text-[#1F083B] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Invite Manager
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label
                                    className="block text-sm text-[#5B646F] mb-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={inviteForm.fullName}
                                    onChange={(e) =>
                                        setInviteForm((prev) => ({
                                            ...prev,
                                            fullName: e.target.value,
                                        }))
                                    }
                                    placeholder="Abiodun Adeniji"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
                                />
                            </div>
                            <div>
                                <label
                                    className="block text-sm text-[#5B646F] mb-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Work Email
                                </label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) =>
                                        setInviteForm((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="abiodun@acme.ng"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
                                />
                            </div>
                            <div>
                                <label
                                    className="block text-sm text-[#5B646F] mb-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Role
                                </label>
                                <select
                                    value={inviteForm.role}
                                    onChange={(e) =>
                                        setInviteForm((prev) => ({
                                            ...prev,
                                            role: e.target.value,
                                        }))
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    <option value="manager">Manager</option>
                                    <option value="owner">Owner</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    className="block text-sm text-[#5B646F] mb-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Sub-fleet
                                </label>
                                <select
                                    value={inviteForm.subFleetId}
                                    onChange={(e) =>
                                        setInviteForm((prev) => ({
                                            ...prev,
                                            subFleetId: e.target.value,
                                        }))
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {subFleets.map((fleet) => (
                                        <option key={fleet.id} value={fleet.id}>
                                            {fleet.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="flex-1 px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInvite}
                                className="flex-1 bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )} */}

            {/* SUSPEND MANAGER MODAL */}
            {showSuspendModal && selectedManager && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#F2A61820] flex items-center justify-center mx-auto mb-4">
                            <Ban size={32} style={{ color: "#F2A618" }} />
                        </div>
                        <h3
                            className="text-xl font-bold text-center"
                            style={{ fontFamily: "Outfit", color: "#1F083B" }}
                        >
                            Suspend Manager?
                        </h3>
                        <p
                            className="mt-4 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#5B646F" }}
                        >
                            <strong>
                                {selectedManager.user?.firstName}{" "}
                                {selectedManager.user?.lastName}
                            </strong>{" "}
                            will be temporarily blocked from signing in. You can
                            reactivate later.
                        </p>
                        <div
                            className="mt-6 h-px w-full"
                            style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <p
                            className="mt-6 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            Suspending this manager will temporarily disable
                            their access to the fleet dashboard. All their
                            assigned permissions and data will remain saved and
                            can be restored by reactivating the account.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3">
                            <button
                                onClick={() => {
                                    setShowSuspendModal(false);
                                    setSelectedManager(null);
                                }}
                                disabled={isUpdating}
                                className="w-full rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    borderColor: "#D1D5DB",
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() =>
                                    handleUpdateStatus(
                                        selectedManager.id,
                                        "suspended",
                                    )
                                }
                                disabled={isUpdating}
                                className="w-full rounded-xl px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: "#B71C1C",
                                    fontFamily: "Outfit",
                                }}
                            >
                                {isUpdating ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
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
                                        Suspending...
                                    </>
                                ) : (
                                    "Suspend Manager"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REACTIVATE MANAGER MODAL */}
            {showReactivateModal && selectedManager && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#6DE28E20] flex items-center justify-center mx-auto mb-4">
                            <RefreshCw size={32} style={{ color: "#6DE28E" }} />
                        </div>
                        <h3
                            className="text-xl font-bold text-center"
                            style={{ fontFamily: "Outfit", color: "#1F083B" }}
                        >
                            Reactivate Manager?
                        </h3>
                        <p
                            className="mt-4 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#5B646F" }}
                        >
                            <strong>
                                {selectedManager.user?.firstName}{" "}
                                {selectedManager.user?.lastName}
                            </strong>{" "}
                            will regain access to the fleet dashboard.
                        </p>
                        <div
                            className="mt-6 h-px w-full"
                            style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <p
                            className="mt-6 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            Reactivating this manager will restore their access
                            to the fleet dashboard and all previously assigned
                            permissions.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3">
                            <button
                                onClick={() => {
                                    setShowReactivateModal(false);
                                    setSelectedManager(null);
                                }}
                                disabled={isUpdating}
                                className="w-full rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    borderColor: "#D1D5DB",
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() =>
                                    handleUpdateStatus(
                                        selectedManager.id,
                                        "active",
                                    )
                                }
                                disabled={isUpdating}
                                className="w-full rounded-xl px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: "#6E43A3",
                                    fontFamily: "Outfit",
                                }}
                            >
                                {isUpdating ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
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
                                        Reactivating...
                                    </>
                                ) : (
                                    "Reactivate Manager"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESEND INVITATION MODAL */}
            {showResendModal && selectedManager && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#6E43A320] flex items-center justify-center mx-auto mb-4">
                            <Mail size={32} style={{ color: "#6E43A3" }} />
                        </div>
                        <h3
                            className="text-xl font-bold text-center"
                            style={{ fontFamily: "Outfit", color: "#1F083B" }}
                        >
                            Resend Invitation?
                        </h3>
                        <p
                            className="mt-4 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#5B646F" }}
                        >
                            Are you sure you want to resend the invitation email
                            to{" "}
                            <strong>
                                {selectedManager.user?.firstName}{" "}
                                {selectedManager.user?.lastName}
                            </strong>
                            ?
                        </p>
                        <div
                            className="mt-6 h-px w-full"
                            style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <p
                            className="mt-6 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            A new invitation will be sent to the Fleet Manager,
                            allowing them to complete their account setup. The
                            previous invitation link will expire.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3">
                            <button
                                onClick={() => {
                                    setShowResendModal(false);
                                    setSelectedManager(null);
                                }}
                                disabled={isResending}
                                className="w-full rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    borderColor: "#D1D5DB",
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() =>
                                    handleResendInvitation(selectedManager.id)
                                }
                                disabled={isResending}
                                className="w-full rounded-xl px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: "#6E43A3",
                                    fontFamily: "Outfit",
                                }}
                            >
                                {isResending ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
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
                                        Resending...
                                    </>
                                ) : (
                                    "Resend Invitation"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REMOVE MANAGER MODAL */}
            {showRemoveModal && selectedManager && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#B71C1C20] flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} style={{ color: "#B71C1C" }} />
                        </div>
                        <h3
                            className="text-xl font-bold text-center"
                            style={{ fontFamily: "Outfit", color: "#1F083B" }}
                        >
                            Remove Fleet Manager?
                        </h3>
                        <p
                            className="mt-4 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#5B646F" }}
                        >
                            Are you sure you want to remove{" "}
                            <strong>
                                {selectedManager.user?.firstName}{" "}
                                {selectedManager.user?.lastName}
                            </strong>
                            ?
                        </p>
                        <div
                            className="mt-6 h-px w-full"
                            style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <p
                            className="mt-6 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            They will immediately lose access to the fleet
                            dashboard and all assigned permissions. This action
                            can be reversed by inviting them again.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3">
                            <button
                                onClick={() => {
                                    setShowRemoveModal(false);
                                    setSelectedManager(null);
                                }}
                                disabled={isRemoving}
                                className="w-full rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    borderColor: "#D1D5DB",
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() =>
                                    handleRemoveManager(selectedManager.id)
                                }
                                disabled={isRemoving}
                                className="w-full rounded-xl px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: "#B71C1C",
                                    fontFamily: "Outfit",
                                }}
                            >
                                {isRemoving ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
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
                                        Removing...
                                    </>
                                ) : (
                                    "Remove Manager"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* VIEW MANAGER DETAILS MODAL */}
            {showViewModal && selectedManager && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Manager Details
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Manager profile, scope, and assignments.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedManager(null);
                                }}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        {/* Manager Profile - White background */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#EDE8F4] flex items-center justify-center text-[#6E43A3] font-semibold text-lg">
                                    {getInitials(selectedManager)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="text-base font-bold text-[#1A2A3F]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {selectedManager.user?.firstName}{" "}
                                            {selectedManager.user?.lastName}
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getRoleColor(selectedManager.role)}`}
                                        >
                                            <Shield size={12} />
                                            {selectedManager.role
                                                ? selectedManager.role
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  selectedManager.role.slice(1)
                                                : "Manager"}
                                        </span>
                                    </div>
                                    <div
                                        className="text-sm text-[#5B646F]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {selectedManager.user?.email || ""}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(selectedManager.status)}`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {selectedManager.status
                                        ? selectedManager.status
                                              .charAt(0)
                                              .toUpperCase() +
                                          selectedManager.status.slice(1)
                                        : "Unknown"}
                                </span>
                            </div>
                        </div>

                        {/* Stats Cards - Greyish background */}
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="bg-[#7A84921A] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Sub-fleet
                                </div>
                                <div
                                    className="text-base font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedManager.subFleet?.name || "-"}
                                </div>
                            </div>
                            <div className="bg-[#7A84921A] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Vehicles
                                </div>
                                <div
                                    className="text-base font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedManager.subFleet?.vehicleCount ||
                                        0}
                                </div>
                            </div>
                            <div className="bg-[#7A84921A] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Drivers
                                </div>
                                <div
                                    className="text-base font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedManager.subFleet?.driverCount || 0}
                                </div>
                            </div>
                        </div>

                        {/* Divider before actions */}
                        <div className="h-px w-full bg-[#E5E7EB] my-6" />

                        {/* Action Buttons with Icons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedManager(null);
                                    setShowRemoveModal(true);
                                }}
                                className="flex-1 px-6 py-3 rounded-xl text-[#B71C1C] border border-[#B71C1C] hover:bg-[#B71C1C] hover:text-white transition flex items-center justify-center gap-2"
                                style={{ fontFamily: "Outfit" }}
                            >
                                <Trash2 size={18} />
                                Remove Manager
                            </button>
                            {selectedManager.status === "suspended" ? (
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedManager(selectedManager);
                                        setShowReactivateModal(true);
                                    }}
                                    className="flex-1 bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    <RefreshCw size={18} />
                                    Reactivate
                                </button>
                            ) : selectedManager.status === "pending" ||
                              selectedManager.status === "invited" ? (
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedManager(selectedManager);
                                        setShowResendModal(true);
                                    }}
                                    className="flex-1 bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    <Mail size={18} />
                                    Resend Invite
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedManager(selectedManager);
                                        setShowSuspendModal(true);
                                    }}
                                    className="flex-1 bg-[#F2A618] text-white px-6 py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    <Ban size={18} />
                                    Suspend Manager
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* INVITE MANAGER MODAL - Updated with wider width, divider, and button states */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Invite Manager
                                </h3>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Send an invitation to add a new manager to
                                    your fleet
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className="block text-sm font-medium text-[#5B646F] mb-1.5"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={inviteForm.fullName}
                                        onChange={(e) =>
                                            setInviteForm((prev) => ({
                                                ...prev,
                                                fullName: e.target.value,
                                            }))
                                        }
                                        placeholder="Abiodun Adeniji"
                                        className="w-full px-4 py-3 rounded-xl border border-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-sm font-medium text-[#5B646F] mb-1.5"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Work Email
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteForm.email}
                                        onChange={(e) =>
                                            setInviteForm((prev) => ({
                                                ...prev,
                                                email: e.target.value,
                                            }))
                                        }
                                        placeholder="abiodun@acme.ng"
                                        className="w-full px-4 py-3 rounded-xl border border-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className="block text-sm font-medium text-[#5B646F] mb-1.5"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Role
                                    </label>
                                    <select
                                        value={inviteForm.role}
                                        onChange={(e) =>
                                            setInviteForm((prev) => ({
                                                ...prev,
                                                role: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 rounded-xl border border-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-[#6E43A3] bg-white"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        <option value="manager">Manager</option>
                                        <option value="owner">Owner</option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        className="block text-sm font-medium text-[#5B646F] mb-1.5"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Sub-fleet
                                    </label>
                                    <select
                                        value={inviteForm.subFleetId}
                                        onChange={(e) =>
                                            setInviteForm((prev) => ({
                                                ...prev,
                                                subFleetId: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 rounded-xl border border-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-[#6E43A3] bg-white"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {subFleets.map((fleet) => (
                                            <option
                                                key={fleet.id}
                                                value={fleet.id}
                                            >
                                                {fleet.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="flex-1 px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={
                                    !inviteForm.fullName ||
                                    !inviteForm.email ||
                                    !inviteForm.subFleetId ||
                                    isSubmitting
                                }
                                className={`flex-1 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:cursor-not-allowed ${
                                    !inviteForm.fullName ||
                                    !inviteForm.email ||
                                    !inviteForm.subFleetId
                                        ? "bg-[#8E98A8] text-white"
                                        : "bg-[#6E43A3] text-white hover:opacity-90"
                                }`}
                                style={{ fontFamily: "Outfit" }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
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
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Invite <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FleetManagers;
