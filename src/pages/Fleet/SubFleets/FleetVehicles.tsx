import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    UserPlus,
    Eye,
    Trash2,
    Edit,
    Car,
    Users,
    UserCheck,
    UserX,
    Calendar,
    AlertCircle,
    X,
    ArrowRight,
    CheckCircle,
    MoreVertical,
    Plus,
} from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface Vehicle {
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
    vehicleType?: string; // Add this
    year: string | null;
    color: string | null;
    deviceId: string;
    deviceType: string;
    lastKnownLocation: string | null;
    status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE";
    fleetId: string | null;
    subFleetId: string;
    assignedDriverId: string | null;
    createdAt: string;
    updatedAt: string;
    fleetCompanyId: string;
    isActive: boolean;
    nextService: string | null;
    subFleet?: {
        id: string;
        name: string;
    };
    assignedDriver?: {
        id: string;
        fullName: string;
    };
}

interface VehicleUsage {
    limit: number;
    current: number;
    remaining: number;
    plan: string;
    isFreeTrial: boolean;
    message: string;
}

interface VehicleStats {
    totalVehicles: number;
    assignedVehicles: number;
    unassignedVehicles: number;
    dueForService: number;
}

interface SubFleet {
    id: string;
    name: string;
    status: string;
}

interface Driver {
    id: string;
    fullName: string;
    phoneNumber: string;
}

const StatCard = ({ icon: Icon, label, value, subtext, valueColor }: any) => (
    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
            <span className="text-sm font-medium">{label}</span>
        </div>
        <div className={`text-3xl font-bold ${valueColor || "text-[#03272E]"}`}>
            {value}
        </div>
        {subtext && (
            <div className="text-xs text-[#8E98A8] mt-1">{subtext}</div>
        )}
    </div>
);

const FleetVehicles: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [stats, setStats] = useState<VehicleStats>({
        totalVehicles: 0,
        assignedVehicles: 0,
        unassignedVehicles: 0,
        dueForService: 0,
    });
    const [usage, setUsage] = useState<VehicleUsage | null>(null);
    const [subFleets, setSubFleets] = useState<SubFleet[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(
        null,
    );
    const [successTitle, setSuccessTitle] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccessAction, setShowSuccessAction] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [errorDetails, setErrorDetails] = useState<any>(null);

    // Add form state
    const [addForm, setAddForm] = useState({
        vehicleType: "",
        subFleetId: "",
        makeAndModel: "",
        registrationNumber: "",
        nextService: "",
        assignedDriverId: "",
    });

    const [editForm, setEditForm] = useState({
        vehicleType: "",
        subFleetId: "",
        makeAndModel: "",
        registrationNumber: "",
        nextService: "",
        assignedDriverId: "",
    });

    // Open edit modal with vehicle data
    const handleOpenEditModal = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setEditForm({
            vehicleType: vehicle.vehicleType || "",
            subFleetId: vehicle.subFleetId || "",
            makeAndModel: `${vehicle.make} ${vehicle.model}`.trim(),
            registrationNumber: vehicle.registrationNumber || "",
            nextService: vehicle.nextService
                ? vehicle.nextService.split("T")[0]
                : "", // Extract date part
            assignedDriverId: vehicle.assignedDriverId || "",
        });
        setShowEditModal(true);
    };
    // Fetch vehicles
    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/vehicles`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch vehicles");
            }

            const data = await response.json();
            const vehiclesData = Array.isArray(data) ? data : [];
            setVehicles(vehiclesData);

            // Update stats
            const total = vehiclesData.length;
            const assigned = vehiclesData.filter(
                (v: Vehicle) => v.assignedDriverId,
            ).length;
            const unassigned = vehiclesData.filter(
                (v: Vehicle) => !v.assignedDriverId,
            ).length;
            const dueForService = vehiclesData.filter((v: Vehicle) => {
                if (!v.nextService) return false;
                const serviceDate = new Date(v.nextService);
                const today = new Date();
                const diffTime = serviceDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30;
            }).length;

            setStats({
                totalVehicles: total,
                assignedVehicles: assigned,
                unassignedVehicles: unassigned,
                dueForService: dueForService,
            });
        } catch (error) {
            console.error("Error fetching vehicles:", error);
            setVehicles([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch vehicle usage
    const fetchVehicleUsage = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/vehicles/usage`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                // If the endpoint doesn't exist, just set default values
                console.warn("Vehicle usage endpoint not available");
                setUsage(null);
                return;
            }

            const data = await response.json();
            setUsage(data);
        } catch (error) {
            // Silently handle the error - the endpoint might not exist yet
            console.warn("Failed to fetch vehicle usage:", error);
            setUsage(null);
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

            if (fleets.length > 0 && !addForm.subFleetId) {
                setAddForm((prev) => ({
                    ...prev,
                    subFleetId: fleets[0].id,
                }));
            }
        } catch (error) {
            console.error("Error fetching sub-fleets:", error);
            setSubFleets([]);
        }
    };

    // Fetch drivers for dropdown
    const fetchDrivers = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/drivers`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch drivers");
            }

            const data = await response.json();
            const driversData = Array.isArray(data) ? data : [];
            setDrivers(driversData);
        } catch (error) {
            console.error("Error fetching drivers:", error);
            setDrivers([]);
        }
    };

    useEffect(() => {
        fetchVehicles();
        fetchVehicleUsage();
        fetchSubFleets();
        fetchDrivers();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus]);

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

    // Add vehicle
    const handleAddVehicle = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");

            const payload = {
                vehicleType: addForm.vehicleType,
                subFleetId: addForm.subFleetId,
                makeAndModel: addForm.makeAndModel,
                registrationNumber: addForm.registrationNumber,
                nextService: addForm.nextService
                    ? new Date(addForm.nextService).toISOString()
                    : null, // Convert to ISO
                assignedDriverId: addForm.assignedDriverId || undefined,
            };

            const response = await fetch(`${API_BASE}/fleet/vehicles`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                if (
                    response.status === 403 &&
                    data.code === "PLAN_LIMIT_REACHED"
                ) {
                    setErrorDetails(data);
                    setShowAddModal(false);
                    setShowErrorModal(true);
                    setIsSubmitting(false);
                    return;
                }
                throw new Error(data.message || "Failed to add vehicle");
            }

            setShowAddModal(false);
            setSuccessTitle("Vehicle Added Successfully");
            setSuccessMessage(
                "The vehicle has been added to your fleet successfully.",
            );
            setShowSuccessModal(true);
            setShowSuccessAction(true);
            setAddForm({
                vehicleType: "",
                subFleetId: subFleets[0]?.id || "",
                makeAndModel: "",
                registrationNumber: "",
                nextService: "",
                assignedDriverId: "",
            });
            fetchVehicles();
            // fetchVehicleUsage(); // Comment this out if it's failing
        } catch (error: any) {
            console.error("Error adding vehicle:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit vehicle

    const handleEditVehicle = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");

            const payload = {
                vehicleType: editForm.vehicleType,
                subFleetId: editForm.subFleetId,
                makeAndModel: editForm.makeAndModel,
                registrationNumber: editForm.registrationNumber,
                nextService: editForm.nextService
                    ? new Date(editForm.nextService).toISOString()
                    : null, // Convert to ISO
                assignedDriverId: editForm.assignedDriverId || undefined,
            };

            const response = await fetch(
                `${API_BASE}/fleet/vehicles/${selectedVehicle?.id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update vehicle");
            }

            setShowEditModal(false);
            setSelectedVehicle(null);
            setSuccessTitle("Vehicle Updated Successfully");
            setSuccessMessage("The vehicle has been updated successfully.");
            setShowSuccessModal(true);
            setShowSuccessAction(false);
            fetchVehicles();
            // fetchVehicleUsage(); // Comment this out if it's failing
        } catch (error: any) {
            console.error("Error updating vehicle:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    // Remove vehicle
    const handleRemoveVehicle = async (vehicleId: string) => {
        try {
            setIsRemoving(true);
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE}/fleet/vehicles/${vehicleId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to remove vehicle");
            }

            setShowRemoveModal(false);
            setSelectedVehicle(null);
            setSuccessTitle("Vehicle Removed Successfully");
            setSuccessMessage(
                "The vehicle has been removed from your fleet successfully.",
            );
            setShowSuccessModal(true);
            setShowSuccessAction(false);
            fetchVehicles();
            fetchVehicleUsage();
        } catch (error) {
            console.error("Error removing vehicle:", error);
        } finally {
            setIsRemoving(false);
        }
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "AVAILABLE":
                return "text-[#2E7D32] bg-[#2E7D3224]";
            case "IN_USE":
                return "text-[#6E43A3] bg-[#6E43A324]";
            case "MAINTENANCE":
                return "text-[#F2A618] bg-[#F2A61824]";
            case "OUT_OF_SERVICE":
                return "text-[#FE3F21] bg-[#FE3F2124]";
            default:
                return "text-gray-500 bg-gray-100";
        }
    };

    // Get status display name
    const getStatusDisplay = (status: string) => {
        switch (status) {
            case "AVAILABLE":
                return "Available";
            case "IN_USE":
                return "In Use";
            case "MAINTENANCE":
                return "Maintenance";
            case "OUT_OF_SERVICE":
                return "Out of Service";
            default:
                return status;
        }
    };

    // Format date
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "-";
        try {
            return new Date(dateString).toLocaleDateString("en-CA");
        } catch {
            return "-";
        }
    };

    // Filter vehicles
    const filteredVehicles = vehicles.filter((vehicle) => {
        const searchLower = searchTerm.toLowerCase();
        const regMatch =
            vehicle.registrationNumber?.toLowerCase().includes(searchLower) ||
            false;
        const makeMatch =
            vehicle.make?.toLowerCase().includes(searchLower) || false;
        const modelMatch =
            vehicle.model?.toLowerCase().includes(searchLower) || false;
        const matchesSearch = regMatch || makeMatch || modelMatch;
        const matchesStatus =
            selectedStatus === "all" || vehicle.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalItems = filteredVehicles.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentVehicles = filteredVehicles.slice(startIndex, endIndex);

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
                            Vehicles
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className="text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {stats.totalVehicles} vehicles in your fleet
                            </span>
                            {usage && (
                                <span
                                    className="text-[#8E98A8] text-sm"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    • {usage.message}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-[#6E43A3] text-white px-6 py-2.5 rounded-xl hover:opacity-90 transition flex items-center gap-2"
                        style={{ fontFamily: "Outfit" }}
                    >
                        <Plus size={20} />
                        Add Vehicle
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4 flex-wrap">
                    <StatCard
                        icon={Car}
                        label="Total Vehicles"
                        value={stats.totalVehicles}
                        subtext="Across all fleets"
                        valueColor="text-[#6E43A3]"
                    />

                    <StatCard
                        icon={UserCheck}
                        label="Assigned Vehicles"
                        value={stats.assignedVehicles}
                        subtext="Driver Assigned"
                        valueColor="text-[#2E7D32]"
                    />

                    <StatCard
                        icon={UserX}
                        label="Unassigned Vehicles"
                        value={stats.unassignedVehicles}
                        subtext="No driver assigned yet"
                        valueColor="text-[#0B0015]"
                    />

                    <StatCard
                        icon={Calendar}
                        label="Due for Service"
                        value={stats.dueForService}
                        subtext="Due within 30 days"
                        valueColor="text-[#F2A618]"
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
                            All Vehicles ({totalItems})
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E98A8]"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Search vehicles..."
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
                                    <option value="AVAILABLE">Available</option>
                                    <option value="IN_USE">In Use</option>
                                    <option value="MAINTENANCE">
                                        Maintenance
                                    </option>
                                    <option value="OUT_OF_SERVICE">
                                        Out of Service
                                    </option>
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
                                        Vehicle
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Type
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Trips
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Driver
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
                                        Next Service
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
                                            colSpan={8}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            Loading vehicles...
                                        </td>
                                    </tr>
                                ) : currentVehicles.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            No vehicles found
                                        </td>
                                    </tr>
                                ) : (
                                    currentVehicles.map((vehicle) => (
                                        <tr
                                            key={vehicle.id}
                                            className="border-b border-[#E0E5EB] hover:bg-[#F7F7F7] transition"
                                        >
                                            <td className="py-3">
                                                <div>
                                                    <div
                                                        className="text-sm font-medium text-[#111827]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {vehicle.deviceId.slice(
                                                            0,
                                                            17,
                                                        )}
                                                        ...
                                                    </div>
                                                    <div
                                                        className="text-xs text-[#8E98A8]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {vehicle.registrationNumber ||
                                                            "-"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div>
                                                    <div
                                                        className="text-sm text-[#111827]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {vehicle.vehicleType ||
                                                            "Car"}
                                                    </div>
                                                    <div
                                                        className="text-xs text-[#8E98A8]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {vehicle.make}{" "}
                                                        {vehicle.model}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    -
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#111827]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {vehicle.assignedDriverId
                                                        ? "Assigned"
                                                        : "-"}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#111827]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {vehicle.subFleet?.name ||
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
                                                        vehicle.nextService,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(vehicle.status)}`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {getStatusDisplay(
                                                        vehicle.status,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedVehicle(
                                                                vehicle,
                                                            );
                                                            setActiveDropdown(
                                                                activeDropdown ===
                                                                    vehicle.id
                                                                    ? null
                                                                    : vehicle.id,
                                                            );
                                                        }}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                                                    >
                                                        <MoreVertical
                                                            size={18}
                                                            className="text-[#8E98A8]"
                                                        />
                                                    </button>

                                                    {activeDropdown ===
                                                        vehicle.id && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E0E5EB] min-w-[180px] z-10 py-1">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdown(
                                                                        null,
                                                                    );
                                                                    setSelectedVehicle(
                                                                        vehicle,
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
                                                                    setActiveDropdown(
                                                                        null,
                                                                    );
                                                                    handleOpenEditModal(
                                                                        vehicle,
                                                                    );
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-[#0B0015] hover:bg-[#F7F7F7] flex items-center gap-2"
                                                            >
                                                                <Edit
                                                                    size={16}
                                                                />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdown(
                                                                        null,
                                                                    );
                                                                    setSelectedVehicle(
                                                                        vehicle,
                                                                    );
                                                                    setShowRemoveModal(
                                                                        true,
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
                                <span className="ml-4"></span>
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

                                {totalPages > 1 && (
                                    <>
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
                                                    pageNum =
                                                        totalPages - 4 + i;
                                                } else {
                                                    pageNum =
                                                        currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() =>
                                                            setCurrentPage(
                                                                pageNum,
                                                            )
                                                        }
                                                        className={`w-8 h-8 rounded-lg text-sm transition ${
                                                            currentPage ===
                                                            pageNum
                                                                ? "bg-[#6E43A3] text-white"
                                                                : "text-[#8E98A8] hover:bg-[#F7F7F7]"
                                                        }`}
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            },
                                        )}
                                    </>
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

            {/* ADD VEHICLE MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Add Vehicle
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Add a new vehicle to your fleet
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={addForm.vehicleType}
                                        onChange={(e) =>
                                            setAddForm((prev) => ({
                                                ...prev,
                                                vehicleType: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        <option value="">Select type</option>
                                        <option value="sedan">Sedan</option>
                                        <option value="car">Car</option>
                                        <option value="suv">SUV</option>
                                        <option value="truck">Truck</option>
                                        <option value="van">Van</option>
                                        <option value="pickup">Pickup</option>
                                        <option value="bus">Bus</option>
                                        <option value="motorcycle">
                                            Motorcycle
                                        </option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Sub-fleet
                                    </label>
                                    <select
                                        value={addForm.subFleetId}
                                        onChange={(e) =>
                                            setAddForm((prev) => ({
                                                ...prev,
                                                subFleetId: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Make & Model
                                    </label>
                                    <input
                                        type="text"
                                        value={addForm.makeAndModel}
                                        onChange={(e) =>
                                            setAddForm((prev) => ({
                                                ...prev,
                                                makeAndModel: e.target.value,
                                            }))
                                        }
                                        placeholder="Toyota Camry 2024"
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Registration Number
                                    </label>
                                    <input
                                        type="text"
                                        value={addForm.registrationNumber}
                                        onChange={(e) =>
                                            setAddForm((prev) => ({
                                                ...prev,
                                                registrationNumber:
                                                    e.target.value,
                                            }))
                                        }
                                        placeholder="ABC-456"
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Next Service
                                    </label>
                                    <input
                                        type="date"
                                        value={addForm.nextService}
                                        onChange={(e) =>
                                            setAddForm((prev) => ({
                                                ...prev,
                                                nextService: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Assign Driver (Optional)
                                    </label>
                                    <select
                                        value={addForm.assignedDriverId}
                                        onChange={(e) =>
                                            setAddForm((prev) => ({
                                                ...prev,
                                                assignedDriverId:
                                                    e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        <option value="">Select driver</option>
                                        {drivers.map((driver) => (
                                            <option
                                                key={driver.id}
                                                value={driver.id}
                                            >
                                                {driver.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddVehicle}
                                    disabled={
                                        !addForm.vehicleType ||
                                        !addForm.subFleetId ||
                                        !addForm.makeAndModel ||
                                        !addForm.registrationNumber ||
                                        isSubmitting
                                    }
                                    className={`flex-1 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:cursor-not-allowed ${
                                        !addForm.vehicleType ||
                                        !addForm.subFleetId ||
                                        !addForm.makeAndModel ||
                                        !addForm.registrationNumber
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
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            Add Vehicle <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR / WARNING MODAL (Plan Limit) */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#FFEED4] flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-[#F09205]" />
                        </div>
                        <h3
                            className="text-2xl font-bold text-[#1F083B] text-center mb-2"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Vehicle Limit Reached
                        </h3>
                        <p
                            className="text-[#5B646F] text-center mb-4"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {errorDetails?.message ||
                                "You've reached your vehicle limit. Upgrade your plan to add more vehicles."}
                        </p>
                        <p
                            className="text-[#5B646F] text-sm text-center mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Upgrade your plan to unlock additional vehicles and
                            more advanced fleet management capabilities.
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
                                Vehicles:
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
                                    setShowErrorModal(false);
                                    setErrorDetails(null);
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

            {/* VIEW VEHICLE DETAILS MODAL */}

            {showViewModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Vehicle Details
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Vehicle information and status
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedVehicle(null);
                                }}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        {/* Vehicle Header with Status */}
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#EDE8F4] flex items-center justify-center text-[#6E43A3]">
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <div
                                            className="text-xl font-bold text-[#1A2A3F]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {selectedVehicle.registrationNumber}
                                        </div>
                                        <div
                                            className="text-sm text-[#5B646F]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {selectedVehicle.make}{" "}
                                            {selectedVehicle.model}
                                        </div>
                                        <div
                                            className="text-xs text-[#8E98A8] mt-0.5"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            ID: {selectedVehicle.id}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(selectedVehicle.status)}`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {getStatusDisplay(selectedVehicle.status)}
                                </span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-3 mt-6">
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
                                    {selectedVehicle.subFleet?.name || "-"}
                                </div>
                            </div>
                            <div className="bg-[#7A84921A] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Vehicle Type
                                </div>
                                <div
                                    className="text-base font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedVehicle.vehicleType || "Car"}
                                </div>
                            </div>
                            <div className="bg-[#7A84921A] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Driver
                                </div>
                                <div
                                    className="text-base font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedVehicle.assignedDriverId
                                        ? "Assigned"
                                        : "Unassigned"}
                                </div>
                            </div>
                            <div className="bg-[#7A84921A] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Next Service
                                </div>
                                <div
                                    className="text-base font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {formatDate(selectedVehicle.nextService)}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-[#F8F8F8] rounded-xl p-3">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Device ID
                                </div>
                                <div
                                    className="text-sm font-medium text-[#1A2A3F] mt-0.5"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedVehicle.deviceId || "-"}
                                </div>
                            </div>
                            <div className="bg-[#F8F8F8] rounded-xl p-3">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Device Type
                                </div>
                                <div
                                    className="text-sm font-medium text-[#1A2A3F] mt-0.5"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedVehicle.deviceType || "-"}
                                </div>
                            </div>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] my-6" />

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleOpenEditModal(selectedVehicle);
                                }}
                                className="flex-1 px-6 py-3 rounded-xl text-[#6E43A3] border border-[#6E43A3] hover:bg-[#6E43A3] hover:text-white transition flex items-center justify-center gap-2"
                                style={{ fontFamily: "Outfit" }}
                            >
                                <Edit size={18} />
                                Edit Vehicle
                            </button>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setShowRemoveModal(true);
                                }}
                                className="flex-1 px-6 py-3 rounded-xl text-[#B71C1C] border border-[#B71C1C] hover:bg-[#B71C1C] hover:text-white transition flex items-center justify-center gap-2"
                                style={{ fontFamily: "Outfit" }}
                            >
                                <Trash2 size={18} />
                                Remove Vehicle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REMOVE VEHICLE MODAL */}
            {showRemoveModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#B71C1C20] flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} style={{ color: "#B71C1C" }} />
                        </div>
                        <h3
                            className="text-xl font-bold text-center"
                            style={{ fontFamily: "Outfit", color: "#1F083B" }}
                        >
                            Remove This Vehicle?
                        </h3>
                        <p
                            className="mt-4 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#5B646F" }}
                        >
                            Are you sure you want to remove{" "}
                            <strong>
                                {selectedVehicle.registrationNumber}
                            </strong>{" "}
                            from your fleet?
                        </p>
                        <div
                            className="mt-6 h-px w-full"
                            style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <p
                            className="mt-6 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            This action will permanently remove the vehicle from
                            your fleet. This action cannot be undone.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3">
                            <button
                                onClick={() => {
                                    setShowRemoveModal(false);
                                    setSelectedVehicle(null);
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
                                    handleRemoveVehicle(selectedVehicle.id)
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
                                    "Remove Vehicle"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT VEHICLE MODAL */}
            {showEditModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Edit Vehicle
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Update vehicle information
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedVehicle(null);
                                }}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={editForm.vehicleType}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                vehicleType: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        <option value="">Select type</option>
                                        <option value="sedan">Sedan</option>
                                        <option value="car">Car</option>
                                        <option value="suv">SUV</option>
                                        <option value="truck">Truck</option>
                                        <option value="van">Van</option>
                                        <option value="pickup">Pickup</option>
                                        <option value="bus">Bus</option>
                                        <option value="motorcycle">
                                            Motorcycle
                                        </option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Sub-fleet
                                    </label>
                                    <select
                                        value={editForm.subFleetId}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                subFleetId: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Make & Model
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.makeAndModel}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                makeAndModel: e.target.value,
                                            }))
                                        }
                                        placeholder="Toyota Camry 2024"
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Registration Number
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.registrationNumber}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                registrationNumber:
                                                    e.target.value,
                                            }))
                                        }
                                        placeholder="ABC-456"
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Next Service
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.nextService}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                nextService: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Assign Driver (Optional)
                                    </label>
                                    <select
                                        value={editForm.assignedDriverId}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({
                                                ...prev,
                                                assignedDriverId:
                                                    e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        <option value="">Select driver</option>
                                        {drivers.map((driver) => (
                                            <option
                                                key={driver.id}
                                                value={driver.id}
                                            >
                                                {driver.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedVehicle(null);
                                    }}
                                    className="flex-1 px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditVehicle}
                                    disabled={
                                        !editForm.vehicleType ||
                                        !editForm.subFleetId ||
                                        !editForm.makeAndModel ||
                                        !editForm.registrationNumber ||
                                        isSubmitting
                                    }
                                    className={`flex-1 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:cursor-not-allowed ${
                                        !editForm.vehicleType ||
                                        !editForm.subFleetId ||
                                        !editForm.makeAndModel ||
                                        !editForm.registrationNumber
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
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            Update Vehicle{" "}
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
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
                            The vehicle has been added to your fleet and is now
                            available for driver assignment, trip tracking, and
                            real-time monitoring.
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
                                    setShowAddModal(true);
                                    setShowSuccessAction(false);
                                }}
                                className="w-full text-[#6E43A3] text-sm mt-3 hover:underline transition"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Add Another Vehicle
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FleetVehicles;
