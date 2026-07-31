import React, { useState, useEffect } from "react";
import {
    Search,
    Eye,
    MapPin,
    Car,
    CheckCircle,
    XCircle,
    Navigation,
    Activity,
    X,
    ChevronRight,
    Clock,
} from "lucide-react";
import DashSidebar from "../Dashboard/DashSidebar";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface Trip {
    id: string;
    tripNumber: string | null;
    tripStatus: "completed" | "in_progress" | "cancelled";
    driverId: string;
    vehicleId: string;
    loginTime: string;
    logoutTime: string | null;
    isActive: boolean;
    loginLocation: string;
    logoutLocation: string | null;
    loginCoordinates: {
        latitude: string;
        longitude: string;
    };
    logoutCoordinates: {
        latitude: string;
        longitude: string;
    } | null;
    stats: {
        totalDistance: string;
        totalDuration: number;
        hazardsReported: number;
        hazardsConfirmed: number;
        hazardsIncorrect: number;
        routesPlanned: number;
        sosAlerts: number;
        topSpeed: number | null;
        avgSpeed: number | null;
        hardBrakes: number;
        rapidAccelerations: number;
    };
    vehicle: {
        id: string;
        registrationNumber: string;
        make: string;
        model: string;
        deviceId: string;
    };
    driver: {
        id: string;
        name: string;
    };
}

interface TripStats {
    totalTrips: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    totalDistance: string;
}

const FleetTrips: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [stats, setStats] = useState<TripStats>({
        totalTrips: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        totalDistance: "0km",
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // Fetch trips
    const fetchTrips = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/sessions/trips`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch trips");
            }

            const data = await response.json();
            const tripsData = Array.isArray(data?.items) ? data.items : [];
            setTrips(tripsData);

            // Update stats
            const total = tripsData.length;
            const inProgress = tripsData.filter(
                (t: Trip) => t.tripStatus === "in_progress",
            ).length;
            const completed = tripsData.filter(
                (t: Trip) => t.tripStatus === "completed",
            ).length;
            const cancelled = tripsData.filter(
                (t: Trip) => t.tripStatus === "cancelled",
            ).length;

            // Calculate total distance
            let totalDistance = 0;
            tripsData.forEach((t: Trip) => {
                totalDistance += parseFloat(t.stats?.totalDistance || "0");
            });

            setStats({
                totalTrips: total,
                inProgress: inProgress,
                completed: completed,
                cancelled: cancelled,
                totalDistance: `${totalDistance.toFixed(1)}km`,
            });
        } catch (error) {
            console.error("Error fetching trips:", error);
            setTrips([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus]);

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "text-[#2E7D32] bg-[#2E7D3224]";
            case "in_progress":
            case "active":
                return "text-[#6E43A3] bg-[#6E43A324]";
            case "cancelled":
                return "text-[#FE3F21] bg-[#FE3F2124]";
            default:
                return "text-gray-500 bg-gray-100";
        }
    };

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case "completed":
                return "Completed";
            case "in_progress":
                return "In Progress";
            case "active":
                return "Active";
            case "cancelled":
                return "Cancelled";
            default:
                return status;
        }
    };

    // Format date to "2026-07-15 06:12 PM"
    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;
            const formattedHours = String(hours).padStart(2, "0");
            return `${year}-${month}-${day} ${formattedHours}:${minutes} ${ampm}`;
        } catch {
            return "-";
        }
    };

    // Format duration
    const formatDuration = (seconds: number) => {
        if (!seconds || seconds === 0) return "0s";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    };

    // Get initials
    const getInitials = (name: string) => {
        if (!name) return "??";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Filter trips
    const filteredTrips = trips.filter((trip) => {
        const searchLower = searchTerm.toLowerCase();
        const driverMatch =
            trip.driver?.name?.toLowerCase().includes(searchLower) || false;
        const vehicleMatch =
            trip.vehicle?.registrationNumber
                ?.toLowerCase()
                .includes(searchLower) || false;
        const tripNumberMatch =
            trip.tripNumber?.toLowerCase().includes(searchLower) || false;
        const matchesSearch = driverMatch || vehicleMatch || tripNumberMatch;
        const matchesStatus =
            selectedStatus === "all" || trip.tripStatus === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalItems = filteredTrips.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTrips = filteredTrips.slice(startIndex, endIndex);

    return (
        <DashSidebar>
            <div className="p-8">
                {/* Header */}
                <div className="bg-white rounded-xl p-6">
                    <div>
                        <h1
                            className="text-2xl font-bold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Trips
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className="text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Live and historical trip records across your
                                fleet
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4 flex-wrap mt-6">
                    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                            <Navigation size={18} className="text-[#6E43A3]" />
                            <span className="text-sm font-medium">
                                Total Trips
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-[#6E43A3]">
                            {stats.totalTrips}
                        </div>
                        <div className="text-xs text-[#8E98A8] mt-1">
                            ({stats.totalDistance}) Across all fleets
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                            <Activity size={18} className="text-[#6E43A3]" />
                            <span className="text-sm font-medium">
                                In Progress
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-[#6E43A3]">
                            {stats.inProgress}
                        </div>
                        <div className="text-xs text-[#8E98A8] mt-1">
                            Currently in transit
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                            <CheckCircle size={18} className="text-[#2E7D32]" />
                            <span className="text-sm font-medium">
                                Completed
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-[#2E7D32]">
                            {stats.completed}
                        </div>
                        <div className="text-xs text-[#8E98A8] mt-1">
                            Completed trips
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                            <XCircle size={18} className="text-[#FE3F21]" />
                            <span className="text-sm font-medium">
                                Cancelled
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-[#FE3F21]">
                            {stats.cancelled}
                        </div>
                        <div className="text-xs text-[#8E98A8] mt-1">
                            Trip cancelled
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl p-6 mt-6">
                    {/* Table Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2
                            className="text-lg font-semibold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Trips ({totalItems})
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E98A8]"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Search by driver name..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 pr-4 py-2 bg-[#F8F8F8] rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) =>
                                        setSelectedStatus(e.target.value)
                                    }
                                    className="bg-[#F8F8F8] px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="in_progress">
                                        In Progress
                                    </option>
                                    <option value="active">Active</option>
                                    <option value="cancelled">Cancelled</option>
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
                                        Trip
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Driver / Vehicle
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Route
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Distance / Duration
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Started
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
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            Loading trips...
                                        </td>
                                    </tr>
                                ) : currentTrips.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            No trips found
                                        </td>
                                    </tr>
                                ) : (
                                    currentTrips.map((trip) => (
                                        <tr
                                            key={trip.id}
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
                                                        {trip.tripNumber ||
                                                            `TR-${trip.id.slice(0, 6)}`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div>
                                                    <div
                                                        className="text-sm font-medium text-[#111827] flex items-center gap-2"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {trip.driver?.name ||
                                                            "Unknown"}
                                                    </div>
                                                    <div
                                                        className="text-xs text-[#8E98A8] mt-1"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {trip.vehicle
                                                            ?.registrationNumber ||
                                                            "-"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <MapPin
                                                        size={14}
                                                        className="text-[#8E98A8] flex-shrink-0"
                                                    />
                                                    <span
                                                        className="text-sm text-[#8E98A8]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {trip.loginLocation
                                                            ?.split(",")
                                                            .slice(0, 2)
                                                            .join(",") || "-"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <MapPin
                                                        size={14}
                                                        className="text-[#2E7D32] flex-shrink-0"
                                                    />
                                                    <span
                                                        className="text-sm font-medium text-[#1F083B]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {trip.logoutLocation
                                                            ?.split(",")
                                                            .slice(0, 2)
                                                            .join(",") ||
                                                            "In Progress"}
                                                    </span>
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
                                                        {trip.stats
                                                            ?.totalDistance ||
                                                            "0"}{" "}
                                                        km
                                                    </div>
                                                    <div
                                                        className="text-xs text-[#8E98A8]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {formatDuration(
                                                            trip.stats
                                                                ?.totalDuration ||
                                                                0,
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className="text-sm text-[#111827]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {formatDateTime(
                                                        trip.loginTime,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(
                                                        trip.tripStatus,
                                                    )}`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {getStatusDisplay(
                                                        trip.tripStatus,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTrip(trip);
                                                        setShowViewModal(true);
                                                    }}
                                                    className="p-1.5 text-[#6E43A3] hover:bg-[#F8F8F8] rounded-lg transition"
                                                >
                                                    <Eye size={18} />
                                                </button>
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
                                <span className="ml-4">
                                    Showing {startIndex + 1} to{" "}
                                    {Math.min(endIndex, totalItems)} of{" "}
                                    {totalItems} results
                                </span>
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
                                    <ChevronRight
                                        size={18}
                                        className="rotate-180 text-[#8E98A8]"
                                    />
                                </button>
                                <span className="text-sm text-[#8E98A8]">
                                    Page {currentPage} of {totalPages}
                                </span>
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
                                    <ChevronRight
                                        size={18}
                                        className="text-[#8E98A8]"
                                    />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Trip Modal */}
            {showViewModal && selectedTrip && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Trip Details
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Trip information and performance metrics
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedTrip(null);
                                }}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        {/* Driver & Trip Info */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#EDE8F4] flex items-center justify-center text-[#6E43A3] font-semibold text-lg">
                                    {getInitials(selectedTrip.driver?.name)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-lg font-bold text-[#1F083B]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {selectedTrip.tripNumber ||
                                                `TR-${selectedTrip.id.slice(0, 6)}`}
                                        </span>
                                    </div>
                                    <div
                                        className="text-sm text-[#5B646F]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {selectedTrip.driver?.name ||
                                            "Unknown Driver"}
                                        <span className="mx-2">·</span>
                                        {selectedTrip.vehicle
                                            ?.registrationNumber || "-"}
                                    </div>
                                </div>
                            </div>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(
                                    selectedTrip.tripStatus,
                                )}`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {getStatusDisplay(selectedTrip.tripStatus)}
                            </span>
                        </div>

                        {/* Route Container */}
                        <div
                            className="bg-[#7A84921A] rounded-2xl p-6 mb-6"
                            style={{
                                borderRadius: "16px",
                                paddingTop: "14px",
                                paddingRight: "24px",
                                paddingBottom: "14px",
                                paddingLeft: "24px",
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-start gap-3">
                                        {/* Vertical line with dots */}
                                        <div className="flex flex-col items-center flex-shrink-0">
                                            <div className="w-3 h-3 rounded-full bg-[#8E98A8]"></div>
                                            <div className="w-0.5 flex-1 bg-[#D1D5DB] min-h-[30px]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#2E7D32]"></div>
                                        </div>

                                        {/* Labels beside the dots */}
                                        <div className="flex flex-col flex-1">
                                            <div className="flex flex-col pt-0">
                                                <span
                                                    className="text-sm text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    FROM
                                                </span>
                                                <span
                                                    className="text-sm font-medium text-[#1F083B]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {selectedTrip.loginLocation ||
                                                        "-"}
                                                </span>
                                            </div>
                                            <div className="flex-1"></div>
                                            <div className="flex flex-col pb-0">
                                                <span
                                                    className="text-sm text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    TO
                                                </span>
                                                <span
                                                    className="text-sm font-medium text-[#1F083B]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {selectedTrip.logoutLocation ||
                                                        "In Progress"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div>
                                        <span
                                            className="text-lg font-bold text-[#0F1729]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {selectedTrip.stats
                                                ?.totalDistance || "0"}{" "}
                                            km
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <Clock
                                            size={14}
                                            className="text-[#6E43A3]"
                                        />
                                        <span
                                            className="text-sm text-[#6E43A3] font-medium"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {formatDuration(
                                                selectedTrip.stats
                                                    ?.totalDuration || 0,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid - 3 per row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Hazards Reported
                                </div>
                                <div
                                    className="text-lg font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedTrip.stats?.hazardsReported || 0}
                                </div>
                            </div>
                            <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Hazards Confirmed
                                </div>
                                <div
                                    className="text-lg font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedTrip.stats?.hazardsConfirmed || 0}
                                </div>
                            </div>
                            <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    SOS Alerts
                                </div>
                                <div
                                    className="text-lg font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedTrip.stats?.sosAlerts || 0}
                                </div>
                            </div>
                            <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Hard Brakes
                                </div>
                                <div
                                    className="text-lg font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedTrip.stats?.hardBrakes || 0}
                                </div>
                            </div>
                            <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Rapid Accelerations
                                </div>
                                <div
                                    className="text-lg font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedTrip.stats?.rapidAccelerations ||
                                        0}
                                </div>
                            </div>
                            <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Routes Planned
                                </div>
                                <div
                                    className="text-lg font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedTrip.stats?.routesPlanned || 0}
                                </div>
                            </div>
                        </div>

                        {/* Started / Ended Info */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-[#F8F8F8] rounded-xl p-3">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Started
                                </div>
                                <div
                                    className="text-sm font-medium text-[#1A2A3F] mt-0.5"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {formatDateTime(selectedTrip.loginTime)}
                                </div>
                            </div>
                            <div className="bg-[#F8F8F8] rounded-xl p-3">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Ended
                                </div>
                                <div
                                    className="text-sm font-medium text-[#1A2A3F] mt-0.5"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {formatDateTime(selectedTrip.logoutTime) ||
                                        "In Progress"}
                                </div>
                            </div>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] my-6" />
                    </div>
                </div>
            )}
        </DashSidebar>
    );
};

export default FleetTrips;
