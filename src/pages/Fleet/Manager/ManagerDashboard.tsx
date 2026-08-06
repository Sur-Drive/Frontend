// src/pages/Manager/ManagerDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Truck,
    MapPin,
    AlertTriangle,
    Users,
    Activity,
    Navigation,
    AlertCircle,
    CheckCircle,
    ArrowRight,
} from "lucide-react";
import ManagerSidebar from "./ManagerSidebar";
import BroadcastButton from "../components/BroadcastButton";
import LiveTrackingButton from "../Dashboard/LiveTrackingButton";
import ManagerLiveTrackingButton from "./ManagerLiveTrackingButton";
import ManagerBroadcastButton from "./ManagerBroadcastButton";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface FleetStats {
    totalVehicles: number;
    activeVehicles: number;
    totalDrivers: number;
    activeDrivers: number;
    totalTrips: number;
    activeTrips: number;
    alerts: number;
    unreadNotifications: number;
}

interface ManagerData {
    id: string;
    userId: string;
    fleetCompanyId: string;
    subFleetId: string;
    role: string;
    status: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    subFleet?: {
        id: string;
        name: string;
        region: string;
    };
    company?: {
        id: string;
        name: string;
        fleetName: string;
    };
}

interface RecentTrip {
    id: string;
    vehicle: string;
    driver: string;
    route: string;
    hazards: number;
    distance: string;
    status: string;
    timestamp: string;
}

interface SessionLog {
    id: string;
    type: "sos" | "hazard" | "trip" | "alert";
    message: string;
    time: string;
    driver: string;
    location: string;
    date: string;
    distance?: string;
}

const ManagerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<FleetStats>({
        totalVehicles: 0,
        activeVehicles: 0,
        totalDrivers: 0,
        activeDrivers: 0,
        totalTrips: 0,
        activeTrips: 0,
        alerts: 0,
        unreadNotifications: 0,
    });
    const [manager, setManager] = useState<ManagerData | null>(null);
    const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
    const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
    const [userName, setUserName] = useState("");
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [hazardCount, setHazardCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/fleet");
            return;
        }
        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // 1. Fetch manager profile (this gives us the sub-fleet info)
            const managerRes = await fetch(`${API_BASE}/manager/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (managerRes.ok) {
                const managerData = await managerRes.json();
                setManager(managerData);

                // Set user name from manager data
                if (managerData.user?.firstName && managerData.user?.lastName) {
                    setUserName(
                        `${managerData.user.firstName} ${managerData.user.lastName}`,
                    );
                }
            }

            // 2. Fetch vehicles for this manager's sub-fleet
            const vehiclesRes = await fetch(`${API_BASE}/manager/vehicles`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            let vehicles = [];
            if (vehiclesRes.ok) {
                vehicles = await vehiclesRes.json();
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

            // 3. Fetch drivers for this manager's sub-fleet
            const driversRes = await fetch(`${API_BASE}/manager/drivers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            let drivers = [];
            if (driversRes.ok) {
                drivers = await driversRes.json();
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

            // 4. Fetch trips for this manager's sub-fleet
            try {
                const tripsRes = await fetch(`${API_BASE}/sessions/trips`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (tripsRes.ok) {
                    const data = await tripsRes.json();
                    const items = data.items || [];
                    const total = items.length || 0;
                    const active =
                        items.filter(
                            (t: any) =>
                                t.tripStatus === "in_progress" ||
                                t.tripStatus === "active",
                        ).length || 0;

                    // Get recent trips
                    const recent = items.slice(0, 3).map((t: any) => ({
                        id: t.id,
                        vehicle: t.vehicle?.registrationNumber || "V-1045",
                        driver: t.driver?.name || "Tunde A.",
                        route: `${t.loginLocation?.split(",").slice(0, 3).join(", ") || "Lagos"} → ${t.logoutLocation?.split(",").slice(0, 3).join(", ") || "Ibadan"}`,
                        hazards: t.stats?.hazardsReported || 0,
                        distance: t.stats?.totalDistance
                            ? `${t.stats.totalDistance} km`
                            : "214 km",
                        status:
                            t.tripStatus === "in_progress"
                                ? "In Transit"
                                : "Completed",
                        timestamp: t.loginTime,
                    }));
                    setRecentTrips(recent);

                    // Count total hazards
                    const totalHazards = items.reduce(
                        (acc: number, t: any) =>
                            acc + (t.stats?.hazardsReported || 0),
                        0,
                    );
                    setHazardCount(totalHazards);

                    setStats((prev) => ({
                        ...prev,
                        totalTrips: total,
                        activeTrips: active,
                    }));

                    // Generate session logs
                    const logs: SessionLog[] = items
                        .slice(0, 5)
                        .map((t: any) => {
                            const isSos = t.stats?.sosAlerts > 0;
                            const hasHazards = t.stats?.hazardsReported > 0;
                            const type = isSos
                                ? "sos"
                                : hasHazards
                                  ? "hazard"
                                  : "trip";

                            let message = "";
                            if (isSos)
                                message = `SOS triggered · ${t.vehicle?.registrationNumber || "V-1045"}`;
                            else if (hasHazards)
                                message = `${t.stats.hazardsReported} hazard${t.stats.hazardsReported > 1 ? "s" : ""} reported on route`;
                            else
                                message = `Trip completed · ${t.vehicle?.registrationNumber || "V-1042"}`;

                            const timeDiff =
                                Date.now() - new Date(t.loginTime).getTime();
                            const minutes = Math.floor(timeDiff / 60000);
                            const time =
                                minutes < 1
                                    ? "Just now"
                                    : minutes < 60
                                      ? `${minutes}m ago`
                                      : `${Math.floor(minutes / 60)}h ago`;

                            return {
                                id: t.id,
                                type: type,
                                message: message,
                                time: time,
                                driver: t.driver?.name || "Unknown",
                                location:
                                    t.loginLocation?.split(",")[0] || "Unknown",
                                date: new Date(t.loginTime).toLocaleDateString(
                                    "en-US",
                                    {
                                        month: "2-digit",
                                        day: "2-digit",
                                        year: "numeric",
                                    },
                                ),
                                distance: t.stats?.totalDistance
                                    ? `${t.stats.totalDistance} km`
                                    : undefined,
                            };
                        });
                    setSessionLogs(logs);
                }
            } catch (e) {
                console.log("Trips endpoint not available yet");
            }

            // 5. Calculate alerts
            const vehiclesWithIssues = vehicles.filter((v: any) => {
                if (!v.nextService) return false;
                const serviceDate = new Date(v.nextService);
                const today = new Date();
                const diffDays = Math.ceil(
                    (serviceDate.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24),
                );
                return diffDays <= 7;
            }).length;

            setStats((prev) => ({
                ...prev,
                alerts: vehiclesWithIssues + hazardCount,
                unreadNotifications: vehiclesWithIssues + hazardCount,
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

    const getLogIcon = (type: string) => {
        switch (type) {
            case "sos":
                return <AlertCircle size={18} className="text-[#FE3F21]" />;
            case "hazard":
                return <AlertTriangle size={18} className="text-[#F2A618]" />;
            case "trip":
                return <CheckCircle size={18} className="text-[#2E7D32]" />;
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
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                {/* Welcome Section */}
                <div className="mb-4 sm:mb-6 md:mb-8">
                    <h1 className="text-xl font-bold text-[#1F083B] sm:text-2xl md:text-3xl">
                        Welcome back, {userName || "Fleet Manager"}!
                    </h1>
                    <p className="mt-1 text-sm text-[#8E98A8] sm:text-base">
                        Here's what's happening with your sub-fleet today.
                    </p>
                    {manager && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4">
                            {manager.subFleet && (
                                <span className="text-sm font-medium text-[#6E43A3]">
                                    {manager.subFleet.name}
                                </span>
                            )}
                            {manager.subFleet?.region && (
                                <span className="rounded-full bg-[#6E43A310] px-2 py-1 text-xs text-[#6E43A3]">
                                    {manager.subFleet.region}
                                </span>
                            )}
                            {manager.company && (
                                <span className="rounded-full bg-[#2E7D3224] px-2 py-1 text-xs text-[#2E7D32]">
                                    {manager.company.fleetName ||
                                        manager.company.name}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 md:grid-cols-4 lg:mb-8">
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

                {/* Two Columns */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    {/* Column 1: Chart + Recent Trips */}
                    <div className="space-y-4 lg:col-span-2 lg:space-y-6">
                        {/* Chart */}
                        <div className="rounded-xl border border-[#F3F4F6] bg-white p-4 shadow-sm sm:p-6">
                            <h3 className="mb-3 text-base font-semibold text-[#1F083B] sm:mb-4 sm:text-lg">
                                Trips & Alerts Rate
                            </h3>
                            <div className="relative overflow-hidden rounded-lg border border-[#E5E7EB] p-2 sm:p-4">
                                {/* Legend */}
                                <div className="mb-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-[#00BC7B] sm:h-3 sm:w-3"></div>
                                        <span className="text-xs text-[#8E98A8] sm:text-sm">
                                            Trips
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-[#F2A618] sm:h-3 sm:w-3"></div>
                                        <span className="text-xs text-[#8E98A8] sm:text-sm">
                                            Alerts
                                        </span>
                                    </div>
                                </div>

                                {/* Chart Container */}
                                <div className="relative h-[200px] w-full sm:h-[250px] md:h-[270px]">
                                    {(() => {
                                        const months = [
                                            "Jan",
                                            "Feb",
                                            "Mar",
                                            "Apr",
                                            "May",
                                            "Jun",
                                            "Jul",
                                            "Aug",
                                            "Sep",
                                            "Oct",
                                            "Nov",
                                            "Dec",
                                        ];
                                        const years = [
                                            "2024",
                                            "2024",
                                            "2024",
                                            "2024",
                                            "2024",
                                            "2024",
                                            "2025",
                                            "2025",
                                            "2025",
                                            "2025",
                                            "2025",
                                            "2025",
                                        ];

                                        const baseTrips = Math.min(
                                            stats.totalTrips || 8,
                                            10,
                                        );
                                        const tripData = [
                                            3.2,
                                            4.0,
                                            5.2,
                                            3.6,
                                            6.0,
                                            4.8,
                                            baseTrips,
                                            5.6,
                                            6.8,
                                            4.4,
                                            3.6,
                                            7.2,
                                        ];

                                        const baseAlerts = Math.min(
                                            hazardCount || 5,
                                            10,
                                        );
                                        const alertData = [
                                            1.8,
                                            2.8,
                                            3.8,
                                            1.5,
                                            4.5,
                                            3.0,
                                            baseAlerts,
                                            3.5,
                                            4.3,
                                            2.3,
                                            1.5,
                                            5.5,
                                        ];

                                        const maxVal = 10;
                                        const padding = {
                                            top: 10,
                                            bottom: 35,
                                            left: 50,
                                            right: 20,
                                        };
                                        const chartWidth =
                                            900 - padding.left - padding.right;
                                        const chartHeight =
                                            270 - padding.top - padding.bottom;
                                        const stepX =
                                            chartWidth / (tripData.length - 1);

                                        const tripPoints = tripData.map(
                                            (v, i) => ({
                                                x: padding.left + i * stepX,
                                                y:
                                                    padding.top +
                                                    chartHeight -
                                                    (v / maxVal) * chartHeight,
                                                value: v,
                                                index: i,
                                            }),
                                        );

                                        const alertPoints = alertData.map(
                                            (v, i) => ({
                                                x: padding.left + i * stepX,
                                                y:
                                                    padding.top +
                                                    chartHeight -
                                                    (v / maxVal) * chartHeight,
                                                value: v,
                                                index: i,
                                            }),
                                        );

                                        const tripPath = tripPoints
                                            .map(
                                                (p, i) =>
                                                    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                                            )
                                            .join(" ");
                                        const alertPath = alertPoints
                                            .map(
                                                (p, i) =>
                                                    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                                            )
                                            .join(" ");
                                        const tripAreaPath =
                                            tripPath +
                                            ` L ${tripPoints[tripPoints.length - 1].x} ${padding.top + chartHeight} L ${tripPoints[0].x} ${padding.top + chartHeight} Z`;
                                        const alertAreaPath =
                                            alertPath +
                                            ` L ${alertPoints[alertPoints.length - 1].x} ${padding.top + chartHeight} L ${alertPoints[0].x} ${padding.top + chartHeight} Z`;

                                        const yAxisValues = [10, 8, 6, 4, 2, 0];
                                        const hoverIndex =
                                            hoveredIndex !== null
                                                ? hoveredIndex
                                                : tripData.length - 1;

                                        return (
                                            <svg
                                                className="h-full w-full"
                                                viewBox="0 0 900 270"
                                                preserveAspectRatio="none"
                                            >
                                                {/* Grid Lines */}
                                                {yAxisValues.map((val, i) => {
                                                    const y =
                                                        padding.top +
                                                        (i /
                                                            (yAxisValues.length -
                                                                1)) *
                                                            chartHeight;
                                                    return (
                                                        <g key={`grid-${i}`}>
                                                            <line
                                                                x1={
                                                                    padding.left
                                                                }
                                                                y1={y}
                                                                x2={
                                                                    padding.left +
                                                                    chartWidth
                                                                }
                                                                y2={y}
                                                                stroke="#E5E7EB"
                                                                strokeWidth="1"
                                                                strokeDasharray="4 4"
                                                            />
                                                            <text
                                                                x={
                                                                    padding.left -
                                                                    10
                                                                }
                                                                y={y + 4}
                                                                textAnchor="end"
                                                                fontSize="10"
                                                                fill="#8E98A8"
                                                                fontFamily="Outfit"
                                                            >
                                                                {val}
                                                            </text>
                                                        </g>
                                                    );
                                                })}

                                                {/* Areas */}
                                                <path
                                                    d={tripAreaPath}
                                                    fill="url(#tripGradient)"
                                                    opacity="0.3"
                                                />
                                                <path
                                                    d={alertAreaPath}
                                                    fill="url(#alertGradient)"
                                                    opacity="0.3"
                                                />

                                                {/* Lines */}
                                                <path
                                                    d={tripPath}
                                                    stroke="#00BC7B"
                                                    strokeWidth="2.5"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d={alertPath}
                                                    stroke="#F2A618"
                                                    strokeWidth="2.5"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />

                                                {/* Hover Areas */}
                                                {tripPoints.map((p, i) => (
                                                    <circle
                                                        key={`hover-${i}`}
                                                        cx={p.x}
                                                        cy={p.y}
                                                        r="15"
                                                        fill="transparent"
                                                        style={{
                                                            cursor: "pointer",
                                                        }}
                                                        onMouseEnter={() =>
                                                            setHoveredIndex(i)
                                                        }
                                                        onMouseLeave={() =>
                                                            setHoveredIndex(
                                                                null,
                                                            )
                                                        }
                                                    />
                                                ))}

                                                {/* Data Points - Trips */}
                                                {tripPoints.map((p, i) => {
                                                    const isHovered =
                                                        hoveredIndex === i;
                                                    return (
                                                        <circle
                                                            key={`trip-${i}`}
                                                            cx={p.x}
                                                            cy={p.y}
                                                            r={
                                                                isHovered
                                                                    ? "6"
                                                                    : "3.5"
                                                            }
                                                            fill="#00BC7B"
                                                            stroke="white"
                                                            strokeWidth={
                                                                isHovered
                                                                    ? "2.5"
                                                                    : "1.5"
                                                            }
                                                            style={{
                                                                transition:
                                                                    "all 0.2s",
                                                            }}
                                                        />
                                                    );
                                                })}

                                                {/* Data Points - Alerts */}
                                                {alertPoints.map((p, i) => {
                                                    const isHovered =
                                                        hoveredIndex === i;
                                                    return (
                                                        <circle
                                                            key={`alert-${i}`}
                                                            cx={p.x}
                                                            cy={p.y}
                                                            r={
                                                                isHovered
                                                                    ? "6"
                                                                    : "3.5"
                                                            }
                                                            fill="#F2A618"
                                                            stroke="white"
                                                            strokeWidth={
                                                                isHovered
                                                                    ? "2.5"
                                                                    : "1.5"
                                                            }
                                                            style={{
                                                                transition:
                                                                    "all 0.2s",
                                                            }}
                                                        />
                                                    );
                                                })}

                                                {/* X-Axis Labels */}
                                                {months.map((month, i) => {
                                                    const x =
                                                        padding.left +
                                                        i * stepX;
                                                    const isHovered =
                                                        hoveredIndex === i;
                                                    return (
                                                        <text
                                                            key={i}
                                                            x={x}
                                                            y={
                                                                padding.top +
                                                                chartHeight +
                                                                20
                                                            }
                                                            textAnchor="middle"
                                                            fontSize={
                                                                isHovered
                                                                    ? "11"
                                                                    : "9"
                                                            }
                                                            fill={
                                                                isHovered
                                                                    ? "#1F083B"
                                                                    : "#8E98A8"
                                                            }
                                                            fontFamily="Outfit"
                                                            fontWeight={
                                                                isHovered
                                                                    ? "600"
                                                                    : "400"
                                                            }
                                                            style={{
                                                                transition:
                                                                    "all 0.2s",
                                                            }}
                                                        >
                                                            {month}
                                                        </text>
                                                    );
                                                })}

                                                {/* Tooltip */}
                                                {hoveredIndex !== null && (
                                                    <g
                                                        transform={`translate(${tripPoints[hoveredIndex].x - 40}, ${tripPoints[hoveredIndex].y - 75})`}
                                                    >
                                                        <rect
                                                            x="0"
                                                            y="0"
                                                            width="80"
                                                            height="70"
                                                            rx="8"
                                                            fill="#1F083B"
                                                            opacity="0.95"
                                                            filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.15))"
                                                        />
                                                        <text
                                                            x="40"
                                                            y="16"
                                                            textAnchor="middle"
                                                            fontSize="8"
                                                            fill="#FFFFFF"
                                                            fontFamily="Outfit"
                                                            fontWeight="600"
                                                        >
                                                            {
                                                                months[
                                                                    hoveredIndex
                                                                ]
                                                            }{" "}
                                                            {
                                                                years[
                                                                    hoveredIndex
                                                                ]
                                                            }
                                                        </text>
                                                        <line
                                                            x1="10"
                                                            y1="22"
                                                            x2="70"
                                                            y2="22"
                                                            stroke="#E5E7EB"
                                                            strokeWidth="0.5"
                                                        />
                                                        <text
                                                            x="10"
                                                            y="38"
                                                            fontSize="8"
                                                            fill="#00BC7B"
                                                            fontFamily="Outfit"
                                                        >
                                                            ● Trips
                                                        </text>
                                                        <text
                                                            x="70"
                                                            y="38"
                                                            textAnchor="end"
                                                            fontSize="10"
                                                            fill="#FFFFFF"
                                                            fontFamily="Outfit"
                                                            fontWeight="600"
                                                        >
                                                            {
                                                                tripData[
                                                                    hoveredIndex
                                                                ]
                                                            }
                                                        </text>
                                                        <text
                                                            x="10"
                                                            y="55"
                                                            fontSize="8"
                                                            fill="#F2A618"
                                                            fontFamily="Outfit"
                                                        >
                                                            ● Alerts
                                                        </text>
                                                        <text
                                                            x="70"
                                                            y="55"
                                                            textAnchor="end"
                                                            fontSize="10"
                                                            fill="#FFFFFF"
                                                            fontFamily="Outfit"
                                                            fontWeight="600"
                                                        >
                                                            {
                                                                alertData[
                                                                    hoveredIndex
                                                                ]
                                                            }
                                                        </text>
                                                    </g>
                                                )}

                                                <defs>
                                                    <linearGradient
                                                        id="tripGradient"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="0%"
                                                            stopColor="#00BC7B"
                                                            stopOpacity="0.4"
                                                        />
                                                        <stop
                                                            offset="100%"
                                                            stopColor="#00BC7B"
                                                            stopOpacity="0"
                                                        />
                                                    </linearGradient>
                                                    <linearGradient
                                                        id="alertGradient"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="0%"
                                                            stopColor="#F2A618"
                                                            stopOpacity="0.4"
                                                        />
                                                        <stop
                                                            offset="100%"
                                                            stopColor="#F2A618"
                                                            stopOpacity="0"
                                                        />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        );
                                    })()}
                                </div>

                                {/* Gradient Labels */}
                                <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-xs text-[#8E98A8] sm:gap-6 sm:text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-12 rounded bg-gradient-to-r from-[#00BC7B00] to-[#00BC7B] sm:w-16"></div>
                                        <span>Trips</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-12 rounded bg-gradient-to-r from-[#F2A61800] to-[#F2A618] sm:w-16"></div>
                                        <span>Alerts</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Trips */}
                        <div className="rounded-xl border border-[#F3F4F6] bg-white p-4 shadow-sm sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-base font-semibold text-[#1F083B] sm:text-lg">
                                    Recent Trips
                                </h2>
                                <button
                                    onClick={() => navigate("/manager/trips")}
                                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition hover:opacity-80 sm:px-3 sm:py-1.5 sm:text-sm"
                                    style={{
                                        color: "#4A148C",
                                        backgroundColor: "#EDE8F4",
                                    }}
                                >
                                    Manage all
                                    <ArrowRight
                                        size={14}
                                        style={{ color: "#4A148C" }}
                                    />
                                </button>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                {recentTrips.length > 0 ? (
                                    recentTrips.map((trip) => {
                                        const isCompleted =
                                            trip.status === "Completed";
                                        const statusColor = isCompleted
                                            ? "#2E7D32"
                                            : "#F0C040";
                                        const statusBg = isCompleted
                                            ? "#2E7D3224"
                                            : "#F0C04024";

                                        return (
                                            <div
                                                key={trip.id}
                                                className="flex flex-col rounded-lg border border-[#F3F4F6] p-3 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-4"
                                            >
                                                <div className="mb-2 flex-1 sm:mb-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-medium text-[#1F083B]">
                                                            {trip.vehicle} -{" "}
                                                            {trip.driver}
                                                        </p>
                                                    </div>
                                                    <p
                                                        className="mt-0.5 truncate text-xs text-[#8E98A8]"
                                                        style={{
                                                            maxWidth: "100%",
                                                        }}
                                                        title={trip.route}
                                                    >
                                                        {trip.route}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-1">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                                                        style={{
                                                            color: statusColor,
                                                            backgroundColor:
                                                                statusBg,
                                                        }}
                                                    >
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    statusColor,
                                                            }}
                                                        ></span>
                                                        {trip.status}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        {trip.hazards > 0 && (
                                                            <span
                                                                className="flex items-center gap-1 text-xs font-medium"
                                                                style={{
                                                                    color: "#E65100",
                                                                }}
                                                            >
                                                                {trip.hazards}{" "}
                                                                hazards
                                                            </span>
                                                        )}
                                                        <span
                                                            className="text-xs"
                                                            style={{
                                                                color: "#020B38",
                                                            }}
                                                        >
                                                            {trip.distance}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="py-4 text-center text-sm text-[#8E98A8] sm:py-8">
                                        No recent trips
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Quick Actions + Map + Recent Activity */}
                    <div className="space-y-4 lg:col-span-1 lg:space-y-6">
                        {/* Quick Actions */}
                        <div className="rounded-xl border border-[#F3F4F6] bg-white p-4 shadow-sm sm:p-6">
                            <h2 className="mb-3 text-base font-semibold text-[#1F083B] sm:mb-4 sm:text-lg">
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <ManagerLiveTrackingButton />
                                <ManagerBroadcastButton
                                    onBroadcastSent={() => {
                                        console.log(
                                            "Broadcast sent successfully!",
                                        );
                                    }}
                                />
                            </div>
                        </div>

                        {/* Map */}
                        <div className="rounded-xl border border-[#F3F4F6] bg-white p-4 shadow-sm sm:p-6">
                            <h2 className="mb-3 text-base font-semibold text-[#1F083B] sm:mb-4 sm:text-lg">
                                Live Map
                            </h2>
                            <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-[#F3F4F6] sm:h-48">
                                <div className="text-center">
                                    <Navigation
                                        size={24}
                                        className="mx-auto text-[#6E43A3] sm:size-[28px]"
                                    />
                                    <p className="mt-2 text-xs text-[#8E98A8]">
                                        Live vehicle locations
                                    </p>
                                    <p className="text-[10px] text-[#8E98A8]">
                                        {stats.activeVehicles} active vehicles
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="rounded-xl border border-[#F3F4F6] bg-white p-4 shadow-sm sm:p-6">
                            <h2 className="mb-3 text-base font-semibold text-[#1F083B] sm:mb-4 sm:text-lg">
                                Recent Activity
                            </h2>
                            <div className="space-y-2 sm:space-y-3">
                                {sessionLogs.slice(0, 4).map((log) => {
                                    const iconColors = {
                                        sos: { bg: "#FEE4E0", icon: "#FE3F21" },
                                        hazard: {
                                            bg: "#FEF3D9",
                                            icon: "#F2A618",
                                        },
                                        trip: {
                                            bg: "#E8F5E9",
                                            icon: "#2E7D32",
                                        },
                                        default: {
                                            bg: "#F3F4F6",
                                            icon: "#8E98A8",
                                        },
                                    };
                                    const color =
                                        iconColors[
                                            log.type as keyof typeof iconColors
                                        ] || iconColors.default;

                                    return (
                                        <div
                                            key={log.id}
                                            className="flex items-start gap-2 rounded-lg p-2 transition hover:bg-[#F8F9FA] sm:gap-3"
                                        >
                                            <div
                                                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8"
                                                style={{
                                                    backgroundColor: color.bg,
                                                }}
                                            >
                                                {React.cloneElement(
                                                    getLogIcon(log.type),
                                                    {
                                                        size: 16,
                                                        style: {
                                                            color: color.icon,
                                                        },
                                                    },
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-[#1F083B]">
                                                    {log.message}
                                                </p>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-1 sm:gap-2">
                                                    <p className="whitespace-nowrap text-[10px] text-[#8E98A8]">
                                                        {log.time}
                                                    </p>
                                                    <span className="text-[10px] text-[#D1D5DB]">
                                                        ·
                                                    </span>
                                                    <p className="truncate text-[10px] text-[#8E98A8]">
                                                        {log.driver}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {sessionLogs.length === 0 && (
                                    <p className="py-4 text-center text-sm text-[#8E98A8]">
                                        No recent activity
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ManagerSidebar>
    );
};

export default ManagerDashboard;
