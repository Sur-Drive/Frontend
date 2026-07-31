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
        <div className="p-8 bg-[#F3F0F7] min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-xl p-8 mb-6 flex justify-between items-center">
                <div>
                    <h1
                        className="text-2xl font-bold text-[#1F083B]"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Sub-fleets
                    </h1>
                    <p
                        className="text-[#8E98A8] text-sm"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Group vehicles, drivers and managers into regional or
                        business units
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#6E43A3] text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition"
                    style={{ fontFamily: "Outfit" }}
                >
                    <Plus size={18} />
                    New Sub-fleet
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-red-500" />
                    <span className="text-red-700 text-sm">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-500 hover:text-red-700"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Sub-fleet List */}
            {subFleets.length === 0 ? (
                <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full bg-[#F3F0F7] flex items-center justify-center">
                            <Layers size={32} className="text-[#B3BBC4]" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#F3F0F7] flex items-center justify-center">
                            <Layers size={16} className="text-[#B3BBC4]" />
                        </div>
                    </div>
                    <h3
                        className="text-xl font-semibold text-[#1F083B] mb-2"
                        style={{ fontFamily: "Outfit" }}
                    >
                        No Sub-Fleets Created Yet
                    </h3>
                    <p
                        className="text-[#B3BBC4] text-center max-w-md"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Organize your fleet by creating sub-fleets for different
                        branches, regions, departments, or operations.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-6 bg-[#6E43A3] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition"
                        style={{ fontFamily: "Outfit" }}
                    >
                        <Plus size={18} />
                        New Sub-fleet
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subFleets.map((subFleet) => {
                        const manager = subFleet.managers?.[0]?.user;
                        const isActive = subFleet.status === "active";

                        return (
                            <div
                                key={subFleet.id}
                                className="rounded-xl border p-4 transition-all hover:shadow-md bg-white"
                                style={{
                                    width: "100%",
                                    maxWidth: "354px",
                                    borderWidth: "1px",
                                    borderColor: isActive
                                        ? "#DFE6EB"
                                        : "#F7F7F7",
                                    backgroundColor: isActive
                                        ? "#FFFFFF"
                                        : "#F7F7F7",
                                    padding: "16px",
                                    borderRadius: "16px",
                                }}
                            >
                                {/* Header - Name and Status */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{
                                                backgroundColor: getStatusColor(
                                                    subFleet.status,
                                                ),
                                            }}
                                        />
                                        <span
                                            className="font-semibold text-sm"
                                            style={{
                                                color: "#031222",
                                                fontFamily: "Outfit",
                                            }}
                                        >
                                            {subFleet.name}
                                        </span>
                                        <span
                                            className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                                            style={{
                                                backgroundColor: getStatusBg(
                                                    subFleet.status,
                                                ),
                                                color: getStatusTextColor(
                                                    subFleet.status,
                                                ),
                                                fontFamily: "Outfit",
                                            }}
                                        >
                                            {subFleet.status}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                // Toggle dropdown
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
                                                style={{ color: "#8E98A8" }}
                                            />
                                        </button>
                                        <div
                                            id={`dropdown-${subFleet.id}`}
                                            className="hidden absolute right-0 z-20 mt-1 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={() =>
                                                        openDetailsModal(
                                                            subFleet,
                                                        )
                                                    }
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                                                    style={{
                                                        color: "#0B0015",
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    <Eye size={14} /> View
                                                    details
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openEditModal(subFleet)
                                                    }
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                                                    style={{
                                                        color: "#0B0015",
                                                        fontFamily: "Outfit",
                                                    }}
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
                                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                                                        style={{
                                                            color: "#F2A618",
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
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
                                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                                                        style={{
                                                            color: "#2E7D32",
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
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
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                                                    style={{
                                                        color: "#B71C1C",
                                                        fontFamily: "Outfit",
                                                    }}
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
                                        style={{ color: "#5B646F" }}
                                    />
                                    <span
                                        className="text-sm"
                                        style={{
                                            color: "#5B646F",
                                            fontFamily: "Outfit",
                                        }}
                                    >
                                        {subFleet.region}
                                    </span>
                                </div>

                                {/* Manager Info */}
                                <div className="mt-3 flex items-center gap-3">
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                                        style={{
                                            backgroundColor: manager
                                                ? "#EDE8F4"
                                                : "#F3F0F7",
                                            color: manager
                                                ? "#6E43A3"
                                                : "#B3BBC4",
                                            fontFamily: "Outfit",
                                        }}
                                    >
                                        {manager
                                            ? getInitials(
                                                  manager.firstName,
                                                  manager.lastName,
                                              )
                                            : "NA"}
                                    </div>
                                    <div>
                                        {manager ? (
                                            <>
                                                <div
                                                    className="text-sm font-medium"
                                                    style={{
                                                        color: "#111827",
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {manager.firstName}{" "}
                                                    {manager.lastName}
                                                </div>
                                                <div
                                                    className="text-xs"
                                                    style={{
                                                        color: "#8E98A8",
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    Fleet Manager
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div
                                                    className="text-sm font-medium"
                                                    style={{
                                                        color: "#8E98A8",
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    Not Assigned
                                                </div>
                                                <div
                                                    className="text-xs"
                                                    style={{
                                                        color: "#B3BBC4",
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    No manager assigned
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                {/* Stats - Individual Cards with icon and text centered, number below */}
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {/* Vehicles Card */}
                                    <div
                                        className="flex flex-col items-center rounded-lg p-2"
                                        style={{ backgroundColor: "#F3F0F7" }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Truck
                                                size={18}
                                                strokeWidth={2.5}
                                                style={{ color: "#5B646F" }}
                                            />
                                            <span
                                                className="text-xs font-semibold uppercase"
                                                style={{
                                                    color: "#5B646F",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                Vehicles
                                            </span>
                                        </div>
                                        <div
                                            className="text-lg font-bold mt-1"
                                            style={{
                                                color: "#031222",
                                                fontFamily: "Outfit",
                                            }}
                                        >
                                            {subFleet.vehicleCount || 0}
                                        </div>
                                    </div>

                                    {/* Drivers Card */}
                                    <div
                                        className="flex flex-col items-center rounded-lg p-2"
                                        style={{ backgroundColor: "#F3F0F7" }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Users
                                                size={18}
                                                strokeWidth={2.5}
                                                style={{ color: "#5B646F" }}
                                            />
                                            <span
                                                className="text-xs font-semibold uppercase"
                                                style={{
                                                    color: "#5B646F",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                Drivers
                                            </span>
                                        </div>
                                        <div
                                            className="text-lg font-bold mt-1"
                                            style={{
                                                color: "#031222",
                                                fontFamily: "Outfit",
                                            }}
                                        >
                                            {subFleet.driverCount || 0}
                                        </div>
                                    </div>

                                    {/* Trips Card */}
                                    <div
                                        className="flex flex-col items-center rounded-lg p-2"
                                        style={{ backgroundColor: "#F3F0F7" }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Calendar
                                                size={18}
                                                strokeWidth={2.5}
                                                style={{ color: "#5B646F" }}
                                            />
                                            <span
                                                className="text-xs font-semibold uppercase"
                                                style={{
                                                    color: "#5B646F",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                Trips
                                            </span>
                                        </div>
                                        <div
                                            className="text-lg font-bold mt-1"
                                            style={{
                                                color: "#031222",
                                                fontFamily: "Outfit",
                                            }}
                                        >
                                            0
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                {/* Footer - Manage Button */}
                                <div className="mt-4 flex items-center justify-between">
                                    <div
                                        className="text-xs"
                                        style={{
                                            color: "#8E98A8",
                                            fontFamily: "Outfit",
                                        }}
                                    >
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
                                        className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                                        style={{
                                            backgroundColor: "#6E43A3",
                                            fontFamily: "Outfit",
                                        }}
                                    >
                                        Manage
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Create sub-fleet
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Segment your fleet by region, business unit
                                    or contract.
                                </p>
                            </div>
                            <button
                                onClick={handleCloseCreateModal}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
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
                                    className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                    style={{ fontFamily: "Outfit" }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
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
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
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
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                                        style={{ fontFamily: "Outfit" }}
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
                                <div className="flex items-center gap-2 text-red-600 text-sm">
                                    <AlertTriangle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCloseCreateModal}
                                    className="flex-1 px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                    style={{ fontFamily: "Outfit" }}
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
                                    className={`flex-1 bg-[#6E43A3] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {isSubmitting ? (
                                        "Creating..."
                                    ) : (
                                        <>
                                            Create Sub-fleet{" "}
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showEditModal && selectedSubFleet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Edit Sub-Fleet
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Update sub-fleet information
                                </p>
                            </div>
                            <button
                                onClick={handleCloseEditModal}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
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
                                    className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                    style={{ fontFamily: "Outfit" }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
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
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
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
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                                        style={{ fontFamily: "Outfit" }}
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
                                <div className="flex items-center gap-2 text-red-600 text-sm">
                                    <AlertTriangle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCloseEditModal}
                                    className="flex-1 px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                    style={{ fontFamily: "Outfit" }}
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
                                    className={`flex-1 bg-[#6E43A3] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {isSubmitting ? (
                                        "Saving..."
                                    ) : (
                                        <>
                                            Save Changes{" "}
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            {showDetailsModal && selectedSubFleet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedSubFleet.name}
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Sub-fleet details and information
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Region
                                    </p>
                                    <p
                                        className="flex items-center gap-1.5 font-medium"
                                        style={{
                                            color: "#1F083B",
                                            fontFamily: "Outfit",
                                        }}
                                    >
                                        <MapPin
                                            size={16}
                                            style={{ color: "#5B646F" }}
                                        />{" "}
                                        {selectedSubFleet.region}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        className="text-sm text-[#8E98A8]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Status
                                    </p>
                                    <span
                                        className="inline-block rounded-full px-3 py-1 text-xs font-medium capitalize"
                                        style={{
                                            backgroundColor: getStatusBg(
                                                selectedSubFleet.status,
                                            ),
                                            color: getStatusTextColor(
                                                selectedSubFleet.status,
                                            ),
                                            fontFamily: "Outfit",
                                        }}
                                    >
                                        {selectedSubFleet.status}
                                    </span>
                                </div>
                            </div>

                            <div
                                className="rounded-xl p-4"
                                style={{ backgroundColor: "#F3F0F7" }}
                            >
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Truck
                                            size={20}
                                            style={{ color: "#6E43A3" }}
                                        />
                                        <div>
                                            <div
                                                className="text-lg font-bold"
                                                style={{
                                                    color: "#1F083B",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                {selectedSubFleet.vehicleCount ||
                                                    0}
                                            </div>
                                            <div
                                                className="text-xs"
                                                style={{
                                                    color: "#8E98A8",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                Vehicles
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Users
                                            size={20}
                                            style={{ color: "#6E43A3" }}
                                        />
                                        <div>
                                            <div
                                                className="text-lg font-bold"
                                                style={{
                                                    color: "#1F083B",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                {selectedSubFleet.driverCount ||
                                                    0}
                                            </div>
                                            <div
                                                className="text-xs"
                                                style={{
                                                    color: "#8E98A8",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                Drivers
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar
                                            size={20}
                                            style={{ color: "#6E43A3" }}
                                        />
                                        <div>
                                            <div
                                                className="text-lg font-bold"
                                                style={{
                                                    color: "#1F083B",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                0
                                            </div>
                                            <div
                                                className="text-xs"
                                                style={{
                                                    color: "#8E98A8",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                Trips
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p
                                    className="mb-3 text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Fleet Manager
                                </p>
                                {selectedSubFleet.managers?.[0]?.user ? (
                                    <div
                                        className="rounded-xl border p-4"
                                        style={{ borderColor: "#DFE6EB" }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold"
                                                style={{
                                                    backgroundColor: "#EDE8F4",
                                                    color: "#6E43A3",
                                                    fontFamily: "Outfit",
                                                }}
                                            >
                                                {getInitials(
                                                    selectedSubFleet.managers[0]
                                                        .user.firstName,
                                                    selectedSubFleet.managers[0]
                                                        .user.lastName,
                                                )}
                                            </div>
                                            <div>
                                                <div
                                                    className="font-medium"
                                                    style={{
                                                        color: "#1F083B",
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
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
                                                <div
                                                    className="flex items-center gap-3 text-sm"
                                                    style={{
                                                        color: "#8E98A8",
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
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
                                    <div
                                        className="rounded-xl border p-4 text-center"
                                        style={{ borderColor: "#DFE6EB" }}
                                    >
                                        <p
                                            className="text-sm"
                                            style={{
                                                color: "#8E98A8",
                                                fontFamily: "Outfit",
                                            }}
                                        >
                                            No manager assigned to this
                                            sub-fleet
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="flex-1 bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SUSPEND MODAL */}

            {showSuspendModal && selectedSubFleet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#F2A61820] flex items-center justify-center mx-auto mb-4">
                            <Pause size={32} style={{ color: "#F2A618" }} />
                        </div>
                        <h3
                            className="text-xl font-bold text-center"
                            style={{ fontFamily: "Outfit", color: "#1F083B" }}
                        >
                            Suspend This Fleet?
                        </h3>
                        <p
                            className="mt-4 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#5B646F" }}
                        >
                            Are you sure you want to suspend{" "}
                            <strong>{selectedSubFleet.name}</strong>?
                        </p>
                        <div
                            className="mt-6 h-px w-full"
                            style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <p
                            className="mt-6 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            Suspending the fleet will temporarily disable access
                            for all assigned Fleet Managers and pause fleet
                            operations. Your fleet data will remain saved and
                            can be restored by reactivating the fleet.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3">
                            <button
                                onClick={() => setShowSuspendModal(false)}
                                className="w-full rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50"
                                style={{
                                    borderColor: "#D1D5DB",
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className="w-full rounded-xl px-4 py-3 font-medium text-white transition hover:opacity-90"
                                style={{
                                    backgroundColor: "#B71C1C",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Suspend Fleet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REACTIVATE MODAL */}
            {showReactivateModal && selectedSubFleet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#2E7D3220] flex items-center justify-center mx-auto mb-4">
                            <RotateCcw size={32} style={{ color: "#2E7D32" }} />
                        </div>
                        <h3
                            className="text-xl font-bold text-center"
                            style={{ fontFamily: "Outfit", color: "#1F083B" }}
                        >
                            Reactivate This Fleet?
                        </h3>
                        <p
                            className="mt-4 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#5B646F" }}
                        >
                            Are you sure you want to reactivate{" "}
                            <strong>{selectedSubFleet.name}</strong>?
                        </p>
                        <div
                            className="mt-6 h-px w-full"
                            style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <p
                            className="mt-6 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            Reactivating the fleet will restore access for all
                            assigned Fleet Managers and resume normal fleet
                            operations.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3">
                            <button
                                onClick={() => setShowReactivateModal(false)}
                                className="w-full rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50"
                                style={{
                                    borderColor: "#D1D5DB",
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className="w-full rounded-xl px-4 py-3 font-medium text-white transition hover:opacity-90"
                                style={{
                                    backgroundColor: "#2E7D32",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Reactivate Fleet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && selectedSubFleet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#B71C1C20] flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} style={{ color: "#B71C1C" }} />
                        </div>
                        <h3
                            className="text-xl font-bold text-center"
                            style={{ fontFamily: "Outfit", color: "#1F083B" }}
                        >
                            Delete This Fleet?
                        </h3>
                        <p
                            className="mt-4 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#5B646F" }}
                        >
                            Are you sure you want to permanently delete{" "}
                            <strong>{selectedSubFleet.name}</strong>?
                        </p>
                        <div
                            className="mt-6 h-px w-full"
                            style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <p
                            className="mt-6 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            This action will remove the fleet, its vehicles,
                            drivers, sub-fleets, and related records. This
                            action cannot be undone.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="w-full rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50"
                                style={{
                                    borderColor: "#D1D5DB",
                                    color: "#1F083B",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className="w-full rounded-xl px-4 py-3 font-medium text-white transition hover:opacity-90"
                                style={{
                                    backgroundColor: "#B71C1C",
                                    fontFamily: "Outfit",
                                }}
                            >
                                Delete Fleet
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
                            className="text-[#5B646F] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {successMessage}
                        </p>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

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
                            className="text-[#5B646F] text-center mb-4"
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

                        <div className="flex items-center justify-between bg-[#4C577D05] rounded-xl px-4 py-3 mb-6 border border-[#E0E5EB]">
                            <span className="text-[#5B646F] text-sm">
                                Current Plan:
                            </span>
                            <span className="text-[#6E43A3] font-semibold text-sm">
                                Starter Fleet
                            </span>
                        </div>

                        <div className="flex flex-col-reverse gap-3">
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="w-full px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Cancel
                            </button>
                            <button
                                className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                                style={{ fontFamily: "Outfit" }}
                            >
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
