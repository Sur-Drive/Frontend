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
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                            Trips
                        </h1>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-[#8E98A8] sm:gap-2">
                            <span>
                                Live and historical trip records across your
                                fleet
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 text-[#6F6C8F]">
                            <Navigation
                                size={16}
                                className="text-[#6E43A3] sm:size-[18px]"
                            />
                            <span className="text-xs font-medium sm:text-sm">
                                Total Trips
                            </span>
                        </div>
                        <div className="mt-1 text-2xl font-bold text-[#6E43A3] sm:text-3xl">
                            {stats.totalTrips}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            ({stats.totalDistance}) Across all fleets
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 text-[#6F6C8F]">
                            <Activity
                                size={16}
                                className="text-[#6E43A3] sm:size-[18px]"
                            />
                            <span className="text-xs font-medium sm:text-sm">
                                In Progress
                            </span>
                        </div>
                        <div className="mt-1 text-2xl font-bold text-[#6E43A3] sm:text-3xl">
                            {stats.inProgress}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Currently in transit
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 text-[#6F6C8F]">
                            <CheckCircle
                                size={16}
                                className="text-[#2E7D32] sm:size-[18px]"
                            />
                            <span className="text-xs font-medium sm:text-sm">
                                Completed
                            </span>
                        </div>
                        <div className="mt-1 text-2xl font-bold text-[#2E7D32] sm:text-3xl">
                            {stats.completed}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Completed trips
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 text-[#6F6C8F]">
                            <XCircle
                                size={16}
                                className="text-[#FE3F21] sm:size-[18px]"
                            />
                            <span className="text-xs font-medium sm:text-sm">
                                Cancelled
                            </span>
                        </div>
                        <div className="mt-1 text-2xl font-bold text-[#FE3F21] sm:text-3xl">
                            {stats.cancelled}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Trip cancelled
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="mt-4 rounded-xl bg-white p-3 shadow-sm sm:mt-6 sm:p-4 md:p-6">
                    {/* Table Header */}
                    <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-base font-semibold text-[#1F083B] sm:text-lg">
                            Trips ({totalItems})
                        </h2>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <div className="relative w-full sm:w-48 md:w-64">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    placeholder="Search by driver name..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full rounded-xl bg-[#F8F8F8] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) =>
                                        setSelectedStatus(e.target.value)
                                    }
                                    className="rounded-xl bg-[#F8F8F8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3] sm:px-4"
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

                    {/* Mobile Cards */}
                    <div className="space-y-3 sm:hidden">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                Loading trips...
                            </div>
                        ) : currentTrips.length === 0 ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                No trips found
                            </div>
                        ) : (
                            currentTrips.map((trip) => (
                                <div
                                    key={trip.id}
                                    className="rounded-lg border border-[#E0E5EB] bg-white p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium text-[#111827]">
                                                {trip.tripNumber ||
                                                    `TR-${trip.id.slice(0, 6)}`}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-xs text-[#111827]">
                                                    {trip.driver?.name ||
                                                        "Unknown"}
                                                </span>
                                                <span className="text-[10px] text-[#8E98A8]">
                                                    ·
                                                </span>
                                                <span className="text-xs text-[#8E98A8]">
                                                    {trip.vehicle
                                                        ?.registrationNumber ||
                                                        "-"}
                                                </span>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${getStatusColor(trip.tripStatus)}`}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                            {getStatusDisplay(trip.tripStatus)}
                                        </span>
                                    </div>

                                    <div className="mt-3 border-t border-[#E0E5EB] pt-3">
                                        <div className="flex items-start gap-2">
                                            <MapPin
                                                size={14}
                                                className="mt-0.5 text-[#8E98A8] flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    From
                                                </p>
                                                <p className="truncate text-xs font-medium text-[#111827]">
                                                    {trip.loginLocation
                                                        ?.split(",")
                                                        .slice(0, 2)
                                                        .join(",") || "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-1 flex items-start gap-2">
                                            <MapPin
                                                size={14}
                                                className="mt-0.5 text-[#2E7D32] flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    To
                                                </p>
                                                <p className="truncate text-xs font-medium text-[#1F083B]">
                                                    {trip.logoutLocation
                                                        ?.split(",")
                                                        .slice(0, 2)
                                                        .join(",") ||
                                                        "In Progress"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E0E5EB] pt-3">
                                        <div>
                                            <p className="text-[10px] text-[#8E98A8]">
                                                Distance
                                            </p>
                                            <p className="truncate text-sm font-medium text-[#111827]">
                                                {trip.stats?.totalDistance ||
                                                    "0"}{" "}
                                                km
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#8E98A8]">
                                                Duration
                                            </p>
                                            <p className="truncate text-sm font-medium text-[#111827]">
                                                {formatDuration(
                                                    trip.stats?.totalDuration ||
                                                        0,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#8E98A8]">
                                                Started
                                            </p>
                                            <p className="truncate text-xs font-medium text-[#111827]">
                                                {formatDateTime(trip.loginTime)}
                                            </p>
                                        </div>
                                        <div className="flex items-end justify-end">
                                            <button
                                                onClick={() => {
                                                    setSelectedTrip(trip);
                                                    setShowViewModal(true);
                                                }}
                                                className="rounded-lg p-2 transition hover:bg-gray-100 active:bg-gray-200"
                                            >
                                                <Eye
                                                    size={18}
                                                    className="text-[#6E43A3]"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-[#E0E5EB]">
                                    <th className="py-2 text-left text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm">
                                        Trip
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] md:table-cell sm:py-3 sm:text-sm">
                                        Driver / Vehicle
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] lg:table-cell sm:py-3 sm:text-sm">
                                        Route
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] xl:table-cell sm:py-3 sm:text-sm">
                                        Distance / Duration
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] xl:table-cell sm:py-3 sm:text-sm">
                                        Started
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
                                            colSpan={7}
                                            className="py-8 text-center text-sm text-[#8E98A8]"
                                        >
                                            Loading trips...
                                        </td>
                                    </tr>
                                ) : currentTrips.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-sm text-[#8E98A8]"
                                        >
                                            No trips found
                                        </td>
                                    </tr>
                                ) : (
                                    currentTrips.map((trip) => (
                                        <tr
                                            key={trip.id}
                                            className="border-b border-[#E0E5EB] transition hover:bg-[#F7F7F7]"
                                        >
                                            <td className="py-2 sm:py-3">
                                                <div className="truncate text-sm font-medium text-[#111827]">
                                                    {trip.tripNumber ||
                                                        `TR-${trip.id.slice(0, 6)}`}
                                                </div>
                                            </td>
                                            <td className="hidden py-2 md:table-cell sm:py-3">
                                                <div>
                                                    <div className="truncate text-sm font-medium text-[#111827]">
                                                        {trip.driver?.name ||
                                                            "Unknown"}
                                                    </div>
                                                    <div className="truncate text-xs text-[#8E98A8]">
                                                        {trip.vehicle
                                                            ?.registrationNumber ||
                                                            "-"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden py-2 lg:table-cell sm:py-3">
                                                <div className="max-w-[150px]">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin
                                                            size={12}
                                                            className="text-[#8E98A8] flex-shrink-0"
                                                        />
                                                        <span className="truncate text-xs text-[#8E98A8]">
                                                            {trip.loginLocation
                                                                ?.split(",")
                                                                .slice(0, 2)
                                                                .join(",") ||
                                                                "-"}
                                                        </span>
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1">
                                                        <MapPin
                                                            size={12}
                                                            className="text-[#2E7D32] flex-shrink-0"
                                                        />
                                                        <span className="truncate text-xs font-medium text-[#1F083B]">
                                                            {trip.logoutLocation
                                                                ?.split(",")
                                                                .slice(0, 2)
                                                                .join(",") ||
                                                                "In Progress"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden py-2 xl:table-cell sm:py-3">
                                                <div>
                                                    <div className="text-sm text-[#111827]">
                                                        {trip.stats
                                                            ?.totalDistance ||
                                                            "0"}{" "}
                                                        km
                                                    </div>
                                                    <div className="text-xs text-[#8E98A8]">
                                                        {formatDuration(
                                                            trip.stats
                                                                ?.totalDuration ||
                                                                0,
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden py-2 xl:table-cell sm:py-3">
                                                <span className="text-sm text-[#111827]">
                                                    {formatDateTime(
                                                        trip.loginTime,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-2 sm:py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium sm:px-3 ${getStatusColor(trip.tripStatus)}`}
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                                    {getStatusDisplay(
                                                        trip.tripStatus,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right sm:py-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTrip(trip);
                                                        setShowViewModal(true);
                                                    }}
                                                    className="rounded-lg p-1.5 text-[#6E43A3] transition hover:bg-[#F8F8F8] sm:p-2"
                                                >
                                                    <Eye
                                                        size={16}
                                                        className="sm:size-[18px]"
                                                    />
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
                        <div className="mt-4 flex flex-col gap-3 border-t border-[#E0E5EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-[#8E98A8]">
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
                                <span className="hidden text-xs sm:inline sm:text-sm">
                                    Showing {startIndex + 1} to{" "}
                                    {Math.min(endIndex, totalItems)} of{" "}
                                    {totalItems} results
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
                                    <ChevronRight
                                        size={16}
                                        className="rotate-180 text-[#8E98A8] sm:size-[18px]"
                                    />
                                </button>
                                <span className="text-xs text-[#8E98A8] sm:text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
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
                                    <ChevronRight
                                        size={16}
                                        className="text-[#8E98A8] sm:size-[18px]"
                                    />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Trip Modal */}
            {showViewModal && selectedTrip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 md:p-8">
                        {/* Header */}
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Trip Details
                                </h2>
                                <p className="mt-1 text-xs text-[#5B646F] sm:text-sm">
                                    Trip information and performance metrics
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedTrip(null);
                                }}
                                className="flex-shrink-0 text-[#5B646F] transition hover:text-[#1F083B]"
                            >
                                <X size={20} className="sm:size-[24px]" />
                            </button>
                        </div>

                        <div className="mb-4 h-px w-full bg-[#E5E7EB] sm:mb-6" />

                        {/* Driver & Trip Info */}
                        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE8F4] text-sm font-semibold text-[#6E43A3] sm:h-12 sm:w-12 sm:text-lg">
                                    {getInitials(selectedTrip.driver?.name)}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-base font-bold text-[#1F083B] sm:text-lg">
                                            {selectedTrip.tripNumber ||
                                                `TR-${selectedTrip.id.slice(0, 6)}`}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center text-xs text-[#5B646F] sm:text-sm">
                                        <span>
                                            {selectedTrip.driver?.name ||
                                                "Unknown Driver"}
                                        </span>
                                        <span className="mx-1 sm:mx-2">·</span>
                                        <span>
                                            {selectedTrip.vehicle
                                                ?.registrationNumber || "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span
                                className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium sm:px-3 sm:py-1 ${getStatusColor(selectedTrip.tripStatus)}`}
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                {getStatusDisplay(selectedTrip.tripStatus)}
                            </span>
                        </div>

                        {/* Route Container */}
                        <div className="mb-4 rounded-2xl bg-[#7A84921A] p-4 sm:mb-6 sm:p-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex-1">
                                    <div className="flex items-start gap-3">
                                        {/* Vertical line with dots */}
                                        <div className="flex flex-col items-center flex-shrink-0">
                                            <div className="h-2.5 w-2.5 rounded-full bg-[#8E98A8] sm:h-3 sm:w-3"></div>
                                            <div className="min-h-[20px] w-0.5 flex-1 bg-[#D1D5DB] sm:min-h-[30px]"></div>
                                            <div className="h-2.5 w-2.5 rounded-full bg-[#2E7D32] sm:h-3 sm:w-3"></div>
                                        </div>

                                        {/* Labels beside the dots */}
                                        <div className="flex flex-1 flex-col">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-[#8E98A8] sm:text-sm">
                                                    FROM
                                                </span>
                                                <span className="text-xs font-medium text-[#1F083B] sm:text-sm">
                                                    {selectedTrip.loginLocation ||
                                                        "-"}
                                                </span>
                                            </div>
                                            <div className="flex-1"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-[#8E98A8] sm:text-sm">
                                                    TO
                                                </span>
                                                <span className="text-xs font-medium text-[#1F083B] sm:text-sm">
                                                    {selectedTrip.logoutLocation ||
                                                        "In Progress"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
                                    <div>
                                        <span className="text-base font-bold text-[#0F1729] sm:text-lg">
                                            {selectedTrip.stats
                                                ?.totalDistance || "0"}{" "}
                                            km
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock
                                            size={12}
                                            className="text-[#6E43A3] sm:size-[14px]"
                                        />
                                        <span className="text-xs font-medium text-[#6E43A3] sm:text-sm">
                                            {formatDuration(
                                                selectedTrip.stats
                                                    ?.totalDuration || 0,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid - Responsive */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                            <div className="rounded-xl bg-[#F8F8F8] p-3 text-center sm:p-4">
                                <div className="text-[10px] font-medium text-[#7A8492] sm:text-xs">
                                    Hazards Reported
                                </div>
                                <div className="mt-1 text-base font-bold text-[#1A2A3F] sm:text-lg">
                                    {selectedTrip.stats?.hazardsReported || 0}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#F8F8F8] p-3 text-center sm:p-4">
                                <div className="text-[10px] font-medium text-[#7A8492] sm:text-xs">
                                    Hazards Confirmed
                                </div>
                                <div className="mt-1 text-base font-bold text-[#1A2A3F] sm:text-lg">
                                    {selectedTrip.stats?.hazardsConfirmed || 0}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#F8F8F8] p-3 text-center sm:p-4">
                                <div className="text-[10px] font-medium text-[#7A8492] sm:text-xs">
                                    SOS Alerts
                                </div>
                                <div className="mt-1 text-base font-bold text-[#1A2A3F] sm:text-lg">
                                    {selectedTrip.stats?.sosAlerts || 0}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#F8F8F8] p-3 text-center sm:p-4">
                                <div className="text-[10px] font-medium text-[#7A8492] sm:text-xs">
                                    Hard Brakes
                                </div>
                                <div className="mt-1 text-base font-bold text-[#1A2A3F] sm:text-lg">
                                    {selectedTrip.stats?.hardBrakes || 0}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#F8F8F8] p-3 text-center sm:p-4">
                                <div className="text-[10px] font-medium text-[#7A8492] sm:text-xs">
                                    Rapid Accel.
                                </div>
                                <div className="mt-1 text-base font-bold text-[#1A2A3F] sm:text-lg">
                                    {selectedTrip.stats?.rapidAccelerations ||
                                        0}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#F8F8F8] p-3 text-center sm:p-4">
                                <div className="text-[10px] font-medium text-[#7A8492] sm:text-xs">
                                    Routes Planned
                                </div>
                                <div className="mt-1 text-base font-bold text-[#1A2A3F] sm:text-lg">
                                    {selectedTrip.stats?.routesPlanned || 0}
                                </div>
                            </div>
                        </div>

                        {/* Started / Ended Info */}
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-4">
                            <div className="rounded-xl bg-[#F8F8F8] p-3 sm:p-4">
                                <div className="text-[10px] font-medium text-[#7A8492] sm:text-xs">
                                    Started
                                </div>
                                <div className="mt-0.5 text-xs font-medium text-[#1A2A3F] sm:text-sm">
                                    {formatDateTime(selectedTrip.loginTime)}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#F8F8F8] p-3 sm:p-4">
                                <div className="text-[10px] font-medium text-[#7A8492] sm:text-xs">
                                    Ended
                                </div>
                                <div className="mt-0.5 text-xs font-medium text-[#1A2A3F] sm:text-sm">
                                    {formatDateTime(selectedTrip.logoutTime) ||
                                        "In Progress"}
                                </div>
                            </div>
                        </div>

                        <div className="my-4 h-px w-full bg-[#E5E7EB] sm:my-6" />
                    </div>
                </div>
            )}
        </DashSidebar>
    );
};

export default FleetTrips;
