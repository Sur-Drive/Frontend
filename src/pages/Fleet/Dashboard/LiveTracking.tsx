// src/pages/Fleet/LiveTracking/LiveTracking.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Clock,
    Car,
    User,
    MapPin,
    AlertTriangle,
    Activity,
    Navigation,
    Circle,
    AlertCircle,
    Search,
    Truck,
    Users,
    TrendingUp,
    Eye,
} from "lucide-react";
import DashSidebar from "../Dashboard/DashSidebar";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface DriverLocation {
    driverId: string;
    driverName: string;
    latitude: string;
    longitude: string;
    lastUpdated: string;
    isActive: boolean;
    speed: number;
    tripNumber?: string;
    vehicleId?: string;
    vehicleRegistration?: string;
    vehicleMake?: string;
    vehicleModel?: string;
}

interface Hazard {
    id: string;
    type: string;
    description: string;
    photoUrl: string | null;
    location: {
        latitude: string;
        longitude: string;
        address: string;
    };
    severity: "LOW" | "MEDIUM" | "HIGH";
    isAnonymous: boolean;
    isResolved: boolean;
    isActive: boolean;
    createdAt: string;
    expiresAt: string;
    driver: {
        id: string;
        name: string;
    } | null;
    confirmations: {
        confirms: number;
        incorrects: number;
        userConfirmation: string | null;
    };
}

interface TripStats {
    duration: number;
    distance: number;
    hazardsReported: number;
    sosAlerts: number;
}

interface ActiveTrip {
    id: string;
    tripNumber: string;
    driver: {
        id: string;
        name: string;
    };
    vehicle: {
        id: string;
        registrationNumber: string;
        make: string;
        model: string;
    };
    loginLocation?: string;
    logoutLocation?: string;
    tripStatus?: string;
    stats: TripStats;
}

interface TripStatsCard {
    totalTrips: number;
    activeTrips: number;
    totalDistance: number;
    avgDuration: number;
}

const LiveTracking: React.FC = () => {
    const navigate = useNavigate();
    const mapRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [driverLocations, setDriverLocations] = useState<DriverLocation[]>(
        [],
    );
    const [allTrips, setAllTrips] = useState<ActiveTrip[]>([]);
    const [filteredTrips, setFilteredTrips] = useState<ActiveTrip[]>([]);
    const [hazards, setHazards] = useState<Hazard[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<ActiveTrip | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [mapLoaded, setMapLoaded] = useState(false);
    const [stats, setStats] = useState<TripStatsCard>({
        totalTrips: 0,
        activeTrips: 0,
        totalDistance: 0,
        avgDuration: 0,
    });
    const [userLocation, setUserLocation] = useState<{
        lat: number;
        lng: number;
    }>({
        lat: 6.5244,
        lng: 3.3792,
    });

    // Load Google Maps
    useEffect(() => {
        const loadGoogleMaps = () => {
            if (
                document.querySelector(
                    'script[src*="maps.googleapis.com/maps/api/js"]',
                )
            ) {
                setMapLoaded(true);
                return;
            }

            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBDP1OkEz7QEDw0DErvaCPZ7kWhe6yTR_M&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => setMapLoaded(true);
            document.head.appendChild(script);
        };

        loadGoogleMaps();
    }, []);

    // Initialize map when loaded
    useEffect(() => {
        if (mapLoaded && mapRef.current && window.google) {
            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat: userLocation.lat, lng: userLocation.lng },
                zoom: 12,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }],
                    },
                ],
            });

            // Add markers for drivers
            driverLocations.forEach((driver) => {
                if (driver.isActive && driver.latitude && driver.longitude) {
                    const marker = new window.google.maps.Marker({
                        position: {
                            lat: parseFloat(driver.latitude),
                            lng: parseFloat(driver.longitude),
                        },
                        map: map,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: "#6E43A3",
                            fillOpacity: 1,
                            strokeColor: "#FFFFFF",
                            strokeWeight: 2,
                            scale: 8,
                        },
                        title: `${driver.driverName} - ${driver.vehicleRegistration || "No Vehicle"}`,
                    });

                    // Info window
                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div style="font-family: Outfit, sans-serif; padding: 4px;">
                                <div style="font-weight: 600; color: #1F083B;">${driver.driverName}</div>
                                <div style="font-size: 12px; color: #8E98A8;">${driver.vehicleRegistration || "No Vehicle"}</div>
                                ${driver.tripNumber ? `<div style="font-size: 12px; color: #6E43A3;">${driver.tripNumber}</div>` : ""}
                                <div style="font-size: 12px; color: #8E98A8;">${driver.speed > 0 ? `${driver.speed} km/h` : "Idle"}</div>
                            </div>
                        `,
                    });

                    marker.addListener("click", () => {
                        infoWindow.open(map, marker);
                    });
                }
            });

            // Add hazard markers
            hazards.forEach((hazard) => {
                if (hazard.location?.latitude && hazard.location?.longitude) {
                    const colors = {
                        HIGH: "#FE3F21",
                        MEDIUM: "#F2A618",
                        LOW: "#2E7D32",
                    };

                    const marker = new window.google.maps.Marker({
                        position: {
                            lat: parseFloat(hazard.location.latitude),
                            lng: parseFloat(hazard.location.longitude),
                        },
                        map: map,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor:
                                colors[
                                    hazard.severity as keyof typeof colors
                                ] || "#F2A618",
                            fillOpacity: 1,
                            strokeColor: "#FFFFFF",
                            strokeWeight: 2,
                            scale: 6,
                        },
                        title: `${hazard.type} - ${hazard.severity}`,
                    });

                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div style="font-family: Outfit, sans-serif; padding: 4px; max-width: 200px;">
                                <div style="font-weight: 600; color: #1F083B;">${hazard.type}</div>
                                <div style="font-size: 12px; color: #5B646F;">${hazard.description}</div>
                                <div style="font-size: 12px; color: #8E98A8;">${hazard.location.address || ""}</div>
                                <div style="font-size: 12px; font-weight: 500; color: ${colors[hazard.severity as keyof typeof colors]};">
                                    ${hazard.severity}
                                </div>
                            </div>
                        `,
                    });

                    marker.addListener("click", () => {
                        infoWindow.open(map, marker);
                    });
                }
            });

            // Fit bounds to show all markers
            const bounds = new window.google.maps.LatLngBounds();
            let hasMarkers = false;

            driverLocations.forEach((driver) => {
                if (driver.isActive && driver.latitude && driver.longitude) {
                    bounds.extend({
                        lat: parseFloat(driver.latitude),
                        lng: parseFloat(driver.longitude),
                    });
                    hasMarkers = true;
                }
            });

            hazards.forEach((hazard) => {
                if (hazard.location?.latitude && hazard.location?.longitude) {
                    bounds.extend({
                        lat: parseFloat(hazard.location.latitude),
                        lng: parseFloat(hazard.location.longitude),
                    });
                    hasMarkers = true;
                }
            });

            if (hasMarkers) {
                map.fitBounds(bounds);
                map.setZoom(12);
            }
        }
    }, [mapLoaded, driverLocations, hazards, userLocation]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredTrips(allTrips);
        } else {
            const filtered = allTrips.filter(
                (trip) =>
                    trip.tripNumber
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    trip.driver?.name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    trip.vehicle?.registrationNumber
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            );
            setFilteredTrips(filtered);
        }
    }, [searchTerm, allTrips]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");

            // Fetch all trips
            const tripsRes = await fetch(`${API_BASE}/sessions/trips`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (tripsRes.ok) {
                const data = await tripsRes.json();
                const items = data.items || [];
                setAllTrips(items);
                setFilteredTrips(items);

                // Calculate stats
                const total = items.length;
                const active = items.filter(
                    (t: any) =>
                        t.tripStatus === "in_progress" ||
                        t.tripStatus === "active",
                ).length;
                let totalDistance = 0;
                let totalDuration = 0;
                items.forEach((t: any) => {
                    totalDistance += parseFloat(t.stats?.totalDistance || 0);
                    totalDuration += t.stats?.totalDuration || 0;
                });

                setStats({
                    totalTrips: total,
                    activeTrips: active,
                    totalDistance: Math.round(totalDistance * 10) / 10,
                    avgDuration:
                        total > 0 ? Math.round(totalDuration / total) : 0,
                });
            }

            // Fetch driver locations
            const driversRes = await fetch(
                `${API_BASE}/sessions/drivers/locations`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (driversRes.ok) {
                const driversData = await driversRes.json();
                setDriverLocations(driversData.drivers || []);
            }

            // Fetch hazards
            const hazardsRes = await fetch(
                `${API_BASE}/hazards/nearby?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=30`,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (hazardsRes.ok) {
                const hazardsData = await hazardsRes.json();
                setHazards(Array.isArray(hazardsData) ? hazardsData : []);
            }
        } catch (error) {
            console.error("Error fetching live tracking data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "HIGH":
                return "text-[#FE3F21] bg-[#FE3F2124]";
            case "MEDIUM":
                return "text-[#F2A618] bg-[#F2A61824]";
            case "LOW":
                return "text-[#2E7D32] bg-[#2E7D3224]";
            default:
                return "text-[#8E98A8] bg-gray-100";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "FLOOD":
                return <AlertTriangle size={14} className="text-[#1565C0]" />;
            case "DANGER":
                return <AlertCircle size={14} className="text-[#FE3F21]" />;
            case "DEBRIS":
                return <AlertTriangle size={14} className="text-[#F2A618]" />;
            case "CHECKPOINT":
                return <MapPin size={14} className="text-[#6E43A3]" />;
            default:
                return <AlertTriangle size={14} className="text-[#8E98A8]" />;
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return "00:00:00";
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const getStatusDisplay = (status?: string) => {
        if (status === "in_progress" || status === "active") return "Active";
        return "Completed";
    };

    const getStatusColor = (status?: string) => {
        if (status === "in_progress" || status === "active") {
            return "text-[#2E7D32] bg-[#2E7D3224]";
        }
        return "text-[#8E98A8] bg-gray-100";
    };

    const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#F3F4F6] flex-1">
            <div className="flex items-center justify-between">
                <div>
                    <p
                        className="text-xs font-medium text-[#8E98A8]"
                        style={{ fontFamily: "Outfit" }}
                    >
                        {title}
                    </p>
                    <p
                        className="text-2xl font-bold text-[#1F083B] mt-1"
                        style={{ fontFamily: "Outfit" }}
                    >
                        {value}
                    </p>
                    {subtext && (
                        <p
                            className="text-[10px] text-[#8E98A8] mt-0.5"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {subtext}
                        </p>
                    )}
                </div>
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon size={20} style={{ color }} />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <DashSidebar>
                <div className="flex items-center justify-center min-h-[600px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E43A3] mx-auto" />
                        <p
                            className="mt-4 text-[#8E98A8]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Loading live tracking...
                        </p>
                    </div>
                </div>
            </DashSidebar>
        );
    }

    return (
        <DashSidebar>
            <div className="p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate("/fleet/dashboard")}
                        className="p-2 hover:bg-[#F8F8F8] rounded-lg transition flex items-center gap-2"
                    >
                        <ArrowLeft size={20} className="text-[#6E43A3]" />
                    </button>
                    <div className="flex-1">
                        <h1
                            className="text-2xl font-bold text-[#1F083B]"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Live Tracking
                        </h1>
                        <p
                            className="text-[#8E98A8] text-sm"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Real-time vehicle positions and trip monitoring
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4 mb-6">
                    <StatCard
                        title="Total Trips"
                        value={stats.totalTrips}
                        icon={Truck}
                        color="#6E43A3"
                    />
                    <StatCard
                        title="Active Trips"
                        value={stats.activeTrips}
                        icon={Activity}
                        color="#2E7D32"
                        subtext={`${Math.round((stats.activeTrips / stats.totalTrips) * 100) || 0}% of total`}
                    />
                    <StatCard
                        title="Total Distance"
                        value={`${stats.totalDistance} km`}
                        icon={Navigation}
                        color="#1565C0"
                    />
                    <StatCard
                        title="Avg Duration"
                        value={formatDuration(stats.avgDuration)}
                        icon={Clock}
                        color="#F2A618"
                    />
                </div>

                {/* Main Content */}
                <div className="flex gap-4">
                    {/* Left Column - Trips List */}
                    <div className="w-[320px] flex-shrink-0">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#F3F4F6] h-[600px] flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h3
                                    className="text-sm font-semibold text-[#1F083B]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    All Trips
                                </h3>
                                <span
                                    className="text-xs text-[#8E98A8]"
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {filteredTrips.length} trips
                                </span>
                            </div>

                            {/* Search */}
                            <div className="relative mb-3">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E98A8]"
                                />
                                <input
                                    type="text"
                                    placeholder="Search by trip, driver, vehicle..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E0E5EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                    style={{ fontFamily: "Outfit" }}
                                />
                            </div>

                            {/* Trips List */}
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {filteredTrips.slice(0, 20).map((trip) => {
                                    const isActive =
                                        trip.tripStatus === "in_progress" ||
                                        trip.tripStatus === "active";
                                    return (
                                        <div
                                            key={trip.id || trip.tripNumber}
                                            className={`p-3 rounded-lg border transition cursor-pointer hover:border-[#6E43A3] ${
                                                selectedTrip?.id === trip.id
                                                    ? "border-[#6E43A3] bg-[#6E43A310]"
                                                    : "border-[#F3F4F6]"
                                            }`}
                                            onClick={() =>
                                                setSelectedTrip(trip)
                                            }
                                        >
                                            <div className="flex justify-between items-start">
                                                <span
                                                    className="text-sm font-medium text-[#1F083B]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {trip.tripNumber ||
                                                        `TR-${trip.id?.slice(0, 6)}`}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(trip.tripStatus)}`}
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {getStatusDisplay(
                                                        trip.tripStatus,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <User
                                                    size={12}
                                                    className="text-[#8E98A8]"
                                                />
                                                <span
                                                    className="text-xs text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {trip.driver?.name ||
                                                        "Unknown"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Car
                                                        size={12}
                                                        className="text-[#8E98A8]"
                                                    />
                                                    <span
                                                        className="text-xs text-[#8E98A8]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        {trip.vehicle
                                                            ?.registrationNumber ||
                                                            "No Vehicle"}
                                                    </span>
                                                </div>
                                                {trip.stats?.hazardsReported >
                                                    0 && (
                                                    <span
                                                        className="flex items-center gap-1 text-xs text-[#F2A618]"
                                                        style={{
                                                            fontFamily:
                                                                "Outfit",
                                                        }}
                                                    >
                                                        <AlertTriangle
                                                            size={12}
                                                        />
                                                        {
                                                            trip.stats
                                                                .hazardsReported
                                                        }{" "}
                                                        hazard
                                                        {trip.stats
                                                            .hazardsReported > 1
                                                            ? "s"
                                                            : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredTrips.length === 0 && (
                                    <p
                                        className="text-center text-[#8E98A8] py-8 text-sm"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        No trips found
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Map */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
                            <span
                                className="text-sm font-medium text-[#2E7D32]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Live
                            </span>
                            <span
                                className="text-xs text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                {
                                    driverLocations.filter((d) => d.isActive)
                                        .length
                                }{" "}
                                drivers online
                            </span>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-[#F3F4F6] h-[600px] overflow-hidden relative">
                            {/* Map */}
                            <div ref={mapRef} className="w-full h-full" />

                            {/* Map Overlay Info */}
                            <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-3 max-w-[200px] max-h-[200px] overflow-y-auto border border-[#F3F4F6]">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle
                                        size={14}
                                        className="text-[#F2A618]"
                                    />
                                    <span
                                        className="text-xs font-medium text-[#1F083B]"
                                        style={{ fontFamily: "Outfit" }}
                                    >
                                        Nearby Hazards
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    {hazards.slice(0, 4).map((hazard) => (
                                        <div
                                            key={hazard.id}
                                            className="flex items-center gap-1.5 text-xs"
                                        >
                                            {getTypeIcon(hazard.type)}
                                            <span
                                                className="text-[#8E98A8] truncate max-w-[100px]"
                                                style={{ fontFamily: "Outfit" }}
                                            >
                                                {hazard.description?.slice(
                                                    0,
                                                    20,
                                                ) || hazard.type}
                                                ...
                                            </span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded ${getSeverityColor(hazard.severity)}`}
                                            >
                                                {hazard.severity}
                                            </span>
                                        </div>
                                    ))}
                                    {hazards.length === 0 && (
                                        <span
                                            className="text-xs text-[#8E98A8]"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            No hazards nearby
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Selected Trip Details - Bottom */}
                            {selectedTrip && (
                                <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-[#F3F4F6]">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-sm font-semibold text-[#1F083B]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {selectedTrip.tripNumber ||
                                                        `TR-${selectedTrip.id?.slice(0, 6)}`}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedTrip.tripStatus)}`}
                                                >
                                                    {getStatusDisplay(
                                                        selectedTrip.tripStatus,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span
                                                    className="text-sm text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {selectedTrip.driver
                                                        ?.name ||
                                                        "Unknown Driver"}
                                                </span>
                                                <span
                                                    className="text-xs text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {selectedTrip.vehicle
                                                        ?.registrationNumber ||
                                                        "No Vehicle"}
                                                </span>
                                                <span
                                                    className="text-xs text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {selectedTrip.vehicle?.make}{" "}
                                                    {
                                                        selectedTrip.vehicle
                                                            ?.model
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div
                                                    className="text-xs text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    Duration
                                                </div>
                                                <div
                                                    className="text-sm font-medium text-[#1F083B]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {formatDuration(
                                                        selectedTrip.stats
                                                            ?.duration || 0,
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className="text-xs text-[#8E98A8]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    Distance
                                                </div>
                                                <div
                                                    className="text-sm font-medium text-[#1F083B]"
                                                    style={{
                                                        fontFamily: "Outfit",
                                                    }}
                                                >
                                                    {selectedTrip.stats
                                                        ?.distance || 0}{" "}
                                                    km
                                                </div>
                                            </div>
                                            {selectedTrip.stats
                                                ?.hazardsReported > 0 && (
                                                <div className="flex items-center gap-1 text-[#F2A618]">
                                                    <AlertTriangle size={16} />
                                                    <span className="text-sm font-medium">
                                                        {
                                                            selectedTrip.stats
                                                                .hazardsReported
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashSidebar>
    );
};

export default LiveTracking;
