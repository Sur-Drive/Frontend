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
        <div className="min-h-screen bg-[#F7F7F7] p-3 sm:p-4 md:p-6">
            <div className="mx-auto max-w-[1190px] space-y-3 sm:space-y-4 md:space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                            Fleet Managers
                        </h1>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-[#8E98A8] sm:gap-2">
                            <span>{stats.totalManagers} accounts</span>
                            <span>
                                • {subscription?.plan} plan allows up to{" "}
                                {stats.planLimit}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#6E43A3] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95 sm:px-6 sm:py-2.5"
                    >
                        <UserPlus size={18} className="sm:size-[20px]" />
                        <span>Invite Manager</span>
                    </button>
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                    <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
                        <p className="text-xs text-[#8E98A8] sm:text-sm">
                            Total Managers
                        </p>
                        <p className="mt-1 text-xl font-bold text-[#6E43A3] sm:text-2xl">
                            {stats.totalManagers}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            {subscription?.plan} allows {stats.planLimit}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
                        <p className="text-xs text-[#8E98A8] sm:text-sm">
                            Active Managers
                        </p>
                        <p className="mt-1 text-xl font-bold text-[#6DE28E] sm:text-2xl">
                            {stats.activeManagers}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Signed in this week
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
                        <p className="text-xs text-[#8E98A8] sm:text-sm">
                            Pending Invites
                        </p>
                        <p className="mt-1 text-xl font-bold text-[#F2A618] sm:text-2xl">
                            {stats.pendingInvites}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Awaiting setup
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
                        <p className="text-xs text-[#8E98A8] sm:text-sm">
                            Suspended Managers
                        </p>
                        <p className="mt-1 text-xl font-bold text-[#FE3F21] sm:text-2xl">
                            {stats.suspendedManagers}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Account deactivated
                        </p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4 md:p-6">
                    {/* Table Header */}
                    <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-base font-semibold text-[#1F083B] sm:text-lg">
                            All Managers ({totalItems})
                        </h2>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <div className="relative w-full sm:w-48 md:w-64">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    placeholder="Search managers..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full rounded-xl bg-[#F8F8F8] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-[#8E98A8]" />
                                <select
                                    value={selectedStatus}
                                    onChange={(e) =>
                                        setSelectedStatus(e.target.value)
                                    }
                                    className="rounded-xl bg-[#F8F8F8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3] sm:px-4"
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

                    {/* Responsive Cards View - Mobile */}
                    <div className="space-y-3 sm:hidden">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                Loading managers...
                            </div>
                        ) : currentManagers.length === 0 ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                No managers found
                            </div>
                        ) : (
                            currentManagers.map((manager) => {
                                const isDropdownOpen =
                                    activeDropdown === manager.id;
                                return (
                                    <div
                                        key={manager.id}
                                        className="rounded-lg border border-[#E0E5EB] bg-white p-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE8F4] text-sm font-semibold text-[#6E43A3]">
                                                    {getInitials(manager)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium text-[#111827]">
                                                        {manager.user
                                                            ?.firstName ||
                                                        manager.user?.lastName
                                                            ? `${manager.user?.firstName || ""} ${manager.user?.lastName || ""}`.trim()
                                                            : "Unknown"}
                                                    </div>
                                                    <div className="truncate text-xs text-[#8E98A8]">
                                                        {manager.user?.email ||
                                                            ""}
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${getStatusColor(manager.status)}`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                                {manager.status
                                                    ? manager.status
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                      manager.status.slice(1)
                                                    : "Unknown"}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E0E5EB] pt-3">
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Role
                                                </p>
                                                <p className="truncate text-xs font-medium text-[#111827]">
                                                    {manager.role
                                                        ? manager.role
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          manager.role.slice(1)
                                                        : "Manager"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Sub-fleet
                                                </p>
                                                <p className="truncate text-xs font-medium text-[#111827]">
                                                    {manager.subFleet?.name ||
                                                        "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Joined
                                                </p>
                                                <p className="truncate text-xs font-medium text-[#111827]">
                                                    {formatDate(
                                                        manager.acceptedAt ||
                                                            manager.createdAt,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-end justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedManager(
                                                            manager,
                                                        );
                                                        setActiveDropdown(
                                                            isDropdownOpen
                                                                ? null
                                                                : manager.id,
                                                        );
                                                    }}
                                                    className="rounded-lg p-2 transition hover:bg-gray-100 active:bg-gray-200"
                                                    aria-label="Open actions menu"
                                                >
                                                    <MoreVertical
                                                        size={20}
                                                        className="text-[#8E98A8]"
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mobile Dropdown */}
                                        {isDropdownOpen && (
                                            <div
                                                className="mt-3 rounded-lg border border-[#E0E5EB] bg-white shadow-lg"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <button
                                                    onClick={() => {
                                                        setActiveDropdown(null);
                                                        setShowViewModal(true);
                                                    }}
                                                    className="flex w-full items-center gap-3 rounded-t-lg px-4 py-3 text-sm text-[#0B0015] transition hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
                                                >
                                                    <Eye size={16} /> View
                                                    Details
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
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#0B0015] transition hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
                                                >
                                                    <Mail size={16} /> Send Mail
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
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#F2A618] transition hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
                                                        >
                                                            <Ban size={16} />{" "}
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
                                                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#6DE28E] transition hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
                                                    >
                                                        <RefreshCw size={16} />{" "}
                                                        Reactivate
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setShowRemoveModal(
                                                            true,
                                                        );
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="flex w-full items-center gap-3 rounded-b-lg border-t border-[#E0E5EB] px-4 py-3 text-sm text-[#B71C1C] transition hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
                                                >
                                                    <Trash2 size={16} /> Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Table View - Tablet and Desktop */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="border-b border-[#E0E5EB]">
                                    <th className="py-2 text-left text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm">
                                        Manager
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] md:table-cell sm:py-3 sm:text-sm">
                                        Role
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] lg:table-cell sm:py-3 sm:text-sm">
                                        Sub-fleet
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] xl:table-cell sm:py-3 sm:text-sm">
                                        Joined Date
                                    </th>
                                    <th className="py-2 text-left text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm">
                                        Status
                                    </th>
                                    <th className="py-2 text-right text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-sm text-[#8E98A8]"
                                        >
                                            Loading managers...
                                        </td>
                                    </tr>
                                ) : currentManagers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-sm text-[#8E98A8]"
                                        >
                                            No managers found
                                        </td>
                                    </tr>
                                ) : (
                                    currentManagers.map((manager) => {
                                        const isDropdownOpen =
                                            activeDropdown === manager.id;
                                        return (
                                            <tr
                                                key={manager.id}
                                                className="border-b border-[#E0E5EB] transition hover:bg-[#F7F7F7]"
                                            >
                                                <td className="py-2 sm:py-3">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE8F4] text-xs font-semibold text-[#6E43A3] sm:h-10 sm:w-10 sm:text-sm">
                                                            {getInitials(
                                                                manager,
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium text-[#111827]">
                                                                {manager.user
                                                                    ?.firstName ||
                                                                manager.user
                                                                    ?.lastName
                                                                    ? `${manager.user?.firstName || ""} ${manager.user?.lastName || ""}`.trim()
                                                                    : "Unknown"}
                                                            </div>
                                                            <div className="truncate text-xs text-[#8E98A8]">
                                                                {manager.user
                                                                    ?.email ||
                                                                    ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden py-2 md:table-cell sm:py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium sm:px-3 ${getRoleColor(manager.role)}`}
                                                    >
                                                        <Shield size={12} />
                                                        {manager.role
                                                            ? manager.role
                                                                  .charAt(0)
                                                                  .toUpperCase() +
                                                              manager.role.slice(
                                                                  1,
                                                              )
                                                            : "Manager"}
                                                    </span>
                                                </td>
                                                <td className="hidden py-2 lg:table-cell sm:py-3">
                                                    <span className="text-sm text-[#111827]">
                                                        {manager.subFleet
                                                            ?.name || "-"}
                                                    </span>
                                                </td>
                                                <td className="hidden py-2 xl:table-cell sm:py-3">
                                                    <span className="text-sm text-[#111827]">
                                                        {formatDate(
                                                            manager.acceptedAt ||
                                                                manager.createdAt,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-2 sm:py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium sm:px-3 ${getStatusColor(manager.status)}`}
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
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
                                                <td className="py-2 text-right sm:py-3">
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedManager(
                                                                    manager,
                                                                );
                                                                setActiveDropdown(
                                                                    isDropdownOpen
                                                                        ? null
                                                                        : manager.id,
                                                                );
                                                            }}
                                                            className="rounded-lg p-1.5 transition hover:bg-gray-100 active:bg-gray-200 sm:p-2"
                                                            aria-label="Open actions menu"
                                                        >
                                                            <MoreVertical
                                                                size={16}
                                                                className="text-[#8E98A8] sm:size-[18px]"
                                                            />
                                                        </button>
                                                        {isDropdownOpen && (
                                                            <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-xl border border-[#E0E5EB] bg-white py-1 shadow-lg sm:min-w-[180px]">
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveDropdown(
                                                                            null,
                                                                        );
                                                                        setShowViewModal(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#0B0015] transition hover:bg-[#F7F7F7] sm:px-4 sm:text-sm"
                                                                >
                                                                    <Eye
                                                                        size={
                                                                            14
                                                                        }
                                                                    />{" "}
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
                                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#0B0015] transition hover:bg-[#F7F7F7] sm:px-4 sm:text-sm"
                                                                >
                                                                    <Mail
                                                                        size={
                                                                            14
                                                                        }
                                                                    />{" "}
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
                                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#F2A618] transition hover:bg-[#F7F7F7] sm:px-4 sm:text-sm"
                                                                        >
                                                                            <Ban
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />{" "}
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
                                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#6DE28E] transition hover:bg-[#F7F7F7] sm:px-4 sm:text-sm"
                                                                    >
                                                                        <RefreshCw
                                                                            size={
                                                                                14
                                                                            }
                                                                        />{" "}
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
                                                                    className="mt-1 flex w-full items-center gap-2 border-t border-[#E0E5EB] px-3 py-2 text-left text-xs text-[#B71C1C] transition hover:bg-[#F7F7F7] sm:px-4 sm:text-sm"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            14
                                                                        }
                                                                    />{" "}
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Responsive */}
                    {totalItems > 0 && (
                        <div className="mt-4 flex flex-col gap-3 border-t border-[#E0E5EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-sm text-[#8E98A8]">
                                <span className="hidden sm:inline">Show</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="rounded-lg border border-[#E0E5EB] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="hidden sm:inline">
                                    entries
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(prev - 1, 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className={`rounded-lg border border-[#E0E5EB] p-1.5 transition sm:p-2 ${
                                        currentPage === 1
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:border-[#6E43A3] hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
                                    }`}
                                >
                                    <svg
                                        className="h-3 w-3 text-[#8E98A8] sm:h-4 sm:w-4"
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
                                                className={`h-7 w-7 rounded-lg text-xs transition sm:h-8 sm:w-8 sm:text-sm ${
                                                    currentPage === pageNum
                                                        ? "bg-[#6E43A3] text-white"
                                                        : "text-[#8E98A8] hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
                                                }`}
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
                                    className={`rounded-lg border border-[#E0E5EB] p-1.5 transition sm:p-2 ${
                                        currentPage === totalPages
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:border-[#6E43A3] hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
                                    }`}
                                >
                                    <svg
                                        className="h-3 w-3 text-[#8E98A8] sm:h-4 sm:w-4"
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
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:p-8">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Manager Details
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Manager profile, scope, and assignments.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedManager(null);
                                }}
                                className="flex-shrink-0 rounded-lg p-1 text-[#5B646F] transition hover:bg-gray-100 hover:text-[#1F083B]"
                            >
                                <X size={20} className="sm:size-[24px]" />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="mb-4 h-px w-full bg-[#E5E7EB] sm:mb-6" />

                        {/* Manager Profile */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE8F4] text-lg font-semibold text-[#6E43A3]">
                                    {getInitials(selectedManager)}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-base font-bold text-[#1A2A3F]">
                                            {selectedManager.user?.firstName}{" "}
                                            {selectedManager.user?.lastName}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(selectedManager.role)}`}
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
                                    <div className="truncate text-sm text-[#5B646F]">
                                        {selectedManager.user?.email || ""}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(selectedManager.status)}`}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                    {selectedManager.status
                                        ? selectedManager.status
                                              .charAt(0)
                                              .toUpperCase() +
                                          selectedManager.status.slice(1)
                                        : "Unknown"}
                                </span>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Sub-fleet
                                </div>
                                <div className="mt-1 text-base font-bold text-[#1A2A3F]">
                                    {selectedManager.subFleet?.name || "-"}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Vehicles
                                </div>
                                <div className="mt-1 text-base font-bold text-[#1A2A3F]">
                                    {selectedManager.subFleet?.vehicleCount ||
                                        0}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Drivers
                                </div>
                                <div className="mt-1 text-base font-bold text-[#1A2A3F]">
                                    {selectedManager.subFleet?.driverCount || 0}
                                </div>
                            </div>
                        </div>

                        {/* Divider before actions */}
                        <div className="my-4 h-px w-full bg-[#E5E7EB] sm:my-6" />

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedManager(null);
                                    setShowRemoveModal(true);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#B71C1C] px-4 py-3 text-sm text-[#B71C1C] transition hover:bg-[#B71C1C] hover:text-white sm:flex-1 sm:px-6"
                            >
                                <Trash2 size={16} className="sm:size-[18px]" />
                                Remove Manager
                            </button>
                            {selectedManager.status === "suspended" ? (
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedManager(selectedManager);
                                        setShowReactivateModal(true);
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6E43A3] px-4 py-3 text-sm text-white transition hover:opacity-90 sm:flex-1 sm:px-6"
                                >
                                    <RefreshCw
                                        size={16}
                                        className="sm:size-[18px]"
                                    />
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
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6E43A3] px-4 py-3 text-sm text-white transition hover:opacity-90 sm:flex-1 sm:px-6"
                                >
                                    <Mail
                                        size={16}
                                        className="sm:size-[18px]"
                                    />
                                    Resend Invite
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedManager(selectedManager);
                                        setShowSuspendModal(true);
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2A618] px-4 py-3 text-sm text-white transition hover:opacity-90 sm:flex-1 sm:px-6"
                                >
                                    <Ban size={16} className="sm:size-[18px]" />
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
