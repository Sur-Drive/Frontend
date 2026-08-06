import React, { useState, useEffect } from "react";
import {
    Truck,
    User,
    MapPin,
    Plus,
    Layers,
    AlertTriangle,
    X,
    CheckCircle,
    ArrowRight,
    MoreVertical,
    Eye,
    Edit,
    Pause,
    Trash2,
    RotateCcw,
    Calendar,
    Users,
} from "lucide-react";
import { getSubFleets, createSubFleet, getManagers } from "../../../api/fleet";
import {
    updateSubFleet,
    suspendSubFleet,
    reactivateSubFleet,
    deleteSubFleet,
} from "../../../api/subFleet";

interface SubFleet {
    id: string;
    fleetCompanyId: string;
    name: string;
    region: string;
    managerId: string | null;
    status: "active" | "suspended";
    vehicleCount: number;
    driverCount: number;
    createdAt: string;
    updatedAt: string;
    managers: any[];
}

interface Manager {
    id: string;
    userId: string;
    fleetCompanyId: string;
    subFleetId: string | null;
    role: string;
    status: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface CreateSubFleetData {
    name: string;
    region: string;
    managerId?: string;
}

const SubFleetManagement: React.FC = () => {
    const [subFleets, setSubFleets] = useState<SubFleet[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingManagers, setLoadingManagers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubFleet, setSelectedSubFleet] = useState<SubFleet | null>(
        null,
    );

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [successTitle, setSuccessTitle] = useState("");
    const [actionType, setActionType] = useState<
        "suspend" | "reactivate" | "delete" | null
    >(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Form data
    const [formData, setFormData] = useState<CreateSubFleetData>({
        name: "",
        region: "",
        managerId: "",
    });

    useEffect(() => {
        fetchSubFleets();
    }, []);

    useEffect(() => {
        if (showCreateModal || showEditModal) {
            fetchManagers();
        }
    }, [showCreateModal, showEditModal]);

    const fetchSubFleets = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getSubFleets();
            const data = Array.isArray(response) ? response : [];
            setSubFleets(data);
        } catch (err: any) {
            console.error("Failed to fetch sub-fleets:", err);
            setError(err.message || "Failed to load sub-fleets");
            setSubFleets([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            setLoadingManagers(true);
            const response = await getManagers();
            const data = Array.isArray(response) ? response : [];
            setManagers(data);
        } catch (err: any) {
            console.error("Failed to fetch managers:", err);
        } finally {
            setLoadingManagers(false);
        }
    };

    const handleCreateSubFleet = async () => {
        if (!formData.name.trim()) {
            setError("Please enter a sub-fleet name");
            return;
        }
        if (!formData.region.trim()) {
            setError("Please enter a region");
            return;
        }

        setIsSubmitting(true);
        try {
            const dataToSend = {
                name: formData.name,
                region: formData.region,
                ...(formData.managerId && { managerId: formData.managerId }),
            };

            await createSubFleet(dataToSend);
            setShowCreateModal(false);
            setSuccessTitle("Sub-Fleet Created Successfully");
            setSuccessMessage(
                "Your new sub-fleet has been created and is ready for use. You can now assign vehicles, drivers, and Fleet Managers to this sub-fleet.",
            );
            setShowSuccessModal(true);
            setFormData({ name: "", region: "", managerId: "" });
            await fetchSubFleets();
            setTimeout(() => setShowSuccessModal(false), 5000);
        } catch (err: any) {
            console.error("Failed to create sub-fleet:", err);
            if (
                err.message?.includes("plan limit") ||
                err.message?.includes("limit")
            ) {
                setShowErrorModal(true);
            } else {
                setError(err.message || "Failed to create sub-fleet");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubFleet = async () => {
        if (!selectedSubFleet) return;
        if (!formData.name.trim()) {
            setError("Please enter a sub-fleet name");
            return;
        }
        if (!formData.region.trim()) {
            setError("Please enter a region");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateSubFleet(selectedSubFleet.id, {
                name: formData.name,
                region: formData.region,
                ...(formData.managerId && { managerId: formData.managerId }),
            });
            setShowEditModal(false);
            setSuccessTitle("Changes Saved Successfully");
            setSuccessMessage(
                "Your changes have been updated successfully and are now live.",
            );
            setShowSuccessModal(true);
            setSelectedSubFleet(null);
            setFormData({ name: "", region: "", managerId: "" });
            await fetchSubFleets();
            setTimeout(() => setShowSuccessModal(false), 5000);
        } catch (err: any) {
            setError(err.message || "Failed to update sub-fleet");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAction = (
        subFleet: SubFleet,
        action: "suspend" | "reactivate" | "delete",
    ) => {
        setSelectedSubFleet(subFleet);
        setActionType(action);
        if (action === "suspend") setShowSuspendModal(true);
        else if (action === "reactivate") setShowReactivateModal(true);
        else if (action === "delete") setShowDeleteModal(true);
    };

    const confirmAction = async () => {
        if (!selectedSubFleet) return;

        try {
            if (actionType === "suspend") {
                await suspendSubFleet(selectedSubFleet.id);
                setSuccessTitle("Fleet Suspended Successfully");
                setSuccessMessage(
                    "The fleet has been suspended successfully. All Fleet Managers have temporarily lost access to the fleet dashboard. You can reactivate the fleet at any time.",
                );
            } else if (actionType === "reactivate") {
                await reactivateSubFleet(selectedSubFleet.id);
                setSuccessTitle("Fleet Reactivated Successfully");
                setSuccessMessage(
                    "The fleet has been reactivated successfully. All assigned Fleet Managers can now access the fleet dashboard, and fleet operations have resumed.",
                );
            } else if (actionType === "delete") {
                await deleteSubFleet(selectedSubFleet.id);
                setSuccessTitle("Fleet Deleted Successfully");
                setSuccessMessage(
                    "The fleet has been permanently removed from your organization. It will no longer appear in your fleet list.",
                );
            }

            setShowSuspendModal(false);
            setShowReactivateModal(false);
            setShowDeleteModal(false);
            setShowSuccessModal(true);
            setSelectedSubFleet(null);
            await fetchSubFleets();
            setTimeout(() => setShowSuccessModal(false), 5000);
        } catch (err: any) {
            setError(err.message || "Action failed");
        }
    };

    const openEditModal = (subFleet: SubFleet) => {
        setSelectedSubFleet(subFleet);
        setFormData({
            name: subFleet.name,
            region: subFleet.region,
            managerId: subFleet.managerId || "",
        });
        setShowEditModal(true);
    };

    const openDetailsModal = (subFleet: SubFleet) => {
        setSelectedSubFleet(subFleet);
        setShowDetailsModal(true);
    };

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setFormData({ name: "", region: "", managerId: "" });
        setError(null);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedSubFleet(null);
        setFormData({ name: "", region: "", managerId: "" });
        setError(null);
    };

    // Filter sub-fleets based on search
    const filteredSubFleets = subFleets.filter(
        (subFleet) =>
            subFleet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subFleet.region.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    };

    const getStatusColor = (status: string) => {
        return status === "active" ? "#00BC7B" : "#8E98A8";
    };

    const getStatusBg = (status: string) => {
        return status === "active" ? "#2E7D3224" : "#B71C1C24";
    };

    const getStatusTextColor = (status: string) => {
        return status === "active" ? "#2E7D32" : "#B71C1C";
    };

    const stats = {
        subFleets: subFleets.length,
        vehicles: subFleets.reduce(
            (acc, curr) => acc + (curr.vehicleCount || 0),
            0,
        ),
        drivers: subFleets.reduce(
            (acc, curr) => acc + (curr.driverCount || 0),
            0,
        ),
        trips: 84,
        activeTrips: 3,
    };

    const StatCard = ({ icon: Icon, label, value, subtext }: any) => (
        <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
            <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="text-3xl font-bold text-[#03272E]">{value}</div>
            {subtext && (
                <div className="text-xs text-[#8E98A8] mt-1">{subtext}</div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6E43A3]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F0F7] p-3 sm:p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6 md:p-8">
                <div>
                    <h1 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                        Sub-fleets
                    </h1>
                    <p className="text-xs text-[#8E98A8] sm:text-sm">
                        Group vehicles, drivers and managers into regional or
                        business units
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-[#6E43A3] px-4 py-2 text-sm text-white transition hover:opacity-90 sm:px-6 sm:py-2.5"
                >
                    <Plus size={18} />
                    New Sub-fleet
                </button>
            </div>

            {/* Stats Cards - Responsive Grid */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-4 md:gap-4">
                <StatCard
                    icon={Layers}
                    label="Sub-fleets"
                    value={stats.subFleets}
                    subtext={`${stats.activeTrips} active`}
                />
                <StatCard
                    icon={Truck}
                    label="Vehicles managed"
                    value={stats.vehicles}
                    subtext="Across all sub-fleets"
                />
                <StatCard
                    icon={User}
                    label="Drivers"
                    value={stats.drivers}
                    subtext="On rota"
                />
                <StatCard
                    icon={MapPin}
                    label="Trips"
                    value={stats.trips}
                    subtext="Trips this week"
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4">
                    <AlertTriangle size={20} className="text-red-500" />
                    <span className="flex-1 text-sm text-red-700">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Sub-fleet List */}
            {subFleets.length === 0 ? (
                <div className="rounded-xl bg-white p-8 sm:p-12 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F3F0F7]">
                            <Layers size={32} className="text-[#B3BBC4]" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F0F7]">
                            <Layers size={16} className="text-[#B3BBC4]" />
                        </div>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-[#1F083B]">
                        No Sub-Fleets Created Yet
                    </h3>
                    <p className="max-w-md text-center text-sm text-[#B3BBC4]">
                        Organize your fleet by creating sub-fleets for different
                        branches, regions, departments, or operations.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-6 flex items-center gap-2 rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90"
                    >
                        <Plus size={18} />
                        New Sub-fleet
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                    {subFleets.map((subFleet) => {
                        const manager = subFleet.managers?.[0]?.user;
                        const isActive = subFleet.status === "active";

                        return (
                            <div
                                key={subFleet.id}
                                className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                                    isActive ? "bg-white" : "bg-[#F7F7F7]"
                                }`}
                                style={{
                                    borderColor: isActive
                                        ? "#DFE6EB"
                                        : "#F7F7F7",
                                }}
                            >
                                {/* Header - Name and Status */}
                                <div className="flex items-start justify-between">
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                        <div
                                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: getStatusColor(
                                                    subFleet.status,
                                                ),
                                            }}
                                        />
                                        <span className="truncate text-sm font-semibold text-[#031222]">
                                            {subFleet.name}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize sm:text-xs ${
                                                subFleet.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : subFleet.status ===
                                                        "suspended"
                                                      ? "bg-yellow-100 text-yellow-700"
                                                      : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {subFleet.status}
                                        </span>
                                    </div>
                                    <div className="relative flex-shrink-0">
                                        <button
                                            onClick={() => {
                                                const el =
                                                    document.getElementById(
                                                        `dropdown-${subFleet.id}`,
                                                    );
                                                if (el)
                                                    el.classList.toggle(
                                                        "hidden",
                                                    );
                                            }}
                                            className="rounded-full p-1 hover:bg-gray-100"
                                        >
                                            <MoreVertical
                                                size={18}
                                                className="text-[#8E98A8]"
                                            />
                                        </button>
                                        <div
                                            id={`dropdown-${subFleet.id}`}
                                            className="absolute right-0 z-20 mt-1 hidden w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={() =>
                                                        openDetailsModal(
                                                            subFleet,
                                                        )
                                                    }
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#0B0015] hover:bg-gray-50"
                                                >
                                                    <Eye size={14} /> View
                                                    details
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openEditModal(subFleet)
                                                    }
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#0B0015] hover:bg-gray-50"
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>
                                                {isActive ? (
                                                    <button
                                                        onClick={() =>
                                                            handleAction(
                                                                subFleet,
                                                                "suspend",
                                                            )
                                                        }
                                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#F2A618] hover:bg-gray-50"
                                                    >
                                                        <Pause size={14} />{" "}
                                                        Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handleAction(
                                                                subFleet,
                                                                "reactivate",
                                                            )
                                                        }
                                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#2E7D32] hover:bg-gray-50"
                                                    >
                                                        <RotateCcw size={14} />{" "}
                                                        Reactivate
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        handleAction(
                                                            subFleet,
                                                            "delete",
                                                        )
                                                    }
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#B71C1C] hover:bg-gray-50"
                                                >
                                                    <Trash2 size={14} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Region */}
                                <div className="mt-2 flex items-center gap-1.5">
                                    <MapPin
                                        size={14}
                                        className="text-[#5B646F]"
                                    />
                                    <span className="text-sm text-[#5B646F]">
                                        {subFleet.region}
                                    </span>
                                </div>

                                {/* Manager Info */}
                                <div className="mt-3 flex items-center gap-3">
                                    <div
                                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                            manager
                                                ? "bg-[#EDE8F4] text-[#6E43A3]"
                                                : "bg-[#F3F0F7] text-[#B3BBC4]"
                                        }`}
                                    >
                                        {manager
                                            ? getInitials(
                                                  manager.firstName,
                                                  manager.lastName,
                                              )
                                            : "NA"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {manager ? (
                                            <>
                                                <div className="truncate text-sm font-medium text-[#111827]">
                                                    {manager.firstName}{" "}
                                                    {manager.lastName}
                                                </div>
                                                <div className="text-xs text-[#8E98A8]">
                                                    Fleet Manager
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-sm font-medium text-[#8E98A8]">
                                                    Not Assigned
                                                </div>
                                                <div className="text-xs text-[#B3BBC4]">
                                                    No manager assigned
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
                                    <div className="flex flex-col items-center rounded-lg bg-[#F3F0F7] p-2">
                                        <div className="flex items-center gap-1">
                                            <Truck
                                                size={16}
                                                strokeWidth={2.5}
                                                className="text-[#5B646F] sm:size-[18px]"
                                            />
                                            <span className="text-[10px] font-semibold uppercase text-[#5B646F] sm:text-xs">
                                                Vehicles
                                            </span>
                                        </div>
                                        <div className="mt-1 text-base font-bold text-[#031222] sm:text-lg">
                                            {subFleet.vehicleCount || 0}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center rounded-lg bg-[#F3F0F7] p-2">
                                        <div className="flex items-center gap-1">
                                            <Users
                                                size={16}
                                                strokeWidth={2.5}
                                                className="text-[#5B646F] sm:size-[18px]"
                                            />
                                            <span className="text-[10px] font-semibold uppercase text-[#5B646F] sm:text-xs">
                                                Drivers
                                            </span>
                                        </div>
                                        <div className="mt-1 text-base font-bold text-[#031222] sm:text-lg">
                                            {subFleet.driverCount || 0}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center rounded-lg bg-[#F3F0F7] p-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar
                                                size={16}
                                                strokeWidth={2.5}
                                                className="text-[#5B646F] sm:size-[18px]"
                                            />
                                            <span className="text-[10px] font-semibold uppercase text-[#5B646F] sm:text-xs">
                                                Trips
                                            </span>
                                        </div>
                                        <div className="mt-1 text-base font-bold text-[#031222] sm:text-lg">
                                            0
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-xs text-[#8E98A8]">
                                        Created{" "}
                                        {
                                            new Date(subFleet.createdAt)
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                    </div>
                                    <button
                                        onClick={() =>
                                            openDetailsModal(subFleet)
                                        }
                                        className="flex items-center gap-1.5 rounded-lg bg-[#6E43A3] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 sm:px-4"
                                    >
                                        Manage
                                        <ArrowRight
                                            size={14}
                                            className="sm:size-[14px]"
                                        />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CREATE MODAL - Responsive */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Create sub-fleet
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Segment your fleet by region, business unit
                                    or contract.
                                </p>
                            </div>
                            <button
                                onClick={handleCloseCreateModal}
                                className="text-[#5B646F] hover:text-[#1F083B]"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Lagos Metro"
                                    className="w-full rounded-xl border border-[#E0E5EB] px-4 py-3 focus:border-[#6E43A3] focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        placeholder="e.g. Lagos, SW"
                                        className="w-full rounded-xl border border-[#E0E5EB] px-4 py-3 focus:border-[#6E43A3] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
                                        Manager (Optional)
                                    </label>
                                    <select
                                        value={formData.managerId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                managerId: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 focus:border-[#6E43A3] focus:outline-none"
                                    >
                                        <option value="">
                                            Select a manager
                                        </option>
                                        {loadingManagers ? (
                                            <option value="" disabled>
                                                Loading managers...
                                            </option>
                                        ) : (
                                            managers.map((manager) => (
                                                <option
                                                    key={manager.id}
                                                    value={manager.id}
                                                >
                                                    {manager.user?.firstName}{" "}
                                                    {manager.user?.lastName}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <AlertTriangle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                                <button
                                    onClick={handleCloseCreateModal}
                                    className="flex-1 rounded-xl border border-[#E0E5EB] px-6 py-3 text-[#8E98A8] transition hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSubFleet}
                                    disabled={
                                        !formData.name ||
                                        !formData.region ||
                                        isSubmitting
                                    }
                                    className="flex-1 rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        "Creating..."
                                    ) : (
                                        <>
                                            Create Sub-fleet{" "}
                                            <ArrowRight
                                                size={18}
                                                className="inline"
                                            />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL - Responsive */}
            {showEditModal && selectedSubFleet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Edit Sub-Fleet
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Update sub-fleet information
                                </p>
                            </div>
                            <button
                                onClick={handleCloseEditModal}
                                className="text-[#5B646F] hover:text-[#1F083B]"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Lagos Metro"
                                    className="w-full rounded-xl border border-[#E0E5EB] px-4 py-3 focus:border-[#6E43A3] focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        placeholder="e.g. Lagos, SW"
                                        className="w-full rounded-xl border border-[#E0E5EB] px-4 py-3 focus:border-[#6E43A3] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
                                        Manager
                                    </label>
                                    <select
                                        value={formData.managerId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                managerId: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 focus:border-[#6E43A3] focus:outline-none"
                                    >
                                        <option value="">
                                            Select a manager
                                        </option>
                                        {loadingManagers ? (
                                            <option value="" disabled>
                                                Loading managers...
                                            </option>
                                        ) : (
                                            managers.map((manager) => (
                                                <option
                                                    key={manager.id}
                                                    value={manager.id}
                                                >
                                                    {manager.user?.firstName}{" "}
                                                    {manager.user?.lastName}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <AlertTriangle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                                <button
                                    onClick={handleCloseEditModal}
                                    className="flex-1 rounded-xl border border-[#E0E5EB] px-6 py-3 text-[#8E98A8] transition hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditSubFleet}
                                    disabled={
                                        !formData.name ||
                                        !formData.region ||
                                        isSubmitting
                                    }
                                    className="flex-1 rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        "Saving..."
                                    ) : (
                                        <>
                                            Save Changes{" "}
                                            <ArrowRight
                                                size={18}
                                                className="inline"
                                            />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL - Responsive */}
            {showDetailsModal && selectedSubFleet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-8">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    {selectedSubFleet.name}
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Sub-fleet details and information
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-[#5B646F] hover:text-[#1F083B]"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-[#8E98A8]">
                                        Region
                                    </p>
                                    <p className="flex items-center gap-1.5 font-medium text-[#1F083B]">
                                        <MapPin
                                            size={16}
                                            className="text-[#5B646F]"
                                        />{" "}
                                        {selectedSubFleet.region}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-[#8E98A8]">
                                        Status
                                    </p>
                                    <span
                                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${
                                            selectedSubFleet.status === "active"
                                                ? "bg-green-100 text-green-700"
                                                : selectedSubFleet.status ===
                                                    "suspended"
                                                  ? "bg-yellow-100 text-yellow-700"
                                                  : "bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                        {selectedSubFleet.status}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl bg-[#F3F0F7] p-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Truck
                                            size={20}
                                            className="text-[#6E43A3]"
                                        />
                                        <div>
                                            <div className="text-lg font-bold text-[#1F083B]">
                                                {selectedSubFleet.vehicleCount ||
                                                    0}
                                            </div>
                                            <div className="text-xs text-[#8E98A8]">
                                                Vehicles
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Users
                                            size={20}
                                            className="text-[#6E43A3]"
                                        />
                                        <div>
                                            <div className="text-lg font-bold text-[#1F083B]">
                                                {selectedSubFleet.driverCount ||
                                                    0}
                                            </div>
                                            <div className="text-xs text-[#8E98A8]">
                                                Drivers
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar
                                            size={20}
                                            className="text-[#6E43A3]"
                                        />
                                        <div>
                                            <div className="text-lg font-bold text-[#1F083B]">
                                                0
                                            </div>
                                            <div className="text-xs text-[#8E98A8]">
                                                Trips
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="mb-3 text-sm text-[#8E98A8]">
                                    Fleet Manager
                                </p>
                                {selectedSubFleet.managers?.[0]?.user ? (
                                    <div className="rounded-xl border border-[#DFE6EB] p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE8F4] text-lg font-semibold text-[#6E43A3]">
                                                {getInitials(
                                                    selectedSubFleet.managers[0]
                                                        .user.firstName,
                                                    selectedSubFleet.managers[0]
                                                        .user.lastName,
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-[#1F083B]">
                                                    {
                                                        selectedSubFleet
                                                            .managers[0].user
                                                            .firstName
                                                    }{" "}
                                                    {
                                                        selectedSubFleet
                                                            .managers[0].user
                                                            .lastName
                                                    }
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-[#8E98A8]">
                                                    <div className="flex items-center gap-1">
                                                        <User size={14} />{" "}
                                                        {
                                                            selectedSubFleet
                                                                .managers[0]
                                                                .user.email
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-[#DFE6EB] p-4 text-center">
                                        <p className="text-sm text-[#8E98A8]">
                                            No manager assigned to this
                                            sub-fleet
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUSPEND MODAL */}
            {showSuspendModal && selectedSubFleet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F2A61820]">
                            <Pause size={32} className="text-[#F2A618]" />
                        </div>
                        <h3 className="text-center text-xl font-bold text-[#1F083B]">
                            Suspend This Fleet?
                        </h3>
                        <p className="mt-4 text-center text-sm text-[#5B646F]">
                            Are you sure you want to suspend{" "}
                            <strong>{selectedSubFleet.name}</strong>?
                        </p>
                        <div className="mt-6 h-px w-full bg-[#E5E7EB]" />
                        <p className="mt-6 text-center text-sm text-[#8E98A8]">
                            Suspending the fleet will temporarily disable access
                            for all assigned Fleet Managers and pause fleet
                            operations. Your fleet data will remain saved and
                            can be restored by reactivating the fleet.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                onClick={() => setShowSuspendModal(false)}
                                className="flex-1 rounded-xl border border-[#D1D5DB] px-4 py-3 font-medium text-[#1F083B] transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className="flex-1 rounded-xl bg-[#B71C1C] px-4 py-3 font-medium text-white transition hover:opacity-90"
                            >
                                Suspend Fleet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REACTIVATE MODAL */}
            {showReactivateModal && selectedSubFleet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2E7D3220]">
                            <RotateCcw size={32} className="text-[#2E7D32]" />
                        </div>
                        <h3 className="text-center text-xl font-bold text-[#1F083B]">
                            Reactivate This Fleet?
                        </h3>
                        <p className="mt-4 text-center text-sm text-[#5B646F]">
                            Are you sure you want to reactivate{" "}
                            <strong>{selectedSubFleet.name}</strong>?
                        </p>
                        <div className="mt-6 h-px w-full bg-[#E5E7EB]" />
                        <p className="mt-6 text-center text-sm text-[#8E98A8]">
                            Reactivating the fleet will restore access for all
                            assigned Fleet Managers and resume normal fleet
                            operations.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                onClick={() => setShowReactivateModal(false)}
                                className="flex-1 rounded-xl border border-[#D1D5DB] px-4 py-3 font-medium text-[#1F083B] transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className="flex-1 rounded-xl bg-[#2E7D32] px-4 py-3 font-medium text-white transition hover:opacity-90"
                            >
                                Reactivate Fleet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && selectedSubFleet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#B71C1C20]">
                            <Trash2 size={32} className="text-[#B71C1C]" />
                        </div>
                        <h3 className="text-center text-xl font-bold text-[#1F083B]">
                            Delete This Fleet?
                        </h3>
                        <p className="mt-4 text-center text-sm text-[#5B646F]">
                            Are you sure you want to permanently delete{" "}
                            <strong>{selectedSubFleet.name}</strong>?
                        </p>
                        <div className="mt-6 h-px w-full bg-[#E5E7EB]" />
                        <p className="mt-6 text-center text-sm text-[#8E98A8]">
                            This action will remove the fleet, its vehicles,
                            drivers, sub-fleets, and related records. This
                            action cannot be undone.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 rounded-xl border border-[#D1D5DB] px-4 py-3 font-medium text-[#1F083B] transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className="flex-1 rounded-xl bg-[#B71C1C] px-4 py-3 font-medium text-white transition hover:opacity-90"
                            >
                                Delete Fleet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center sm:p-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D6F5DA]">
                            <CheckCircle size={32} className="text-[#267F50]" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-[#1F083B] sm:text-2xl">
                            {successTitle}
                        </h3>
                        <p className="mb-6 text-sm text-[#5B646F]">
                            {successMessage}
                        </p>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* ERROR MODAL - Plan Limit */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFEED4]">
                            <AlertTriangle
                                size={32}
                                className="text-[#F09205]"
                            />
                        </div>
                        <h3 className="mb-2 text-center text-xl font-bold text-[#1F083B] sm:text-2xl">
                            Upgrade Required
                        </h3>
                        <p className="mb-4 text-center text-sm text-[#5B646F]">
                            You've Reached Your Plan Limit. Your current
                            subscription has reached its limit for this feature.
                        </p>
                        <p className="mb-6 text-center text-sm text-[#5B646F]">
                            Upgrade your plan to unlock additional Fleet
                            Managers, sub-fleets, and more advanced fleet
                            management capabilities.
                        </p>

                        <div className="mb-6 flex items-center justify-between rounded-xl border border-[#E0E5EB] bg-[#4C577D05] px-4 py-3">
                            <span className="text-sm text-[#5B646F]">
                                Current Plan:
                            </span>
                            <span className="text-sm font-semibold text-[#6E43A3]">
                                Starter Fleet
                            </span>
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="flex-1 rounded-xl border border-[#E0E5EB] px-6 py-3 text-[#8E98A8] transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button className="flex-1 rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90">
                                Upgrade Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubFleetManagement;
