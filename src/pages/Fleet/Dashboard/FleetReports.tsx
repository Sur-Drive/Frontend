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
            <div className="p-8">
                {/* Header */}
                <div className="bg-white rounded-xl p-6">
                    <div>
                        <h1
                            className="text-2xl font-bold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Reports
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className="text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Fleet performance, safety and compliance
                                insights
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4 flex-wrap mt-6">
                    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                            <Activity size={18} className="text-[#6E43A3]" />
                            <span className="text-sm font-medium">Trips</span>
                        </div>
                        <div className="text-3xl font-bold text-[#6E43A3]">
                            {stats.totalTrips}
                        </div>
                        <div className="text-xs text-[#8E98A8] mt-1">
                            Total trips
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                            <TrendingUp size={18} className="text-[#00BC7B]" />
                            <span className="text-sm font-medium">
                                Distance (km)
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-[#00BC7B]">
                            {stats.totalDistance.toFixed(1)}
                        </div>
                        <div className="text-xs text-[#8E98A8] mt-1">
                            Total distance covered
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                            <CheckCircle size={18} className="text-[#2E7D32]" />
                            <span className="text-sm font-medium">
                                Avg Safety
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-[#2E7D32]">
                            {stats.avgSafetyScore}
                        </div>
                        <div className="text-xs text-[#8E98A8] mt-1">
                            Average safety score
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                            <AlertTriangle
                                size={18}
                                className="text-[#FE3F21]"
                            />
                            <span className="text-sm font-medium">
                                SOS this month
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-[#FE3F21]">
                            {stats.sosCount}
                        </div>
                        <div className="text-xs text-[#8E98A8] mt-1">
                            SOS alerts
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 flex flex-col flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 text-[#6F6C8F] mb-2">
                            <AlertTriangle
                                size={18}
                                className="text-[#F2A618]"
                            />
                            <span className="text-sm font-medium">Hazards</span>
                        </div>
                        <div className="text-3xl font-bold text-[#F2A618]">
                            {stats.hazardCount}
                        </div>
                        <div className="text-xs text-[#8E98A8] mt-1">
                            Hazards reported
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-xl p-6 mt-6">
                    <h3
                        className="text-lg font-semibold text-[#1F083B] mb-4"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Trips & Alerts Rate
                    </h3>
                    <div className="relative h-[350px] rounded-lg border border-[#E5E7EB] p-4 overflow-hidden">
                        {/* Legend */}
                        <div className="flex items-center justify-center gap-8 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#00BC7B]"></div>
                                <span
                                    className="text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Trips
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#F2A618]"></div>
                                <span
                                    className="text-sm text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Alerts
                                </span>
                            </div>
                        </div>

                        {/* Chart Container */}
                        <div className="relative h-[270px] w-full">
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
                                    Math.round(baseTrips * 0.4 * 10) / 10, // Jan ~3.2
                                    Math.round(baseTrips * 0.5 * 10) / 10, // Feb ~4.0
                                    Math.round(baseTrips * 0.65 * 10) / 10, // Mar ~5.2
                                    Math.round(baseTrips * 0.45 * 10) / 10, // Apr ~3.6
                                    Math.round(baseTrips * 0.75 * 10) / 10, // May ~6.0
                                    Math.round(baseTrips * 0.6 * 10) / 10, // Jun ~4.8
                                    baseTrips, // Jul - current month (5-10)
                                    Math.round(baseTrips * 0.7 * 10) / 10, // Aug ~5.6
                                    Math.round(baseTrips * 0.85 * 10) / 10, // Sep ~6.8
                                    Math.round(baseTrips * 0.55 * 10) / 10, // Oct ~4.4
                                    Math.round(baseTrips * 0.45 * 10) / 10, // Nov ~3.6
                                    Math.round(baseTrips * 0.9 * 10) / 10, // Dec ~7.2
                                ];

                                // Scale down alerts - keep between 0 and 10
                                const baseAlerts = Math.min(
                                    stats.hazardCount || 5,
                                    10,
                                );
                                const alertData = [
                                    Math.round(baseAlerts * 0.35 * 10) / 10, // Jan ~1.8
                                    Math.round(baseAlerts * 0.55 * 10) / 10, // Feb ~2.8
                                    Math.round(baseAlerts * 0.75 * 10) / 10, // Mar ~3.8
                                    Math.round(baseAlerts * 0.3 * 10) / 10, // Apr ~1.5
                                    Math.round(baseAlerts * 0.9 * 10) / 10, // May ~4.5
                                    Math.round(baseAlerts * 0.6 * 10) / 10, // Jun ~3.0
                                    baseAlerts, // Jul - current month (3-10)
                                    Math.round(baseAlerts * 0.7 * 10) / 10, // Aug ~3.5
                                    Math.round(baseAlerts * 0.85 * 10) / 10, // Sep ~4.3
                                    Math.round(baseAlerts * 0.45 * 10) / 10, // Oct ~2.3
                                    Math.round(baseAlerts * 0.3 * 10) / 10, // Nov ~1.5
                                    Math.round(baseAlerts * 1.1 * 10) / 10, // Dec ~5.5
                                ];

                                // Calculate max value - round up to nearest 1
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

                                // Y-axis values (0 to maxValue)
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

                                // Get hover data
                                const hoverIndex =
                                    hoveredIndex !== null
                                        ? hoveredIndex
                                        : tripData.length - 1;
                                const month = months[hoverIndex];
                                const year = years[hoverIndex];
                                const tripValue = tripData[hoverIndex];
                                const alertValue = alertData[hoverIndex];

                                return (
                                    <svg
                                        className="w-full h-full"
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

                                        {/* Invisible hover areas for each data point */}
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

                                        {/* Data Points */}
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

                                        {/* Tooltip - Only show when hovered */}
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
                        <div className="flex items-center justify-center gap-6 mt-1 text-xs text-[#8E98A8]">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-16 h-2 rounded"
                                    style={{
                                        background:
                                            "linear-gradient(to right, #00BC7B00, #00BC7B)",
                                    }}
                                ></div>
                                <span>Trips</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-16 h-2 rounded"
                                    style={{
                                        background:
                                            "linear-gradient(to right, #F2A61800, #F2A618)",
                                    }}
                                ></div>
                                <span>Alerts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reports Table Section */}
                <div className="bg-white rounded-xl p-6 mt-6">
                    {/* Table Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2
                            className="text-lg font-semibold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Generated Reports ({totalItems})
                        </h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowGenerateModal(true)}
                                className="bg-[#6E43A3] text-white px-6 py-2.5 rounded-xl hover:opacity-90 transition flex items-center gap-2"
                                style={{ fontFamily: "Outfit" }}
                            >
                                <Plus size={20} />
                                Generate Report
                            </button>
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E98A8]"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
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
                                    value={selectedType}
                                    onChange={(e) =>
                                        setSelectedType(e.target.value)
                                    }
                                    className="bg-[#F8F8F8] px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
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

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#E0E5EB]">
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Report
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Type/Size
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Period
                                    </th>
                                    <th
                                        className="text-left py-3 text-sm text-[#8E98A8] font-medium"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Generated
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
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            Loading reports...
                                        </td>
                                    </tr>
                                ) : currentReports.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-8 text-[#8E98A8]"
                                        >
                                            No reports found
                                        </td>
                                    </tr>
                                ) : (
                                    currentReports.map((report) => (
                                        <tr
                                            key={report.id}
                                            className="border-b border-[#E0E5EB] hover:bg-[#F7F7F7] transition"
                                        >
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#6E43A310] flex items-center justify-center">
                                                        <FileText
                                                            size={18}
                                                            className="text-[#6E43A3]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div
                                                            className="text-sm font-medium text-[#111827]"
                                                            style={{
                                                                fontFamily:
                                                                    "Outfit",
                                                            }}
                                                        >
                                                            {
                                                                report.reportNumber
                                                            }
                                                        </div>
                                                        <div
                                                            className="text-xs text-[#8E98A8]"
                                                            style={{
                                                                fontFamily:
                                                                    "Outfit",
                                                            }}
                                                        >
                                                            {getTypeDisplay(
                                                                report.type,
                                                            )}
                                                        </div>
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
                                                        {getTypeDisplay(
                                                            report.type,
                                                        )}
                                                    </div>
                                                    <div
                                                        className="text-xs text-[#8E98A8]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {formatFileSize(
                                                            report.fileSize,
                                                        )}
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
                                                        {getPeriodDisplay(
                                                            report.period,
                                                        )}
                                                    </div>
                                                    <div
                                                        className="text-xs text-[#8E98A8]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
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
                                            <td className="py-3">
                                                <div>
                                                    <div
                                                        className="text-sm text-[#111827]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {formatDateTime(
                                                            report.generatedAt,
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(report.status)}`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {getStatusDisplay(
                                                        report.status,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        handleDownload(
                                                            report.id,
                                                        )
                                                    }
                                                    className="p-1.5 text-[#6E43A3] hover:bg-[#F8F8F8] rounded-lg transition"
                                                    title="Download"
                                                >
                                                    <Download size={18} />
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

            {/* Generate Report Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2
                                    className="text-2xl font-bold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Generate a new report
                                </h2>
                                <p
                                    className="text-[#5B646F] text-sm mt-1"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    Choose a report type and time period.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowGenerateModal(false);
                                    setGenerateForm({ type: "", period: "" });
                                }}
                                className="text-[#5B646F] hover:text-[#1F083B] transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
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
                                    className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                                    style={{ fontFamily: "Outfit" }}
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
                                <label className="block text-sm font-medium text-[#5B646F] mb-1.5">
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
                                    className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                                    style={{ fontFamily: "Outfit" }}
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

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowGenerateModal(false);
                                    setGenerateForm({ type: "", period: "" });
                                }}
                                className="flex-1 px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                                style={{ fontFamily: "Outfit" }}
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
                                className={`flex-1 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:cursor-not-allowed ${
                                    !generateForm.type ||
                                    !generateForm.period ||
                                    isSubmitting
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
                                        Generating...
                                    </>
                                ) : (
                                    <>Generate</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
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
                            Report Generated Successfully
                        </h3>
                        <p
                            className="text-[#5B646F] mb-6"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Your report has been generated successfully and is
                            ready to view, download, or share.
                        </p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                            }}
                            className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                            style={{ fontFamily: "Outfit" }}
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
