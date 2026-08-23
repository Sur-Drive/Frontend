import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Eye,
    Trash2,
    Edit,
    Car,
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
    const handleOpenEditModal = async (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setEditForm({
            vehicleType: vehicle.vehicleType || "",
            subFleetId: vehicle.subFleetId || "",
            makeAndModel: `${vehicle.make} ${vehicle.model}`.trim(),
            registrationNumber: vehicle.registrationNumber || "",
            nextService: vehicle.nextService
                ? vehicle.nextService.split("T")[0]
                : "",
            assignedDriverId: vehicle.assignedDriverId || "",
        });

        // Fetch sub-fleets if they're not already loaded
        if (subFleets.length === 0) {
            await fetchSubFleets();
        }

        setShowEditModal(true);
    };
    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // Fetch both vehicles and sub-fleets in parallel
            const [vehiclesResponse, subFleetsResponse] = await Promise.all([
                fetch(`${API_BASE}/fleet/vehicles`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }),
                fetch(`${API_BASE}/fleet/sub-fleets`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }),
            ]);

            if (!vehiclesResponse.ok) {
                throw new Error("Failed to fetch vehicles");
            }

            const vehiclesData = await vehiclesResponse.json();
            const vehiclesArray = Array.isArray(vehiclesData)
                ? vehiclesData
                : [];

            // Fetch sub-fleets data
            let subFleetsData = [];
            if (subFleetsResponse.ok) {
                const data = await subFleetsResponse.json();
                subFleetsData = Array.isArray(data) ? data : [];
            }

            // Create a map for quick sub-fleet lookups
            const subFleetMap = new Map();
            subFleetsData.forEach((fleet: any) => {
                subFleetMap.set(fleet.id, {
                    id: fleet.id,
                    name: fleet.name,
                });
            });

            // Enrich vehicles with sub-fleet data
            const enrichedVehicles = vehiclesArray.map((vehicle: any) => ({
                ...vehicle,
                subFleet: vehicle.subFleetId
                    ? subFleetMap.get(vehicle.subFleetId) || null
                    : null,
                assignedDriver: vehicle.assignedDriverId
                    ? {
                          id: vehicle.assignedDriverId,
                          fullName: "Assigned",
                      }
                    : undefined,
            }));

            setVehicles(enrichedVehicles);

            // Update stats
            const total = enrichedVehicles.length;
            const assigned = enrichedVehicles.filter(
                (v: Vehicle) => v.assignedDriverId,
            ).length;
            const unassigned = enrichedVehicles.filter(
                (v: Vehicle) => !v.assignedDriverId,
            ).length;
            const dueForService = enrichedVehicles.filter((v: Vehicle) => {
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
        <div className="min-h-screen bg-[#F7F7F7] p-3 sm:p-4 md:p-6">
            <div className="mx-auto max-w-[1190px] space-y-3 sm:space-y-4 md:space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                            Vehicles
                        </h1>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-[#8E98A8] sm:gap-2">
                            <span>
                                {stats.totalVehicles} vehicles in your fleet
                            </span>
                            {usage && <span>• {usage.message}</span>}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6E43A3] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95 sm:w-auto sm:px-6 sm:py-2.5"
                    >
                        <Plus size={18} className="sm:size-[20px]" />
                        <span>Add Vehicle</span>
                    </button>
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-[#6E43A310] p-2">
                                <Car size={18} className="text-[#6E43A3]" />
                            </div>
                            <div>
                                <p className="text-xs text-[#8E98A8]">
                                    Total Vehicles
                                </p>
                                <p className="text-xl font-bold text-[#1F083B]">
                                    {stats.totalVehicles}
                                </p>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-[#8E98A8]">
                            Across all fleets
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-[#2E7D3220] p-2">
                                <UserCheck
                                    size={18}
                                    className="text-[#2E7D32]"
                                />
                            </div>
                            <div>
                                <p className="text-xs text-[#8E98A8]">
                                    Assigned Vehicles
                                </p>
                                <p className="text-xl font-bold text-[#1F083B]">
                                    {stats.assignedVehicles}
                                </p>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-[#8E98A8]">
                            Driver Assigned
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-[#0B001510] p-2">
                                <UserX size={18} className="text-[#0B0015]" />
                            </div>
                            <div>
                                <p className="text-xs text-[#8E98A8]">
                                    Unassigned Vehicles
                                </p>
                                <p className="text-xl font-bold text-[#1F083B]">
                                    {stats.unassignedVehicles}
                                </p>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-[#8E98A8]">
                            No driver assigned yet
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-[#F2A61820] p-2">
                                <Calendar
                                    size={18}
                                    className="text-[#F2A618]"
                                />
                            </div>
                            <div>
                                <p className="text-xs text-[#8E98A8]">
                                    Due for Service
                                </p>
                                <p className="text-xl font-bold text-[#1F083B]">
                                    {stats.dueForService}
                                </p>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-[#8E98A8]">
                            Due within 30 days
                        </p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4 md:p-6">
                    {/* Table Header */}
                    <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-base font-semibold text-[#1F083B] sm:text-lg">
                            All Vehicles ({totalItems})
                        </h2>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <div className="relative w-full sm:w-48 md:w-64">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    placeholder="Search vehicles..."
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

                    {/* Mobile Cards */}
                    <div className="space-y-3 sm:hidden">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                Loading vehicles...
                            </div>
                        ) : currentVehicles.length === 0 ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                No vehicles found
                            </div>
                        ) : (
                            currentVehicles.map((vehicle) => {
                                const isDropdownOpen =
                                    activeDropdown === vehicle.id;
                                return (
                                    <div
                                        key={vehicle.id}
                                        className="rounded-lg border border-[#E0E5EB] bg-white p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium text-[#111827]">
                                                    {vehicle.deviceId.slice(
                                                        0,
                                                        17,
                                                    )}
                                                    ...
                                                </div>
                                                <div className="truncate text-xs text-[#8E98A8]">
                                                    {vehicle.registrationNumber ||
                                                        "-"}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-xs text-[#111827]">
                                                        {vehicle.vehicleType ||
                                                            "Car"}
                                                    </span>
                                                    <span className="text-xs text-[#8E98A8]">
                                                        {vehicle.make}{" "}
                                                        {vehicle.model}
                                                    </span>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(vehicle.status)}`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                                {getStatusDisplay(
                                                    vehicle.status,
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#E0E5EB] pt-3">
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Driver
                                                </p>
                                                <p className="truncate text-sm font-medium text-[#111827]">
                                                    {vehicle.assignedDriverId
                                                        ? "Assigned"
                                                        : "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Sub-fleet
                                                </p>
                                                <p className="truncate text-sm font-medium text-[#111827]">
                                                    {vehicle.subFleet?.name ||
                                                        "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Next Service
                                                </p>
                                                <p className="truncate text-sm font-medium text-[#111827]">
                                                    {formatDate(
                                                        vehicle.nextService,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-end justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedVehicle(
                                                            vehicle,
                                                        );
                                                        setActiveDropdown(
                                                            isDropdownOpen
                                                                ? null
                                                                : vehicle.id,
                                                        );
                                                    }}
                                                    className="rounded-lg p-2 transition hover:bg-gray-100 active:bg-gray-200"
                                                >
                                                    <MoreVertical
                                                        size={20}
                                                        className="text-[#8E98A8]"
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        {isDropdownOpen && (
                                            <div className="mt-3 rounded-lg border border-[#E0E5EB] bg-white shadow-lg">
                                                <button
                                                    onClick={() => {
                                                        setActiveDropdown(null);
                                                        setSelectedVehicle(
                                                            vehicle,
                                                        );
                                                        setShowViewModal(true);
                                                    }}
                                                    className="flex w-full items-center gap-3 rounded-t-lg px-4 py-3 text-sm text-[#0B0015] transition hover:bg-[#F7F7F7]"
                                                >
                                                    <Eye size={16} /> View
                                                    Details
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActiveDropdown(null);
                                                        handleOpenEditModal(
                                                            vehicle,
                                                        );
                                                    }}
                                                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#0B0015] transition hover:bg-[#F7F7F7]"
                                                >
                                                    <Edit size={16} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActiveDropdown(null);
                                                        setSelectedVehicle(
                                                            vehicle,
                                                        );
                                                        setShowRemoveModal(
                                                            true,
                                                        );
                                                    }}
                                                    className="flex w-full items-center gap-3 rounded-b-lg border-t border-[#E0E5EB] px-4 py-3 text-sm text-[#B71C1C] transition hover:bg-[#F7F7F7]"
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

                    {/* Desktop Table */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-[#E0E5EB]">
                                    <th className="py-2 text-left text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm">
                                        Vehicle
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] md:table-cell sm:py-3 sm:text-sm">
                                        Type
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] lg:table-cell sm:py-3 sm:text-sm">
                                        Driver
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] xl:table-cell sm:py-3 sm:text-sm">
                                        Sub-fleet
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] xl:table-cell sm:py-3 sm:text-sm">
                                        Next Service
                                    </th>
                                    <th className="py-2 text-left text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm">
                                        Status
                                    </th>
                                    <th className="py-2 text-right text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-sm text-[#8E98A8]"
                                        >
                                            Loading vehicles...
                                        </td>
                                    </tr>
                                ) : currentVehicles.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-sm text-[#8E98A8]"
                                        >
                                            No vehicles found
                                        </td>
                                    </tr>
                                ) : (
                                    currentVehicles.map((vehicle) => {
                                        const isDropdownOpen =
                                            activeDropdown === vehicle.id;
                                        return (
                                            <tr
                                                key={vehicle.id}
                                                className="border-b border-[#E0E5EB] transition hover:bg-[#F7F7F7]"
                                            >
                                                <td className="py-2 sm:py-3">
                                                    <div>
                                                        <div className="truncate text-sm font-medium text-[#111827]">
                                                            {vehicle.deviceId.slice(
                                                                0,
                                                                17,
                                                            )}
                                                            ...
                                                        </div>
                                                        <div className="truncate text-xs text-[#8E98A8]">
                                                            {vehicle.registrationNumber ||
                                                                "-"}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden py-2 md:table-cell sm:py-3">
                                                    <div>
                                                        <div className="text-sm text-[#111827]">
                                                            {vehicle.vehicleType ||
                                                                "Car"}
                                                        </div>
                                                        <div className="text-xs text-[#8E98A8]">
                                                            {vehicle.make}{" "}
                                                            {vehicle.model}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden py-2 lg:table-cell sm:py-3">
                                                    <span className="text-sm text-[#111827]">
                                                        {vehicle.assignedDriverId
                                                            ? "Assigned"
                                                            : "—"}
                                                    </span>
                                                </td>
                                                <td className="hidden py-2 xl:table-cell sm:py-3">
                                                    <span className="text-sm text-[#111827]">
                                                        {vehicle.subFleet
                                                            ?.name || "—"}
                                                    </span>
                                                </td>
                                                <td className="hidden py-2 xl:table-cell sm:py-3">
                                                    <span className="text-sm text-[#111827]">
                                                        {formatDate(
                                                            vehicle.nextService,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-2 sm:py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium sm:px-3 ${getStatusColor(vehicle.status)}`}
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                                        {getStatusDisplay(
                                                            vehicle.status,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-2 text-right sm:py-3">
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedVehicle(
                                                                    vehicle,
                                                                );
                                                                setActiveDropdown(
                                                                    isDropdownOpen
                                                                        ? null
                                                                        : vehicle.id,
                                                                );
                                                            }}
                                                            className="rounded-lg p-1.5 transition hover:bg-gray-100 sm:p-2"
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
                                                                        setSelectedVehicle(
                                                                            vehicle,
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
                                                                        setActiveDropdown(
                                                                            null,
                                                                        );
                                                                        handleOpenEditModal(
                                                                            vehicle,
                                                                        );
                                                                    }}
                                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#0B0015] transition hover:bg-[#F7F7F7] sm:px-4 sm:text-sm"
                                                                >
                                                                    <Edit
                                                                        size={
                                                                            14
                                                                        }
                                                                    />{" "}
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

                    {/* Pagination */}
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
                                            : "hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
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
                                                        className={`h-7 w-7 rounded-lg text-xs transition sm:h-8 sm:w-8 sm:text-sm ${
                                                            currentPage ===
                                                            pageNum
                                                                ? "bg-[#6E43A3] text-white"
                                                                : "text-[#8E98A8] hover:bg-[#F7F7F7]"
                                                        }`}
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
                                    className={`rounded-lg border border-[#E0E5EB] p-1.5 transition sm:p-2 ${
                                        currentPage === totalPages
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:bg-[#F7F7F7] active:bg-[#E5E7EB]"
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

            {/* ADD VEHICLE MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:p-8">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Add Vehicle
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Add a new vehicle to your fleet
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-shrink-0 rounded-lg p-1 text-[#5B646F] transition hover:bg-gray-100 hover:text-[#1F083B]"
                            >
                                <X size={20} className="sm:size-[24px]" />
                            </button>
                        </div>

                        <div className="mb-4 h-px w-full bg-[#E5E7EB] sm:mb-6" />

                        <div className="space-y-4">
                            {/* Row 1: Vehicle Type & Sub-fleet */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
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
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
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

                            {/* Row 2: Make & Model & Registration Number */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Next Service & Assign Driver */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
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

                            {/* Buttons */}
                            <div className="mt-4 flex flex-col-reverse gap-3 sm:mt-6 sm:flex-row sm:gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm text-[#8E98A8] transition hover:bg-gray-50 sm:flex-1 sm:px-6"
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
                                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed sm:flex-1 sm:px-6 ${
                                        !addForm.vehicleType ||
                                        !addForm.subFleetId ||
                                        !addForm.makeAndModel ||
                                        !addForm.registrationNumber
                                            ? "bg-[#8E98A8] text-white"
                                            : "bg-[#6E43A3] text-white hover:opacity-90"
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg
                                                className="h-5 w-5 animate-spin text-white"
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
                                            Add Vehicle
                                            <ArrowRight
                                                size={16}
                                                className="sm:size-[18px]"
                                            />
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
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:p-8">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Vehicle Details
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Vehicle information and status
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedVehicle(null);
                                }}
                                className="flex-shrink-0 rounded-lg p-1 text-[#5B646F] transition hover:bg-gray-100 hover:text-[#1F083B]"
                            >
                                <X size={20} className="sm:size-[24px]" />
                            </button>
                        </div>

                        <div className="mb-4 h-px w-full bg-[#E5E7EB] sm:mb-6" />

                        {/* Vehicle Header with Status */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE8F4] text-[#6E43A3]">
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-[#1A2A3F] sm:text-xl">
                                            {selectedVehicle.registrationNumber}
                                        </div>
                                        <div className="text-sm text-[#5B646F]">
                                            {selectedVehicle.make}{" "}
                                            {selectedVehicle.model}
                                        </div>
                                        <div className="mt-0.5 text-xs text-[#8E98A8]">
                                            ID: {selectedVehicle.id}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(selectedVehicle.status)}`}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                    {getStatusDisplay(selectedVehicle.status)}
                                </span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-4 sm:gap-3">
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Sub-fleet
                                </div>
                                <div className="mt-1 text-sm font-bold text-[#1A2A3F] sm:text-base">
                                    {selectedVehicle.subFleet?.name || "-"}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Vehicle Type
                                </div>
                                <div className="mt-1 text-sm font-bold text-[#1A2A3F] sm:text-base">
                                    {selectedVehicle.vehicleType || "Car"}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Driver
                                </div>
                                <div className="mt-1 text-sm font-bold text-[#1A2A3F] sm:text-base">
                                    {selectedVehicle.assignedDriverId
                                        ? "Assigned"
                                        : "Unassigned"}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Next Service
                                </div>
                                <div className="mt-1 text-sm font-bold text-[#1A2A3F] sm:text-base">
                                    {formatDate(selectedVehicle.nextService)}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3">
                            <div className="rounded-xl bg-[#F8F8F8] p-3">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Device ID
                                </div>
                                <div className="mt-0.5 truncate text-sm font-medium text-[#1A2A3F]">
                                    {selectedVehicle.deviceId || "-"}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#F8F8F8] p-3">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Device Type
                                </div>
                                <div className="mt-0.5 text-sm font-medium text-[#1A2A3F]">
                                    {selectedVehicle.deviceType || "-"}
                                </div>
                            </div>
                        </div>

                        <div className="my-4 h-px w-full bg-[#E5E7EB] sm:my-6" />

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleOpenEditModal(selectedVehicle);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#6E43A3] px-4 py-3 text-sm text-[#6E43A3] transition hover:bg-[#6E43A3] hover:text-white sm:flex-1 sm:px-6"
                            >
                                <Edit size={16} className="sm:size-[18px]" />
                                Edit Vehicle
                            </button>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setShowRemoveModal(true);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#B71C1C] px-4 py-3 text-sm text-[#B71C1C] transition hover:bg-[#B71C1C] hover:text-white sm:flex-1 sm:px-6"
                            >
                                <Trash2 size={16} className="sm:size-[18px]" />
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
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:p-8">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Edit Vehicle
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Update vehicle information
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedVehicle(null);
                                }}
                                className="flex-shrink-0 rounded-lg p-1 text-[#5B646F] transition hover:bg-gray-100 hover:text-[#1F083B]"
                            >
                                <X size={20} className="sm:size-[24px]" />
                            </button>
                        </div>

                        <div className="mb-4 h-px w-full bg-[#E5E7EB] sm:mb-6" />

                        <div className="space-y-4">
                            {/* Row 1: Vehicle Type & Sub-fleet */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
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
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
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

                            {/* Row 2: Make & Model & Registration Number */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Next Service & Assign Driver */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
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

                            {/* Buttons */}
                            <div className="mt-4 flex flex-col-reverse gap-3 sm:mt-6 sm:flex-row sm:gap-3">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedVehicle(null);
                                    }}
                                    className="w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm text-[#8E98A8] transition hover:bg-gray-50 sm:flex-1 sm:px-6"
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
                                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed sm:flex-1 sm:px-6 ${
                                        !editForm.vehicleType ||
                                        !editForm.subFleetId ||
                                        !editForm.makeAndModel ||
                                        !editForm.registrationNumber
                                            ? "bg-[#8E98A8] text-white"
                                            : "bg-[#6E43A3] text-white hover:opacity-90"
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg
                                                className="h-5 w-5 animate-spin text-white"
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
                                            Update Vehicle
                                            <ArrowRight
                                                size={16}
                                                className="sm:size-[18px]"
                                            />
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
