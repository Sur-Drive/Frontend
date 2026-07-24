import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Truck,
    User,
    MapPin,
    AlertTriangle,
    Users,
    Car,
    Activity,
    ChevronRight,
    Shield,
} from "lucide-react";
import ManagerSidebar from "./ManagerSidebar";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface ManagerStats {
    totalVehicles: number;
    activeVehicles: number;
    totalDrivers: number;
    activeDrivers: number;
    totalTrips: number;
    activeTrips: number;
    alerts: number;
    unreadNotifications: number;
}

interface SubFleetData {
    id: string;
    name: string;
    region: string;
    vehicleCount: number;
    driverCount: number;
}

interface ManagerProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    subFleetId: string;
}

interface RecentActivity {
    id: string;
    type: "vehicle" | "driver" | "trip" | "alert";
    message: string;
    timestamp: string;
}

const ManagerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ManagerStats>({
        totalVehicles: 0,
        activeVehicles: 0,
        totalDrivers: 0,
        activeDrivers: 0,
        totalTrips: 0,
        activeTrips: 0,
        alerts: 0,
        unreadNotifications: 0,
    });
    const [profile, setProfile] = useState<ManagerProfile | null>(null);
    const [subFleet, setSubFleet] = useState<SubFleetData | null>(null);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
        [],
    );
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/manager");
            return;
        }

        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // Fetch manager profile
            const profileRes = await fetch(`${API_BASE}/manager/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfile(profileData);
                if (profileData.user?.firstName && profileData.user?.lastName) {
                    setUserName(
                        `${profileData.user.firstName} ${profileData.user.lastName}`,
                    );
                }
            }

            // Fetch sub-fleet data
            const subFleetRes = await fetch(`${API_BASE}/manager/sub-fleet`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (subFleetRes.ok) {
                const subFleetData = await subFleetRes.json();
                setSubFleet(subFleetData);
            }

            // Fetch stats
            const statsRes = await fetch(`${API_BASE}/manager/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Fetch vehicles
            const vehiclesRes = await fetch(`${API_BASE}/manager/vehicles`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (vehiclesRes.ok) {
                const vehicles = await vehiclesRes.json();
                const total = vehicles.length || 0;
                const active =
                    vehicles.filter(
                        (v: any) =>
                            v.status === "AVAILABLE" || v.status === "IN_USE",
                    ).length || 0;

                setStats((prev) => ({
                    ...prev,
                    totalVehicles: total,
                    activeVehicles: active,
                }));
            }

            // Fetch drivers
            const driversRes = await fetch(`${API_BASE}/manager/drivers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (driversRes.ok) {
                const drivers = await driversRes.json();
                const total = drivers.length || 0;
                const active =
                    drivers.filter((d: any) => d.status === "active").length ||
                    0;

                setStats((prev) => ({
                    ...prev,
                    totalDrivers: total,
                    activeDrivers: active,
                }));
            }

            // Generate recent activities
            const activities: RecentActivity[] = [];
            if (vehiclesRes.ok) {
                const vehicles = await vehiclesRes.json();
                if (vehicles.length > 0) {
                    activities.push({
                        id: "1",
                        type: "vehicle",
                        message: `Vehicle ${vehicles[0]?.registrationNumber || "New"} added to sub-fleet`,
                        timestamp: new Date(Date.now() - 120000).toISOString(),
                    });
                }
            }
            if (driversRes.ok) {
                const drivers = await driversRes.json();
                if (drivers.length > 0) {
                    activities.push({
                        id: "2",
                        type: "driver",
                        message: `Driver ${drivers[0]?.fullName || "New"} joined the sub-fleet`,
                        timestamp: new Date(Date.now() - 300000).toISOString(),
                    });
                }
            }
            activities.push({
                id: "3",
                type: "trip",
                message: "Trip #TRP-001 completed successfully",
                timestamp: new Date(Date.now() - 600000).toISOString(),
            });
            activities.push({
                id: "4",
                type: "alert",
                message: "Vehicle maintenance due for XYZ-123",
                timestamp: new Date(Date.now() - 900000).toISOString(),
            });
            setRecentActivities(activities.slice(0, 4));

            // Set alerts and notifications
            setStats((prev) => ({
                ...prev,
                alerts: 2,
                unreadNotifications: 3,
            }));
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({
        title,
        value,
        icon: Icon,
        color,
        subtext,
    }: {
        title: string;
        value: number;
        icon: any;
        color: string;
        subtext?: string;
    }) => (
        <div className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition border border-[#F3F4F6]">
            <div className="flex items-center justify-between">
                <div>
                    <p
                        className="text-sm font-medium text-[#8E98A8]"
                        style={{ fontFamily: "Outfit" }}
                    >
                        {title}
                    </p>
                    <p
                        className="mt-2 text-3xl font-bold text-[#1F083B]"
                        style={{ fontFamily: "Outfit" }}
                    >
                        {value}
                    </p>
                    {subtext && (
                        <p
                            className="text-xs text-[#8E98A8] mt-1"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {subtext}
                        </p>
                    )}
                </div>
                <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon size={24} style={{ color }} />
                </div>
            </div>
        </div>
    );

    const getInitials = (name: string) => {
        if (!name) return "JD";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTimeAgo = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "vehicle":
                return <Car size={18} className="text-[#6E43A3]" />;
            case "driver":
                return <User size={18} className="text-[#1565C0]" />;
            case "trip":
                return <MapPin size={18} className="text-[#D4AF37]" />;
            case "alert":
                return <AlertTriangle size={18} className="text-[#C62828]" />;
            default:
                return <Activity size={18} className="text-[#8E98A8]" />;
        }
    };

    if (loading) {
        return (
            <ManagerSidebar>
                <div className="flex items-center justify-center min-h-[600px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E43A3] mx-auto" />
                        <p
                            className="mt-4 text-[#8E98A8]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Loading dashboard...
                        </p>
                    </div>
                </div>
            </ManagerSidebar>
        );
    }

    return (
        <ManagerSidebar>
            <div className="p-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <h1
                            className="text-3xl font-bold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Welcome back, {userName || "Manager"}!
                        </h1>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#6E43A324] text-[#6E43A3] flex items-center gap-1">
                            <Shield size={14} />
                            Manager
                        </span>
                    </div>
                    <p
                        className="mt-1 text-[#8E98A8]"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Here's what's happening with your sub-fleet today.
                    </p>
                    {subFleet && (
                        <div className="mt-2 flex items-center gap-4">
                            <span
                                className="text-sm text-[#6E43A3] font-medium"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {subFleet.name}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-[#6E43A310] text-[#6E43A3]">
                                {subFleet.region}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-[#2E7D3224] text-[#2E7D32]">
                                {subFleet.vehicleCount} Vehicles
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-[#1565C020] text-[#1565C0]">
                                {subFleet.driverCount} Drivers
                            </span>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard
                        title="Total Vehicles"
                        value={stats.totalVehicles}
                        icon={Truck}
                        color="#6E43A3"
                        subtext={`${stats.activeVehicles} active`}
                    />
                    <StatCard
                        title="Total Drivers"
                        value={stats.totalDrivers}
                        icon={Users}
                        color="#2E7D32"
                        subtext={`${stats.activeDrivers} active`}
                    />
                    <StatCard
                        title="Active Trips"
                        value={stats.activeTrips}
                        icon={MapPin}
                        color="#D4AF37"
                        subtext={`${stats.totalTrips} total trips`}
                    />
                    <StatCard
                        title="Alerts"
                        value={stats.alerts}
                        icon={AlertTriangle}
                        color="#C62828"
                        subtext={`${stats.unreadNotifications} unread notifications`}
                    />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F3F4F6] mb-8">
                    <h2
                        className="text-lg font-semibold text-[#1F083B] mb-4"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-4 rounded-lg p-3 hover:bg-[#F8F9FA] transition"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3E5F5]">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1">
                                        <p
                                            className="text-sm font-medium text-[#1F083B]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {activity.message}
                                        </p>
                                        <p
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            {formatTimeAgo(activity.timestamp)}
                                        </p>
                                    </div>
                                    <ChevronRight
                                        size={16}
                                        className="text-[#8E98A8]"
                                    />
                                </div>
                            ))
                        ) : (
                            <p
                                className="text-center text-[#8E98A8] py-8"
                                style={{ fontFamily: "Outfit" }}
                            >
                                No recent activity
                            </p>
                        )}
                    </div>
                </div>

                {/* Fleet Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F3F4F6]">
                        <h3
                            className="text-sm font-semibold text-[#1F083B] mb-4"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Fleet Overview
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span
                                    className="text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Total Vehicles
                                </span>
                                <span
                                    className="text-sm font-medium text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {stats.totalVehicles}
                                </span>
                            </div>
                            <div className="w-full bg-[#F3F4F6] rounded-full h-2">
                                <div
                                    className="bg-[#6E43A3] h-2 rounded-full"
                                    style={{
                                        width: `${stats.totalVehicles > 0 ? (stats.activeVehicles / stats.totalVehicles) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span
                                    className="text-xs text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {stats.activeVehicles} active
                                </span>
                                <span
                                    className="text-xs text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {stats.totalVehicles - stats.activeVehicles}{" "}
                                    inactive
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F3F4F6]">
                        <h3
                            className="text-sm font-semibold text-[#1F083B] mb-4"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Driver Overview
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span
                                    className="text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Total Drivers
                                </span>
                                <span
                                    className="text-sm font-medium text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {stats.totalDrivers}
                                </span>
                            </div>
                            <div className="w-full bg-[#F3F4F6] rounded-full h-2">
                                <div
                                    className="bg-[#2E7D32] h-2 rounded-full"
                                    style={{
                                        width: `${stats.totalDrivers > 0 ? (stats.activeDrivers / stats.totalDrivers) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span
                                    className="text-xs text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {stats.activeDrivers} active
                                </span>
                                <span
                                    className="text-xs text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {stats.totalDrivers - stats.activeDrivers}{" "}
                                    inactive
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ManagerSidebar>
    );
};

export default ManagerDashboard;
