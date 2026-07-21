import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface WaitlistEntry {
    id: string;
    userType: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    country: string;
    state: string;
    city: string;
    agreeToUpdates: boolean;
    status: string;
    vehicleType: string | null;
    navigationApp: string | null;
    driverFeatures: string[] | null;
    companyName: string | null;
    contactPerson: string | null;
    businessEmail: string | null;
    businessType: string | null;
    fleetSize: number | null;
    vehicleTypes: string | null;
    fleetFeatures: string[] | null;
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    total: number;
    drivers: number;
    fleetOwners: number;
    new: number;
    contacted: number;
    invited: number;
    registered: number;
}

export const AdminDashboard: React.FC = () => {
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(
        null,
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Check if click is outside all dropdowns
            const isOutside = Object.values(dropdownRefs.current).every(
                (ref) => ref && !ref.contains(target),
            );
            if (isOutside) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Get token from localStorage
    const getToken = () => {
        const token = localStorage.getItem("admin_token");
        if (!token) {
            navigate("/admin/login");
            return null;
        }
        return token;
    };

    // Helper function for authenticated fetch
    const authenticatedFetch = async (
        url: string,
        options: RequestInit = {},
    ) => {
        const token = getToken();
        if (!token) {
            navigate("/admin/login");
            return null;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    ...options.headers,
                },
            });

            if (response.status === 401) {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
                navigate("/admin/login");
                return null;
            }

            return response;
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (!token) {
            navigate("/admin/login");
            return;
        }
        fetchData();
    }, [page, selectedStatus]);

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3001";
            const token = getToken();

            if (!token) {
                setLoading(false);
                return;
            }

            const entriesResponse = await authenticatedFetch(
                `${API_URL}/waitlist?page=${page}&limit=20${selectedStatus ? `&status=${selectedStatus}` : ""}`,
            );

            if (!entriesResponse) {
                setLoading(false);
                return;
            }

            if (!entriesResponse.ok) {
                const errorData = await entriesResponse
                    .json()
                    .catch(() => ({}));
                throw new Error(errorData.message || "Failed to fetch entries");
            }

            const entriesData = await entriesResponse.json();
            setEntries(entriesData.items || []);
            setTotalPages(entriesData.totalPages || 1);

            const statsResponse = await authenticatedFetch(
                `${API_URL}/waitlist/stats`,
            );

            if (!statsResponse) {
                setLoading(false);
                return;
            }

            if (!statsResponse.ok) {
                const errorData = await statsResponse.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to fetch stats");
            }

            const statsData = await statsResponse.json();
            setStats(statsData);
        } catch (error: any) {
            console.error("Error fetching data:", error);
            setError(
                error.message || "Failed to fetch data. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchEntryById = async (id: string) => {
        try {
            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3001";
            const response = await authenticatedFetch(
                `${API_URL}/waitlist/${id}`,
            );

            if (!response) return;

            if (!response.ok) {
                throw new Error("Failed to fetch entry details");
            }

            const data = await response.json();
            setSelectedEntry(data);
            setIsModalOpen(true);
            setActiveDropdown(null);
        } catch (error) {
            console.error("Failed to fetch entry:", error);
            setError("Failed to load entry details");
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3001";
            const response = await authenticatedFetch(
                `${API_URL}/waitlist/${id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ status }),
                },
            );

            if (response && response.ok) {
                fetchData();
                setActiveDropdown(null);
            }
        } catch (error) {
            console.error("Failed to update status", error);
            setError("Failed to update status");
        }
    };

    const deleteEntry = async (id: string) => {
        if (
            !confirm(
                "Are you sure you want to delete this entry? This action cannot be undone.",
            )
        )
            return;

        try {
            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3001";
            const response = await authenticatedFetch(
                `${API_URL}/waitlist/${id}`,
                {
                    method: "DELETE",
                },
            );

            if (response && response.ok) {
                fetchData();
                setActiveDropdown(null);
            }
        } catch (error) {
            console.error("Failed to delete entry", error);
            setError("Failed to delete entry");
        }
    };

    const exportToExcel = async () => {
        try {
            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:3001";
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_URL}/waitlist/export`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
                navigate("/admin/login");
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to export");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `waitlist_export_${new Date().toISOString().split("T")[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export", error);
            setError("Failed to export data");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        navigate("/admin/login");
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            new: "bg-blue-100 text-blue-700",
            contacted: "bg-yellow-100 text-yellow-700",
            invited: "bg-purple-100 text-purple-700",
            registered: "bg-green-100 text-green-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Dropdown menu component - FIXED
    const ActionDropdown: React.FC<{ entry: WaitlistEntry }> = ({ entry }) => {
        const isOpen = activeDropdown === entry.id;

        const handleToggle = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveDropdown(isOpen ? null : entry.id);
        };

        const handleAction = (action: () => void) => {
            setActiveDropdown(null);
            setTimeout(() => {
                action();
            }, 100);
        };

        return (
            <div
                className="relative inline-block"
                ref={(el) => {
                    if (el) {
                        dropdownRefs.current[entry.id] = el;
                    }
                }}
            >
                <button
                    onClick={handleToggle}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Actions"
                >
                    <i className="fas fa-ellipsis-v text-gray-500"></i>
                </button>

                {isOpen && (
                    <div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() =>
                                handleAction(() => fetchEntryById(entry.id))
                            }
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center space-x-3"
                        >
                            <i className="fas fa-eye text-purple-500 w-4"></i>
                            <span>View Details</span>
                        </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        <div className="px-3 py-1.5">
                            <p className="text-xs text-gray-400 uppercase font-medium mb-1">
                                Update Status
                            </p>
                            <div className="space-y-1">
                                {[
                                    "new",
                                    "contacted",
                                    "invited",
                                    "registered",
                                ].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() =>
                                            handleAction(() =>
                                                updateStatus(entry.id, status),
                                            )
                                        }
                                        className={`w-full px-3 py-1.5 text-left text-xs rounded-lg transition-colors ${
                                            entry.status === status
                                                ? "bg-purple-100 text-purple-700 font-medium"
                                                : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                    >
                                        {status.charAt(0).toUpperCase() +
                                            status.slice(1)}
                                        {entry.status === status && " ✓"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 my-1"></div>

                        <button
                            onClick={() =>
                                handleAction(() => deleteEntry(entry.id))
                            }
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
                        >
                            <i className="fas fa-trash text-red-500 w-4"></i>
                            <span>Delete Entry</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <svg
                        className="animate-spin h-12 w-12 text-purple-700 mx-auto"
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
                    <p className="text-gray-600 mt-4">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-purple-900 text-white shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <span className="text-xl font-archivo">
                                SUR-DRIVE
                            </span>
                            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                                Admin
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                            >
                                <i className="fas fa-file-excel"></i>
                                <span>Export</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 hover:bg-red-400 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                            >
                                <i className="fas fa-sign-out-alt"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">
                                Total
                            </p>
                            <p className="text-2xl font-bold text-purple-900">
                                {stats.total}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">
                                Drivers
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {stats.drivers}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">
                                Fleet Owners
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                                {stats.fleetOwners}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">
                                New
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {stats.new}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">
                                Contacted
                            </p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {stats.contacted}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">
                                Registered
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.registered}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            />
                        </div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="invited">Invited</option>
                            <option value="registered">Registered</option>
                        </select>
                        <button
                            onClick={() => {
                                setSelectedStatus("");
                                setSearchTerm("");
                            }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Location
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {entries.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-gray-500"
                                        >
                                            No entries found
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((entry) => (
                                        <tr
                                            key={entry.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">
                                                    {entry.fullName || "N/A"}
                                                </div>
                                                {entry.companyName && (
                                                    <div className="text-xs text-gray-500">
                                                        {entry.companyName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {entry.email || "N/A"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        entry.userType ===
                                                        "driver"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-purple-100 text-purple-700"
                                                    }`}
                                                >
                                                    {entry.userType === "driver"
                                                        ? "Driver"
                                                        : "Fleet"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {entry.city && entry.state
                                                    ? `${entry.city}, ${entry.state}`
                                                    : "N/A"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}
                                                >
                                                    {entry.status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        entry.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <ActionDropdown entry={entry} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() =>
                                    setPage(Math.min(totalPages, page + 1))
                                }
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* View Details Modal */}
            <AnimatePresence>
                {isModalOpen && selectedEntry && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsModalOpen(false);
                            }
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-6 md:p-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-archivo text-purple-900">
                                    Entry Details
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">
                                            ID
                                        </p>
                                        <p className="text-sm font-mono text-gray-700 break-all">
                                            {selectedEntry.id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">
                                            Status
                                        </p>
                                        <span
                                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEntry.status)}`}
                                        >
                                            {selectedEntry.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">
                                            User Type
                                        </p>
                                        <p className="text-sm font-medium text-gray-700 capitalize">
                                            {selectedEntry.userType}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">
                                            Agree to Updates
                                        </p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {selectedEntry.agreeToUpdates
                                                ? "Yes"
                                                : "No"}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase">
                                        Full Name
                                    </p>
                                    <p className="text-sm font-medium text-gray-700">
                                        {selectedEntry.fullName || "N/A"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">
                                            Email
                                        </p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {selectedEntry.email || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">
                                            Phone Number
                                        </p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {selectedEntry.phoneNumber || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase">
                                        Location
                                    </p>
                                    <p className="text-sm font-medium text-gray-700">
                                        {selectedEntry.city &&
                                        selectedEntry.state &&
                                        selectedEntry.country
                                            ? `${selectedEntry.city}, ${selectedEntry.state}, ${selectedEntry.country}`
                                            : "N/A"}
                                    </p>
                                </div>

                                {selectedEntry.userType === "driver" && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">
                                                    Vehicle Type
                                                </p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {selectedEntry.vehicleType ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">
                                                    Navigation App
                                                </p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {selectedEntry.navigationApp ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">
                                                Driver Features
                                            </p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedEntry.driverFeatures &&
                                                selectedEntry.driverFeatures
                                                    .length > 0 ? (
                                                    selectedEntry.driverFeatures.map(
                                                        (feature) => (
                                                            <span
                                                                key={feature}
                                                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                                                            >
                                                                {feature.replace(
                                                                    "_",
                                                                    " ",
                                                                )}
                                                            </span>
                                                        ),
                                                    )
                                                ) : (
                                                    <span className="text-sm text-gray-500">
                                                        None selected
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedEntry.userType === "fleet_owner" && (
                                    <>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">
                                                Company Name
                                            </p>
                                            <p className="text-sm font-medium text-gray-700">
                                                {selectedEntry.companyName ||
                                                    "N/A"}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">
                                                    Contact Person
                                                </p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {selectedEntry.contactPerson ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">
                                                    Business Email
                                                </p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {selectedEntry.businessEmail ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">
                                                    Business Type
                                                </p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {selectedEntry.businessType ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">
                                                    Fleet Size
                                                </p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {selectedEntry.fleetSize ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">
                                                Vehicle Types
                                            </p>
                                            <p className="text-sm font-medium text-gray-700">
                                                {selectedEntry.vehicleTypes ||
                                                    "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">
                                                Fleet Features
                                            </p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedEntry.fleetFeatures &&
                                                selectedEntry.fleetFeatures
                                                    .length > 0 ? (
                                                    selectedEntry.fleetFeatures.map(
                                                        (feature) => (
                                                            <span
                                                                key={feature}
                                                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                                                            >
                                                                {feature.replace(
                                                                    "_",
                                                                    " ",
                                                                )}
                                                            </span>
                                                        ),
                                                    )
                                                ) : (
                                                    <span className="text-sm text-gray-500">
                                                        None selected
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">
                                            Created At
                                        </p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {formatDate(
                                                selectedEntry.createdAt,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">
                                            Updated At
                                        </p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {formatDate(
                                                selectedEntry.updatedAt,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
