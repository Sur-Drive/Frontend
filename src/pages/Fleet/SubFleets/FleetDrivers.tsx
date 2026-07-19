import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    UserPlus,
    Eye,
    Trash2,
    Users,
    UserCheck,
    UserX,
    Navigation,
    X,
    ArrowRight,
    Ban,
    AlertTriangle,
    CheckCircle,
    MoreVertical,
    Phone,
    Car,
    Calendar,
    Clock,
} from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface Driver {
    id: string;
    fullName: string;
    phoneNumber: string;
    licenseNumber: string;
    email: string | null;
    isActive: boolean;
    isPhoneVerified: boolean;
    isAssigned: boolean;
    status: "active" | "suspended" | "invited" | "pending";
    vehicle: any | null;
    subFleet: {
        id: string;
        name: string;
    } | null;
    invitedAt: string;
    acceptedAt: string | null;
}

interface DriverStats {
    totalDrivers: number;
    assignedDrivers: number;
    unassignedDrivers: number;
    tripsThisWeek: number;
    totalDistance: string;
}

interface SubFleet {
    id: string;
    name: string;
    status: string;
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

const FleetDrivers: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [stats, setStats] = useState<DriverStats>({
        totalDrivers: 0,
        assignedDrivers: 0,
        unassignedDrivers: 0,
        tripsThisWeek: 0,
        totalDistance: "0km",
    });
    const [subFleets, setSubFleets] = useState<SubFleet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [successTitle, setSuccessTitle] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccessAction, setShowSuccessAction] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    // Invite form state
    const [inviteForm, setInviteForm] = useState({
        fullName: "",
        mobileNumber: "",
        licenseNumber: "",
        subFleetId: "",
    });

    // Fetch drivers
    const fetchDrivers = async () => {
        try {
            setLoading(true);
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

            // Update stats
            const total = driversData.length;
            const assigned = driversData.filter(
                (d: Driver) => d.isAssigned,
            ).length;
            const unassigned = driversData.filter(
                (d: Driver) => !d.isAssigned,
            ).length;

            setStats((prev) => ({
                ...prev,
                totalDrivers: total,
                assignedDrivers: assigned,
                unassignedDrivers: unassigned,
            }));
        } catch (error) {
            console.error("Error fetching drivers:", error);
            setDrivers([]);
        } finally {
            setLoading(false);
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
        fetchDrivers();
        fetchSubFleets();
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

    // Invite driver
    const handleInvite = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/fleet/drivers/invite`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(inviteForm),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to send invitation");
            }

            setShowInviteModal(false);
            setSuccessTitle("Driver Invitation Sent Successfully");
            setSuccessMessage(
                "An invitation has been sent to the driver's email address. They can use the invitation link to create their account and join your fleet.",
            );
            setShowSuccessModal(true);
            setShowSuccessAction(true);
            setInviteForm({
                fullName: "",
                mobileNumber: "",
                licenseNumber: "",
                subFleetId: subFleets[0]?.id || "",
            });
            fetchDrivers();
        } catch (error: any) {
            console.error("Error inviting driver:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Remove driver
    const handleRemoveDriver = async (driverId: string) => {
        try {
            setIsRemoving(true);
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE}/fleet/drivers/${driverId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to remove driver");
            }

            setShowRemoveModal(false);
            setSelectedDriver(null);
            setSuccessTitle("Driver Removed Successfully");
            setSuccessMessage(
                "The driver has been removed from your fleet and no longer has access to the Driver App.\n\nYou can invite the driver again at any time if needed.",
            );
            setShowSuccessModal(true);
            setShowSuccessAction(false);
            fetchDrivers();
        } catch (error) {
            console.error("Error removing driver:", error);
        } finally {
            setIsRemoving(false);
        }
    };

    // Get initials
    const getInitials = (name: string) => {
        if (!name) return "??";
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
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

    // Filter drivers
    const filteredDrivers = drivers.filter((driver) => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch =
            driver.fullName?.toLowerCase().includes(searchLower) || false;
        const phoneMatch =
            driver.phoneNumber?.toLowerCase().includes(searchLower) || false;
        const matchesSearch = nameMatch || phoneMatch;
        const matchesStatus =
            selectedStatus === "all" || driver.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalItems = filteredDrivers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDrivers = filteredDrivers.slice(startIndex, endIndex);

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
                            Drivers
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className="text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {stats.totalDrivers} drivers active across your
                                fleets
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-[#6E43A3] text-white px-6 py-2.5 rounded-xl hover:opacity-90 transition flex items-center gap-2"
                        style={{ fontFamily: "Outfit" }}
                    >
                        <UserPlus size={20} />
                        Invite Driver
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4 flex-wrap">
                    <StatCard
                        icon={Users}
                        label="Total Drivers"
                        value={stats.totalDrivers}
                        subtext="Across all fleets"
                        valueColor="text-[#6E43A3]"
                    />

                    <StatCard
                        icon={UserCheck}
                        label="Assigned Drivers"
                        value={stats.assignedDrivers}
                        subtext="Drivers assigned to vehicles"
                        valueColor="text-[#2E7D32]"
                    />

                    <StatCard
                        icon={UserX}
                        label="Unassigned Drivers"
                        value={stats.unassignedDrivers}
                        subtext="Drivers unassigned to vehicle yet"
                        valueColor="text-[#0B0015]"
                    />

                    <StatCard
                        icon={Navigation}
                        label="Trips"
                        value={stats.tripsThisWeek}
                        subtext={`(${stats.totalDistance}) Trips This Week`}
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
                            Drivers ({totalItems})
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E98A8]"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Search drivers..."
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
                                        Driver
                                    </th>
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
                                        Trips
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
                                        Join Date
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Last Active
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
                                            Loading drivers...
                                        </td>
                                    </tr>
                                ) : currentDrivers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            No drivers found
                                        </td>
                                    </tr>
                                ) : (
                                    currentDrivers.map((driver) => (
                                        <tr
                                            key={driver.id}
                                            className="border-b border-[#E0E5EB] hover:bg-[#F7F7F7] transition"
                                        >
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#EDE8F4] flex items-center justify-center text-[#6E43A3] font-semibold">
                                                        {getInitials(
                                                            driver.fullName,
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div
                                                            className="text-sm font-medium text-[#111827]"
                                                            style={{
                                                                fontFamily:
                                                                    "Outfit",
                                                            }}
                                                        >
                                                            {driver.fullName ||
                                                                "Unknown"}
                                                        </div>
                                                        <div
                                                            className="text-xs text-[#8E98A8] flex items-center gap-1"
                                                            style={{
                                                                fontFamily:
                                                                    "Outfit",
                                                            }}
                                                        >
                                                            {driver.phoneNumber ||
                                                                ""}
                                                        </div>
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
                                                    {driver.vehicle?.name ||
                                                        "-"}
                                                </span>
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
                                                    {driver.subFleet?.name ||
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
                                                        driver.acceptedAt ||
                                                            driver.invitedAt,
                                                    )}
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
                                                        driver.acceptedAt,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(driver.status)}`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {driver.status
                                                        ? driver.status
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          driver.status.slice(1)
                                                        : "Unknown"}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDriver(
                                                                driver,
                                                            );
                                                            setActiveDropdown(
                                                                activeDropdown ===
                                                                    driver.id
                                                                    ? null
                                                                    : driver.id,
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
                                                        driver.id && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E0E5EB] min-w-[180px] z-10 py-1">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdown(
                                                                        null,
                                                                    );
                                                                    setSelectedDriver(
                                                                        driver,
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
                                                                    setSelectedDriver(
                                                                        driver,
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

                    {/* Pagination - Always show when there are items */}
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

                                {/* Page numbers - only show if more than 1 page */}
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

            {/* INVITE DRIVER MODAL */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Invite Driver
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Send an invitation for a new driver to join
                                    your fleet.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
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
                                        placeholder="Jumoke Adenike"
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
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
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        {subFleets.length === 0 ? (
                                            <option value="">
                                                No sub-fleets available
                                            </option>
                                        ) : (
                                            subFleets.map((fleet) => (
                                                <option
                                                    key={fleet.id}
                                                    value={fleet.id}
                                                >
                                                    {fleet.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        Mobile Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={inviteForm.mobileNumber}
                                        onChange={(e) =>
                                            setInviteForm((prev) => ({
                                                ...prev,
                                                mobileNumber: e.target.value,
                                            }))
                                        }
                                        placeholder="+2347068683026"
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
                                        License Number
                                    </label>
                                    <input
                                        type="text"
                                        value={inviteForm.licenseNumber}
                                        onChange={(e) =>
                                            setInviteForm((prev) => ({
                                                ...prev,
                                                licenseNumber: e.target.value,
                                            }))
                                        }
                                        placeholder="DL12345678"
                                        className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                        style={{ fontFamily: "Outfit" }}
                                    />
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
                                        !inviteForm.mobileNumber ||
                                        !inviteForm.licenseNumber ||
                                        !inviteForm.subFleetId ||
                                        isSubmitting
                                    }
                                    className={`flex-1 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:cursor-not-allowed ${
                                        !inviteForm.fullName ||
                                        !inviteForm.mobileNumber ||
                                        !inviteForm.licenseNumber ||
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
                </div>
            )}

            {/* VIEW DRIVER DETAILS MODAL */}
            {showViewModal && selectedDriver && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Driver Details
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Driver profile, scope, and assignments.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedDriver(null);
                                }}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#EDE8F4] flex items-center justify-center text-[#6E43A3] font-semibold text-lg">
                                    {getInitials(selectedDriver.fullName)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="text-base font-bold text-[#1A2A3F]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {selectedDriver.fullName}
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(selectedDriver.status)}`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                            {selectedDriver.status
                                                ? selectedDriver.status
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  selectedDriver.status.slice(1)
                                                : "Unknown"}
                                        </span>
                                    </div>
                                    <div
                                        className="text-sm text-[#5B646F] flex items-center gap-2"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        <Phone size={14} />
                                        {selectedDriver.phoneNumber || ""}
                                    </div>
                                </div>
                            </div>
                        </div>

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
                                    {selectedDriver.subFleet?.name || "-"}
                                </div>
                            </div>
                            <div className="bg-[#7A84921A] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    License Number
                                </div>
                                <div
                                    className="text-base font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedDriver.licenseNumber || "-"}
                                </div>
                            </div>
                            <div className="bg-[#7A84921A] rounded-xl p-4 text-center">
                                <div
                                    className="text-xs text-[#7A8492] font-medium"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Vehicle
                                </div>
                                <div
                                    className="text-base font-bold text-[#1A2A3F] mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {selectedDriver.vehicle?.name ||
                                        "Unassigned"}
                                </div>
                            </div>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] my-6" />

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedDriver(null);
                                    setShowRemoveModal(true);
                                }}
                                className="flex-1 px-6 py-3 rounded-xl text-[#B71C1C] border border-[#B71C1C] hover:bg-[#B71C1C] hover:text-white transition flex items-center justify-center gap-2"
                                style={{ fontFamily: "Outfit" }}
                            >
                                <Trash2 size={18} />
                                Remove Driver
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REMOVE DRIVER MODAL */}
            {showRemoveModal && selectedDriver && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="w-16 h-16 rounded-full bg-[#B71C1C20] flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} style={{ color: "#B71C1C" }} />
                        </div>
                        <h3
                            className="text-xl font-bold text-center"
                            style={{ fontFamily: "Outfit", color: "#1F083B" }}
                        >
                            Remove This Driver?
                        </h3>
                        <p
                            className="mt-4 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#5B646F" }}
                        >
                            Are you sure you want to remove{" "}
                            <strong>{selectedDriver.fullName}</strong> from your
                            fleet?
                        </p>
                        <div
                            className="mt-6 h-px w-full"
                            style={{ backgroundColor: "#E5E7EB" }}
                        />
                        <p
                            className="mt-6 text-sm text-center"
                            style={{ fontFamily: "Outfit", color: "#8E98A8" }}
                        >
                            The driver will immediately lose access to the
                            Driver App and will no longer be assigned to this
                            fleet. You can invite them again at any time.
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3">
                            <button
                                onClick={() => {
                                    setShowRemoveModal(false);
                                    setSelectedDriver(null);
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
                                    handleRemoveDriver(selectedDriver.id)
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
                                    "Remove Driver"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                Invite Another Driver
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FleetDrivers;
