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
    CheckCircle,
    MoreVertical,
    Phone,
} from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface Driver {
    id: string;
    name: string;
    phoneNumber: string;
    licenseNumber: string;
    email: string | null;
    isActive: boolean;
    isPhoneVerified: boolean;
    isAssigned: boolean;
    status: "active" | "suspended" | "invited" | "pending";
    vehicle: {
        id: string;
        registrationNumber: string;
        make: string;
        model: string;
    } | null;
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
    region: string;
    status: string;
    vehicleCount: number;
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

const ManagerDriver: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [stats, setStats] = useState<DriverStats>({
        totalDrivers: 0,
        assignedDrivers: 0,
        unassignedDrivers: 0,
        tripsThisWeek: 0,
        totalDistance: "0km",
    });

    const [subFleet, setSubFleet] = useState<SubFleet | null>(null);
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

            const response = await fetch(`${API_BASE}/manager/drivers`, {
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

    // Fetch manager profile to get managerId
    const fetchManagerProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE}/manager/profile`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();

                localStorage.setItem("managerId", data.id);
            }
        } catch (error) {
            console.error("Error fetching manager profile:", error);
        }
    };

    const fetchSubFleets = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/manager/sub-fleet`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch sub-fleet");
            }

            const data = await response.json();

            setSubFleet(data.subFleet);

            if (data.subFleet?.id && !inviteForm.subFleetId) {
                setInviteForm((prev) => ({
                    ...prev,
                    subFleetId: data.subFleet.id,
                }));
            }
        } catch (error) {
            console.error("Error fetching sub-fleet:", error);
            setSubFleet(null);
        }
    };

    useEffect(() => {
        fetchManagerProfile();
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

    const handleInvite = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");

            // Get the manager ID from token or state

            const managerId = localStorage.getItem("managerId");

            const response = await fetch(
                `${API_BASE}/fleet/drivers/invite-by-manager`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fullName: inviteForm.fullName,
                        mobileNumber: inviteForm.mobileNumber,
                        licenseNumber: inviteForm.licenseNumber,
                        subFleetId: inviteForm.subFleetId,
                        managerId: managerId,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to send invitation");
            }

            setShowInviteModal(false);
            setSuccessTitle("Driver Invitation Sent Successfully");
            setSuccessMessage(
                "An invitation has been sent to the driver's mobile number. They can use the link to create their account and join your sub-fleet.",
            );
            setShowSuccessModal(true);
            setShowSuccessAction(true);
            setInviteForm({
                fullName: "",
                mobileNumber: "",
                licenseNumber: "",
                subFleetId: subFleet?.id || "",
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
            driver.name?.toLowerCase().includes(searchLower) || false;
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
        <div className="min-h-screen bg-[#F7F7F7] p-3 sm:p-4 md:p-6">
            <div className="mx-auto max-w-[1190px] space-y-3 sm:space-y-4 md:space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                            Drivers
                        </h1>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-[#8E98A8] sm:gap-2">
                            <span>
                                {stats.totalDrivers} drivers active in your
                                subfleet
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6E43A3] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95 sm:w-auto sm:px-6"
                    >
                        <UserPlus size={18} className="sm:size-[20px]" />
                        <span>Invite Driver</span>
                    </button>
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                    <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2">
                            <Users
                                size={16}
                                className="text-[#6E43A3] sm:size-[18px]"
                            />
                            <p className="text-xs text-[#8E98A8] sm:text-sm">
                                Total Drivers
                            </p>
                        </div>
                        <p className="mt-1 text-xl font-bold text-[#6E43A3] sm:text-2xl">
                            {stats.totalDrivers}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Across all fleets
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2">
                            <UserCheck
                                size={16}
                                className="text-[#2E7D32] sm:size-[18px]"
                            />
                            <p className="text-xs text-[#8E98A8] sm:text-sm">
                                Assigned Drivers
                            </p>
                        </div>
                        <p className="mt-1 text-xl font-bold text-[#2E7D32] sm:text-2xl">
                            {stats.assignedDrivers}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Drivers assigned to vehicles
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2">
                            <UserX
                                size={16}
                                className="text-[#0B0015] sm:size-[18px]"
                            />
                            <p className="text-xs text-[#8E98A8] sm:text-sm">
                                Unassigned Drivers
                            </p>
                        </div>
                        <p className="mt-1 text-xl font-bold text-[#0B0015] sm:text-2xl">
                            {stats.unassignedDrivers}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            No vehicle yet
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2">
                            <Navigation
                                size={16}
                                className="text-[#F2A618] sm:size-[18px]"
                            />
                            <p className="text-xs text-[#8E98A8] sm:text-sm">
                                Trips
                            </p>
                        </div>
                        <p className="mt-1 text-xl font-bold text-[#F2A618] sm:text-2xl">
                            {stats.tripsThisWeek}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            ({stats.totalDistance}) This Week
                        </p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4 md:p-6">
                    {/* Table Header */}
                    <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-base font-semibold text-[#1F083B] sm:text-lg">
                            Drivers ({totalItems})
                        </h2>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <div className="relative w-full sm:w-48 md:w-64">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    placeholder="Search drivers..."
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

                    {/* Mobile Cards */}
                    <div className="space-y-3 sm:hidden">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                Loading drivers...
                            </div>
                        ) : currentDrivers.length === 0 ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                No drivers found
                            </div>
                        ) : (
                            currentDrivers.map((driver) => {
                                const isDropdownOpen =
                                    activeDropdown === driver.id;
                                return (
                                    <div
                                        key={driver.id}
                                        className="rounded-lg border border-[#E0E5EB] bg-white p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE8F4] text-sm font-semibold text-[#6E43A3]">
                                                    {getInitials(driver.name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium text-[#111827]">
                                                        {driver.name ||
                                                            "Unknown"}
                                                    </div>
                                                    <div className="truncate text-xs text-[#8E98A8]">
                                                        {driver.phoneNumber ||
                                                            ""}
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${getStatusColor(driver.status)}`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                                {driver.status
                                                    ? driver.status
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                      driver.status.slice(1)
                                                    : "Unknown"}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#E0E5EB] pt-3">
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Vehicle
                                                </p>
                                                <p className="truncate text-sm font-medium text-[#111827]">
                                                    {driver.vehicle
                                                        ?.registrationNumber ||
                                                        "—"}
                                                </p>
                                                {(driver.vehicle?.make ||
                                                    driver.vehicle?.model) && (
                                                    <p className="truncate text-[10px] text-[#8E98A8] opacity-70">
                                                        {[
                                                            driver.vehicle
                                                                ?.make,
                                                            driver.vehicle
                                                                ?.model,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" ")}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Sub-fleet
                                                </p>
                                                <p className="truncate text-sm font-medium text-[#111827]">
                                                    {driver.subFleet?.name ||
                                                        "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Joined
                                                </p>
                                                <p className="truncate text-sm font-medium text-[#111827]">
                                                    {formatDate(
                                                        driver.acceptedAt ||
                                                            driver.invitedAt,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[#8E98A8]">
                                                    Last Active
                                                </p>
                                                <p className="truncate text-sm font-medium text-[#111827]">
                                                    {formatDate(
                                                        driver.acceptedAt,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="col-span-2 flex items-center justify-end border-t border-[#E0E5EB] pt-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDriver(
                                                            driver,
                                                        );
                                                        setActiveDropdown(
                                                            isDropdownOpen
                                                                ? null
                                                                : driver.id,
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
                                                        setSelectedDriver(
                                                            driver,
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
                                                        setSelectedDriver(
                                                            driver,
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
                                        Driver
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] md:table-cell sm:py-3 sm:text-sm">
                                        Vehicle
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] lg:table-cell sm:py-3 sm:text-sm">
                                        Sub-fleet
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] xl:table-cell sm:py-3 sm:text-sm">
                                        Join Date
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] xl:table-cell sm:py-3 sm:text-sm">
                                        Last Active
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
                                            Loading drivers...
                                        </td>
                                    </tr>
                                ) : currentDrivers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-sm text-[#8E98A8]"
                                        >
                                            No drivers found
                                        </td>
                                    </tr>
                                ) : (
                                    currentDrivers.map((driver) => {
                                        const isDropdownOpen =
                                            activeDropdown === driver.id;
                                        return (
                                            <tr
                                                key={driver.id}
                                                className="border-b border-[#E0E5EB] transition hover:bg-[#F7F7F7]"
                                            >
                                                <td className="py-2 sm:py-3">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE8F4] text-xs font-semibold text-[#6E43A3] sm:h-10 sm:w-10 sm:text-sm">
                                                            {getInitials(
                                                                driver.name,
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium text-[#111827]">
                                                                {driver.name ||
                                                                    "Unknown"}
                                                            </div>
                                                            <div className="truncate text-xs text-[#8E98A8]">
                                                                {driver.phoneNumber ||
                                                                    ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden py-2 md:table-cell sm:py-3">
                                                    <div>
                                                        <span className="text-sm text-[#8E98A8]">
                                                            {driver.vehicle
                                                                ?.registrationNumber ||
                                                                "—"}
                                                        </span>
                                                        {(driver.vehicle
                                                            ?.make ||
                                                            driver.vehicle
                                                                ?.model) && (
                                                            <div className="text-xs text-[#8E98A8] opacity-70">
                                                                {[
                                                                    driver
                                                                        .vehicle
                                                                        ?.make,
                                                                    driver
                                                                        .vehicle
                                                                        ?.model,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(" ")}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="hidden py-2 lg:table-cell sm:py-3">
                                                    <span className="text-sm text-[#111827]">
                                                        {driver.subFleet
                                                            ?.name || "—"}
                                                    </span>
                                                </td>
                                                <td className="hidden py-2 xl:table-cell sm:py-3">
                                                    <span className="text-sm text-[#111827]">
                                                        {formatDate(
                                                            driver.acceptedAt ||
                                                                driver.invitedAt,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="hidden py-2 xl:table-cell sm:py-3">
                                                    <span className="text-sm text-[#111827]">
                                                        {formatDate(
                                                            driver.acceptedAt,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-2 sm:py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium sm:px-3 ${getStatusColor(driver.status)}`}
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                                        {driver.status
                                                            ? driver.status
                                                                  .charAt(0)
                                                                  .toUpperCase() +
                                                              driver.status.slice(
                                                                  1,
                                                              )
                                                            : "Unknown"}
                                                    </span>
                                                </td>
                                                <td className="py-2 text-right sm:py-3">
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDriver(
                                                                    driver,
                                                                );
                                                                setActiveDropdown(
                                                                    isDropdownOpen
                                                                        ? null
                                                                        : driver.id,
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
                                                                        setSelectedDriver(
                                                                            driver,
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
                                                                        setSelectedDriver(
                                                                            driver,
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

            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:p-8">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Invite Driver
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Send an invitation for a new driver to join
                                    your sub-fleet.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="flex-shrink-0 rounded-lg p-1 text-[#5B646F] transition hover:bg-gray-100 hover:text-[#1F083B]"
                            >
                                <X size={20} className="sm:size-[24px]" />
                            </button>
                        </div>

                        <div className="mb-4 h-px w-full bg-[#E5E7EB] sm:mb-6" />

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                    placeholder="Jane Doe"
                                    className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
                                />
                            </div>

                            {/* Sub-fleet - Read-only display */}
                            {subFleet && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
                                        Sub-fleet
                                    </label>
                                    <div className="h-12 w-full rounded-xl border border-[#E0E5EB] bg-[#F8F8F8] px-4 py-3 text-sm text-[#1F083B] sm:h-14 sm:text-base">
                                        {subFleet.name}
                                    </div>
                                    <p className="mt-1 text-xs text-[#8E98A8]">
                                        Drivers will be assigned to this
                                        sub-fleet automatically
                                    </p>
                                </div>
                            )}

                            <input
                                type="hidden"
                                value={inviteForm.subFleetId}
                            />

                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
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
                                        className="h-12 w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm focus:border-[#6E43A3] focus:outline-none sm:h-14 sm:text-base"
                                    />
                                </div>
                            </div>

                            {/* Hidden field for subFleetId */}
                            <input
                                type="hidden"
                                value={inviteForm.subFleetId}
                            />

                            {/* Buttons */}
                            <div className="mt-4 flex flex-col-reverse gap-3 sm:mt-6 sm:flex-row sm:gap-3">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm text-[#8E98A8] transition hover:bg-gray-50 sm:flex-1 sm:px-6"
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
                                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed sm:flex-1 sm:px-6 ${
                                        !inviteForm.fullName ||
                                        !inviteForm.mobileNumber ||
                                        !inviteForm.licenseNumber ||
                                        !inviteForm.subFleetId
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
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Invite
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
            {/* VIEW DRIVER DETAILS MODAL */}
            {showViewModal && selectedDriver && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:p-8">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Driver Details
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Driver profile, scope, and assignments.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedDriver(null);
                                }}
                                className="flex-shrink-0 rounded-lg p-1 text-[#5B646F] transition hover:bg-gray-100 hover:text-[#1F083B]"
                            >
                                <X size={20} className="sm:size-[24px]" />
                            </button>
                        </div>

                        <div className="mb-4 h-px w-full bg-[#E5E7EB] sm:mb-6" />

                        {/* Driver Profile */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE8F4] text-lg font-semibold text-[#6E43A3]">
                                    {getInitials(selectedDriver.name)}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-base font-bold text-[#1A2A3F]">
                                            {selectedDriver.name}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(selectedDriver.status)}`}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                            {selectedDriver.status
                                                ? selectedDriver.status
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  selectedDriver.status.slice(1)
                                                : "Unknown"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[#5B646F]">
                                        <Phone size={14} />
                                        {selectedDriver.phoneNumber || ""}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-3">
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Sub-fleet
                                </div>
                                <div className="mt-1 text-sm font-bold text-[#1A2A3F] sm:text-base">
                                    {subFleet?.name || "-"}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    License Number
                                </div>
                                <div className="mt-1 text-sm font-bold text-[#1A2A3F] sm:text-base">
                                    {selectedDriver.licenseNumber || "-"}
                                </div>
                            </div>
                            <div className="rounded-xl bg-[#7A84921A] p-3 text-center sm:p-4">
                                <div className="text-xs font-medium text-[#7A8492]">
                                    Vehicle
                                </div>
                                <div className="mt-1 text-sm font-bold text-[#1A2A3F] sm:text-base">
                                    {selectedDriver.vehicle
                                        ?.registrationNumber || "Unassigned"}
                                </div>
                            </div>
                        </div>

                        <div className="my-4 h-px w-full bg-[#E5E7EB] sm:my-6" />

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedDriver(null);
                                    setShowRemoveModal(true);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#B71C1C] px-4 py-3 text-sm text-[#B71C1C] transition hover:bg-[#B71C1C] hover:text-white sm:flex-1 sm:px-6"
                            >
                                <Trash2 size={16} className="sm:size-[18px]" />
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
                            <strong>{selectedDriver.name}</strong> from your
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

export default ManagerDriver;
