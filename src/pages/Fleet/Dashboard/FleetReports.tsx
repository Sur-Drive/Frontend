import React, { useState, useEffect } from "react";
import {
    Search,
    Download,
    FileText,
    Filter,
    Plus,
    X,
    TrendingUp,
    AlertTriangle,
    Activity,
    CheckCircle,
    ChevronRight,
} from "lucide-react";
import DashSidebar from "../Dashboard/DashSidebar";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface Report {
    id: string;
    type: "safety" | "hazard_encounter" | "sos" | "trip";
    period: string;
    reportNumber: string;
    status: "completed" | "pending" | "failed";
    fileName: string;
    fileUrl: string;
    fileSize: number;
    startDate: string;
    endDate: string;
    generatedAt: string;
    expiresAt: string;
    metadata: {
        stats: {
            avgTopSpeed: number;
            avgSafetyScore: number;
            maxSafetyScore: number;
            minSafetyScore: number;
            totalHardBrakes: number;
            totalRapidAccelerations: number;
        };
        sosCount: number;
        totalTrips: number;
        driverCount: number;
        hazardCount: number;
        totalDistance: number;
        avgSafetyScore: number;
    };
    downloadCount: number;
    createdAt: string;
    updatedAt: string;
}

interface ReportStats {
    totalTrips: number;
    totalDistance: number;
    avgSafetyScore: number;
    sosCount: number;
    hazardCount: number;
}

const FleetReports: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [stats, setStats] = useState<ReportStats>({
        totalTrips: 0,
        totalDistance: 0,
        avgSafetyScore: 0,
        sosCount: 0,
        hazardCount: 0,
    });
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generateForm, setGenerateForm] = useState({
        type: "",
        period: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const reportTypes = [
        { value: "safety", label: "Safety Report" },
        { value: "hazard_encounter", label: "Hazard Encounter" },
        { value: "sos", label: "SOS Report" },
        { value: "trip", label: "Trip Report" },
    ];

    const periods = [
        { value: "today", label: "Today" },
        { value: "yesterday", label: "Yesterday" },
        { value: "this_week", label: "This Week" },
        { value: "last_30_days", label: "Last 30 Days" },
        { value: "last_90_days", label: "Last 90 Days" },
        { value: "current_quarter", label: "Current Quarter" },
    ];

    // Fetch reports
    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const params = new URLSearchParams();
            params.append("page", "1");
            params.append("limit", "100");
            if (selectedType !== "all") {
                params.append("type", selectedType);
            }

            const response = await fetch(`${API_BASE}/reports?${params}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch reports");
            }

            const data = await response.json();
            const reportsData = Array.isArray(data?.items) ? data.items : [];
            setReports(reportsData);

            // Update stats from the first report's metadata or calculate
            if (reportsData.length > 0) {
                const latest = reportsData[0];
                setStats({
                    totalTrips: latest.metadata?.totalTrips || 0,
                    totalDistance: latest.metadata?.totalDistance || 0,
                    avgSafetyScore: latest.metadata?.avgSafetyScore || 0,
                    sosCount: latest.metadata?.sosCount || 0,
                    hazardCount: latest.metadata?.hazardCount || 0,
                });
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [selectedType]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedType]);

    // Generate report
    const handleGenerateReport = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/reports/generate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    period: generateForm.period,
                    type: generateForm.type,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to generate report");
            }

            setShowGenerateModal(false);
            setShowSuccessModal(true);
            setGenerateForm({ type: "", period: "" });
            fetchReports();
        } catch (error: any) {
            console.error("Error generating report:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Download report
    const handleDownload = async (reportId: string) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE}/reports/${reportId}/download`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to download report");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `report-${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading report:", error);
        }
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "text-[#2E7D32] bg-[#2E7D3224]";
            case "pending":
                return "text-[#F2A618] bg-[#F2A61824]";
            case "failed":
                return "text-[#FE3F21] bg-[#FE3F2124]";
            default:
                return "text-gray-500 bg-gray-100";
        }
    };

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case "completed":
                return "Completed";
            case "pending":
                return "Pending";
            case "failed":
                return "Failed";
            default:
                return status;
        }
    };

    const getTypeDisplay = (type: string) => {
        switch (type) {
            case "safety":
                return "Safety Report";
            case "hazard_encounter":
                return "Hazard Encounter";
            case "sos":
                return "SOS Report";
            case "trip":
                return "Trip Report";
            default:
                return type;
        }
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "-";
        }
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return (
                date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                }) +
                " · " +
                date.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        } catch {
            return "-";
        }
    };

    // Get period display
    const getPeriodDisplay = (period: string) => {
        const p = periods.find((p) => p.value === period);
        return p ? p.label : period;
    };

    // Filter reports
    const filteredReports = reports.filter((report) => {
        const searchLower = searchTerm.toLowerCase();
        const typeMatch =
            report.type?.toLowerCase().includes(searchLower) || false;
        const numberMatch =
            report.reportNumber?.toLowerCase().includes(searchLower) || false;
        return typeMatch || numberMatch;
    });

    // Pagination
    const totalItems = filteredReports.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentReports = filteredReports.slice(startIndex, endIndex);

    return (
        <DashSidebar>
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                    <h1 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                        Reports
                    </h1>
                    <p className="mt-1 text-sm text-[#8E98A8]">
                        Fleet performance, safety and compliance insights
                    </p>
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
                    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 text-[#6F6C8F]">
                            <Activity
                                size={16}
                                className="text-[#6E43A3] sm:size-[18px]"
                            />
                            <span className="text-xs font-medium sm:text-sm">
                                Trips
                            </span>
                        </div>
                        <div className="mt-1 text-2xl font-bold text-[#6E43A3] sm:text-3xl">
                            {stats.totalTrips}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Total trips
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 text-[#6F6C8F]">
                            <TrendingUp
                                size={16}
                                className="text-[#00BC7B] sm:size-[18px]"
                            />
                            <span className="text-xs font-medium sm:text-sm">
                                Distance (km)
                            </span>
                        </div>
                        <div className="mt-1 text-2xl font-bold text-[#00BC7B] sm:text-3xl">
                            {stats.totalDistance.toFixed(1)}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Total distance covered
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 text-[#6F6C8F]">
                            <CheckCircle
                                size={16}
                                className="text-[#2E7D32] sm:size-[18px]"
                            />
                            <span className="text-xs font-medium sm:text-sm">
                                Avg Safety
                            </span>
                        </div>
                        <div className="mt-1 text-2xl font-bold text-[#2E7D32] sm:text-3xl">
                            {stats.avgSafetyScore}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Average safety score
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 text-[#6F6C8F]">
                            <AlertTriangle
                                size={16}
                                className="text-[#FE3F21] sm:size-[18px]"
                            />
                            <span className="text-xs font-medium sm:text-sm">
                                SOS this month
                            </span>
                        </div>
                        <div className="mt-1 text-2xl font-bold text-[#FE3F21] sm:text-3xl">
                            {stats.sosCount}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            SOS alerts
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 text-[#6F6C8F]">
                            <AlertTriangle
                                size={16}
                                className="text-[#F2A618] sm:size-[18px]"
                            />
                            <span className="text-xs font-medium sm:text-sm">
                                Hazards
                            </span>
                        </div>
                        <div className="mt-1 text-2xl font-bold text-[#F2A618] sm:text-3xl">
                            {stats.hazardCount}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8E98A8] sm:text-xs">
                            Hazards reported
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="mt-4 rounded-xl bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
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

                        {/* Chart Container - Responsive height */}
                        <div className="relative h-[200px] w-full sm:h-[250px] md:h-[270px]">
                            {(() => {
                                // Generate 12 months of data
                                const now = new Date();
                                const months = [];
                                const years = [];
                                for (let i = 11; i >= 0; i--) {
                                    const date = new Date(
                                        now.getFullYear(),
                                        now.getMonth() - i,
                                        1,
                                    );
                                    months.push(
                                        date.toLocaleString("default", {
                                            month: "short",
                                        }),
                                    );
                                    years.push(date.getFullYear());
                                }

                                // Scale down trips - keep between 0 and 10
                                const baseTrips = Math.min(
                                    stats.totalTrips || 8,
                                    10,
                                );
                                const tripData = [
                                    Math.round(baseTrips * 0.4 * 10) / 10,
                                    Math.round(baseTrips * 0.5 * 10) / 10,
                                    Math.round(baseTrips * 0.65 * 10) / 10,
                                    Math.round(baseTrips * 0.45 * 10) / 10,
                                    Math.round(baseTrips * 0.75 * 10) / 10,
                                    Math.round(baseTrips * 0.6 * 10) / 10,
                                    baseTrips,
                                    Math.round(baseTrips * 0.7 * 10) / 10,
                                    Math.round(baseTrips * 0.85 * 10) / 10,
                                    Math.round(baseTrips * 0.55 * 10) / 10,
                                    Math.round(baseTrips * 0.45 * 10) / 10,
                                    Math.round(baseTrips * 0.9 * 10) / 10,
                                ];

                                // Scale down alerts - keep between 0 and 10
                                const baseAlerts = Math.min(
                                    stats.hazardCount || 5,
                                    10,
                                );
                                const alertData = [
                                    Math.round(baseAlerts * 0.35 * 10) / 10,
                                    Math.round(baseAlerts * 0.55 * 10) / 10,
                                    Math.round(baseAlerts * 0.75 * 10) / 10,
                                    Math.round(baseAlerts * 0.3 * 10) / 10,
                                    Math.round(baseAlerts * 0.9 * 10) / 10,
                                    Math.round(baseAlerts * 0.6 * 10) / 10,
                                    baseAlerts,
                                    Math.round(baseAlerts * 0.7 * 10) / 10,
                                    Math.round(baseAlerts * 0.85 * 10) / 10,
                                    Math.round(baseAlerts * 0.45 * 10) / 10,
                                    Math.round(baseAlerts * 0.3 * 10) / 10,
                                    Math.round(baseAlerts * 1.1 * 10) / 10,
                                ];

                                // Calculate max value
                                const maxTrip = Math.max(...tripData);
                                const maxAlert = Math.max(...alertData);
                                const maxValue =
                                    Math.ceil(
                                        Math.max(maxTrip, maxAlert, 5) / 1,
                                    ) * 1;

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

                                // Build points
                                const tripPoints = tripData.map(
                                    (value, index) => {
                                        const x = padding.left + index * stepX;
                                        const y =
                                            padding.top +
                                            chartHeight -
                                            (value / maxValue) * chartHeight;
                                        return { x, y, value, index };
                                    },
                                );

                                const alertPoints = alertData.map(
                                    (value, index) => {
                                        const x = padding.left + index * stepX;
                                        const y =
                                            padding.top +
                                            chartHeight -
                                            (value / maxValue) * chartHeight;
                                        return { x, y, value, index };
                                    },
                                );

                                // Build SVG path strings
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

                                // Area paths
                                const tripAreaPath =
                                    tripPath +
                                    ` L ${tripPoints[tripPoints.length - 1].x} ${padding.top + chartHeight} L ${tripPoints[0].x} ${padding.top + chartHeight} Z`;
                                const alertAreaPath =
                                    alertPath +
                                    ` L ${alertPoints[alertPoints.length - 1].x} ${padding.top + chartHeight} L ${alertPoints[0].x} ${padding.top + chartHeight} Z`;

                                // Y-axis values
                                const yAxisSteps = 5;
                                const yAxisValues = [];
                                for (let i = 0; i <= yAxisSteps; i++) {
                                    const value =
                                        (maxValue / yAxisSteps) *
                                        (yAxisSteps - i);
                                    yAxisValues.push(
                                        Math.round(value * 10) / 10,
                                    );
                                }

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
                                        {yAxisValues.map((value, i) => {
                                            const y =
                                                padding.top +
                                                (i / yAxisSteps) * chartHeight;
                                            return (
                                                <g key={`grid-${i}`}>
                                                    <line
                                                        x1={padding.left}
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
                                                        x={padding.left - 10}
                                                        y={y + 4}
                                                        textAnchor="end"
                                                        fontSize="10"
                                                        fill="#8E98A8"
                                                        fontFamily="Outfit"
                                                    >
                                                        {value}
                                                    </text>
                                                </g>
                                            );
                                        })}

                                        {/* Trip Area Fill */}
                                        <path
                                            d={tripAreaPath}
                                            fill="url(#tripGradient)"
                                            opacity="0.3"
                                        />

                                        {/* Alert Area Fill */}
                                        <path
                                            d={alertAreaPath}
                                            fill="url(#alertGradient)"
                                            opacity="0.3"
                                        />

                                        {/* Trip Line */}
                                        <path
                                            d={tripPath}
                                            stroke="#00BC7B"
                                            strokeWidth="2.5"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        {/* Alert Line */}
                                        <path
                                            d={alertPath}
                                            stroke="#F2A618"
                                            strokeWidth="2.5"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        {/* Invisible hover areas */}
                                        {tripPoints.map((p, i) => (
                                            <g key={`hover-area-${i}`}>
                                                <circle
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
                                                        setHoveredIndex(null)
                                                    }
                                                />
                                            </g>
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
                                                    r={isHovered ? "6" : "3.5"}
                                                    fill="#00BC7B"
                                                    stroke="white"
                                                    strokeWidth={
                                                        isHovered
                                                            ? "2.5"
                                                            : "1.5"
                                                    }
                                                    style={{
                                                        transition: "all 0.2s",
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
                                                    r={isHovered ? "6" : "3.5"}
                                                    fill="#F2A618"
                                                    stroke="white"
                                                    strokeWidth={
                                                        isHovered
                                                            ? "2.5"
                                                            : "1.5"
                                                    }
                                                    style={{
                                                        transition: "all 0.2s",
                                                    }}
                                                />
                                            );
                                        })}

                                        {/* X-Axis Labels */}
                                        {months.map((month, i) => {
                                            const x = padding.left + i * stepX;
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
                                                        isHovered ? "11" : "9"
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
                                                        transition: "all 0.2s",
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
                                                    {months[hoveredIndex]}{" "}
                                                    {years[hoveredIndex]}
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
                                                    {tripData[hoveredIndex]}
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
                                                    {alertData[hoveredIndex]}
                                                </text>
                                            </g>
                                        )}

                                        {/* Gradients */}
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

                {/* Reports Table Section */}
                <div className="mt-4 rounded-xl bg-white p-3 shadow-sm sm:mt-6 sm:p-4 md:p-6">
                    {/* Table Header */}
                    <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-base font-semibold text-[#1F083B] sm:text-lg">
                            Generated Reports ({totalItems})
                        </h2>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <button
                                onClick={() => setShowGenerateModal(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6E43A3] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95 sm:w-auto sm:px-6"
                            >
                                <Plus size={18} />
                                Generate Report
                            </button>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                                <div className="relative w-full sm:w-48 md:w-56">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                        size={16}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search reports..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full rounded-xl bg-[#F8F8F8] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter
                                        size={16}
                                        className="text-[#8E98A8]"
                                    />
                                    <select
                                        value={selectedType}
                                        onChange={(e) =>
                                            setSelectedType(e.target.value)
                                        }
                                        className="rounded-xl bg-[#F8F8F8] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3] sm:px-4"
                                    >
                                        <option value="all">All Types</option>
                                        {reportTypes.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="space-y-3 sm:hidden">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                Loading reports...
                            </div>
                        ) : currentReports.length === 0 ? (
                            <div className="py-8 text-center text-sm text-[#8E98A8]">
                                No reports found
                            </div>
                        ) : (
                            currentReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="rounded-lg border border-[#E0E5EB] bg-white p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#6E43A310]">
                                                <FileText
                                                    size={18}
                                                    className="text-[#6E43A3]"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium text-[#111827]">
                                                    {report.reportNumber}
                                                </div>
                                                <div className="truncate text-xs text-[#8E98A8]">
                                                    {getTypeDisplay(
                                                        report.type,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${getStatusColor(report.status)}`}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                            {getStatusDisplay(report.status)}
                                        </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E0E5EB] pt-3">
                                        <div>
                                            <p className="text-[10px] text-[#8E98A8]">
                                                Period
                                            </p>
                                            <p className="truncate text-xs font-medium text-[#111827]">
                                                {getPeriodDisplay(
                                                    report.period,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#8E98A8]">
                                                Generated
                                            </p>
                                            <p className="truncate text-xs font-medium text-[#111827]">
                                                {formatDateTime(
                                                    report.generatedAt,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#8E98A8]">
                                                Size
                                            </p>
                                            <p className="truncate text-xs font-medium text-[#111827]">
                                                {formatFileSize(
                                                    report.fileSize,
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-end justify-end">
                                            <button
                                                onClick={() =>
                                                    handleDownload(report.id)
                                                }
                                                className="rounded-lg p-2 text-[#6E43A3] transition hover:bg-[#F8F8F8]"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-[#E0E5EB]">
                                    <th className="py-2 text-left text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm">
                                        Report
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] md:table-cell sm:py-3 sm:text-sm">
                                        Type/Size
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] lg:table-cell sm:py-3 sm:text-sm">
                                        Period
                                    </th>
                                    <th className="hidden py-2 text-left text-xs font-medium text-[#8E98A8] xl:table-cell sm:py-3 sm:text-sm">
                                        Generated
                                    </th>
                                    <th className="py-2 text-left text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm">
                                        Status
                                    </th>
                                    <th className="py-2 text-right text-xs font-medium text-[#8E98A8] sm:py-3 sm:text-sm">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-sm text-[#8E98A8]"
                                        >
                                            Loading reports...
                                        </td>
                                    </tr>
                                ) : currentReports.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-sm text-[#8E98A8]"
                                        >
                                            No reports found
                                        </td>
                                    </tr>
                                ) : (
                                    currentReports.map((report) => (
                                        <tr
                                            key={report.id}
                                            className="border-b border-[#E0E5EB] transition hover:bg-[#F7F7F7]"
                                        >
                                            <td className="py-2 sm:py-3">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#6E43A310] sm:h-10 sm:w-10">
                                                        <FileText
                                                            size={16}
                                                            className="text-[#6E43A3] sm:size-[18px]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-[#111827]">
                                                            {
                                                                report.reportNumber
                                                            }
                                                        </div>
                                                        <div className="text-xs text-[#8E98A8]">
                                                            {getTypeDisplay(
                                                                report.type,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden py-2 md:table-cell sm:py-3">
                                                <div>
                                                    <div className="text-sm text-[#111827]">
                                                        {getTypeDisplay(
                                                            report.type,
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-[#8E98A8]">
                                                        {formatFileSize(
                                                            report.fileSize,
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden py-2 lg:table-cell sm:py-3">
                                                <div>
                                                    <div className="text-sm text-[#111827]">
                                                        {getPeriodDisplay(
                                                            report.period,
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-[#8E98A8]">
                                                        {formatDate(
                                                            report.startDate,
                                                        )}{" "}
                                                        –{" "}
                                                        {formatDate(
                                                            report.endDate,
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden py-2 xl:table-cell sm:py-3">
                                                <span className="text-sm text-[#111827]">
                                                    {formatDateTime(
                                                        report.generatedAt,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-2 sm:py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium sm:px-3 ${getStatusColor(report.status)}`}
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                                    {getStatusDisplay(
                                                        report.status,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right sm:py-3">
                                                <button
                                                    onClick={() =>
                                                        handleDownload(
                                                            report.id,
                                                        )
                                                    }
                                                    className="rounded-lg p-1.5 text-[#6E43A3] transition hover:bg-[#F8F8F8] sm:p-2"
                                                    title="Download"
                                                >
                                                    <Download
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

            {/* Generate Report Modal - Mobile friendly */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                                    Generate a new report
                                </h2>
                                <p className="mt-1 text-sm text-[#5B646F]">
                                    Choose a report type and time period.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowGenerateModal(false);
                                    setGenerateForm({ type: "", period: "" });
                                }}
                                className="flex-shrink-0 rounded-lg p-1 text-[#5B646F] transition hover:bg-gray-100 hover:text-[#1F083B]"
                            >
                                <X size={20} className="sm:size-[24px]" />
                            </button>
                        </div>

                        <div className="mb-4 h-px w-full bg-[#E5E7EB] sm:mb-6" />

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
                                    Report type
                                </label>
                                <select
                                    value={generateForm.type}
                                    onChange={(e) =>
                                        setGenerateForm((prev) => ({
                                            ...prev,
                                            type: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 focus:border-[#6E43A3] focus:outline-none"
                                >
                                    <option value="">Select</option>
                                    {reportTypes.map((type) => (
                                        <option
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[#5B646F]">
                                    Period
                                </label>
                                <select
                                    value={generateForm.period}
                                    onChange={(e) =>
                                        setGenerateForm((prev) => ({
                                            ...prev,
                                            period: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-[#E0E5EB] bg-white px-4 py-3 focus:border-[#6E43A3] focus:outline-none"
                                >
                                    <option value="">Select</option>
                                    {periods.map((period) => (
                                        <option
                                            key={period.value}
                                            value={period.value}
                                        >
                                            {period.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                onClick={() => {
                                    setShowGenerateModal(false);
                                    setGenerateForm({ type: "", period: "" });
                                }}
                                className="w-full rounded-xl border border-[#E0E5EB] px-4 py-3 text-sm text-[#8E98A8] transition hover:bg-gray-50 active:scale-95 sm:flex-1 sm:px-6"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                disabled={
                                    !generateForm.type ||
                                    !generateForm.period ||
                                    isSubmitting
                                }
                                className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition active:scale-95 sm:flex-1 sm:px-6 ${
                                    !generateForm.type ||
                                    !generateForm.period ||
                                    isSubmitting
                                        ? "cursor-not-allowed bg-[#8E98A8] text-white"
                                        : "bg-[#6E43A3] text-white hover:opacity-90"
                                }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
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
                                        Generating...
                                    </span>
                                ) : (
                                    "Generate"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center sm:p-8">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D6F5DA]">
                            <CheckCircle size={32} className="text-[#267F50]" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-[#1F083B] sm:text-2xl">
                            Report Generated Successfully
                        </h3>
                        <p className="mb-6 text-sm text-[#5B646F]">
                            Your report has been generated successfully and is
                            ready to view, download, or share.
                        </p>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full rounded-xl bg-[#6E43A3] px-6 py-3 text-white transition hover:opacity-90"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </DashSidebar>
    );
};

export default FleetReports;
