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
    AlertCircle,
    Search,
    Truck,
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
            <div className="p-4 sm:p-6 md:p-8">
                {/* Header */}
                <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-4 sm:mb-6">
                    <button
                        onClick={() => navigate("/fleet/dashboard")}
                        className="flex items-center gap-2 rounded-lg p-2 transition hover:bg-[#F8F8F8]"
                    >
                        <ArrowLeft size={20} className="text-[#6E43A3]" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-[#1F083B] sm:text-2xl">
                            Live Tracking
                        </h1>
                        <p className="text-xs text-[#8E98A8] sm:text-sm">
                            Real-time vehicle positions and trip monitoring
                        </p>
                    </div>
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:flex sm:gap-4">
                    <div className="sm:flex-1">
                        <StatCard
                            title="Total Trips"
                            value={stats.totalTrips}
                            icon={Truck}
                            color="#6E43A3"
                        />
                    </div>
                    <div className="sm:flex-1">
                        <StatCard
                            title="Active Trips"
                            value={stats.activeTrips}
                            icon={Activity}
                            color="#2E7D32"
                        />
                    </div>
                    <div className="sm:flex-1">
                        <StatCard
                            title="Total Distance"
                            value={`${stats.totalDistance} km`}
                            icon={Navigation}
                            color="#1565C0"
                        />
                    </div>
                    <div className="sm:flex-1">
                        <StatCard
                            title="Avg Duration"
                            value={formatDuration(stats.avgDuration)}
                            icon={Clock}
                            color="#F2A618"
                        />
                    </div>
                </div>

                {/* Main Content - Responsive Columns */}
                <div className="flex flex-col gap-4 lg:flex-row">
                    {/* Left Column - Trips List */}
                    <div className="w-full lg:w-[320px] lg:flex-shrink-0">
                        <div className="flex h-[400px] flex-col rounded-xl border border-[#F3F4F6] bg-white p-3 shadow-sm sm:h-[500px] sm:p-4 lg:h-[600px]">
                            <div className="mb-2 flex items-center justify-between sm:mb-3">
                                <h3 className="text-sm font-semibold text-[#1F083B]">
                                    All Trips
                                </h3>
                                <span className="text-xs text-[#8E98A8]">
                                    {filteredTrips.length} trips
                                </span>
                            </div>

                            {/* Search */}
                            <div className="relative mb-2 sm:mb-3">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E98A8]"
                                />
                                <input
                                    type="text"
                                    placeholder="Search trips..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-[#E0E5EB] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6E43A3]"
                                />
                            </div>

                            {/* Trips List */}
                            <div className="flex-1 space-y-2 overflow-y-auto">
                                {filteredTrips.slice(0, 20).map((trip) => {
                                    const isActive =
                                        trip.tripStatus === "in_progress" ||
                                        trip.tripStatus === "active";
                                    return (
                                        <div
                                            key={trip.id || trip.tripNumber}
                                            className={`cursor-pointer rounded-lg border p-2 transition hover:border-[#6E43A3] sm:p-3 ${
                                                selectedTrip?.id === trip.id
                                                    ? "border-[#6E43A3] bg-[#6E43A310]"
                                                    : "border-[#F3F4F6]"
                                            }`}
                                            onClick={() =>
                                                setSelectedTrip(trip)
                                            }
                                        >
                                            <div className="flex items-start justify-between">
                                                <span className="text-xs font-medium text-[#1F083B] sm:text-sm">
                                                    {trip.tripNumber ||
                                                        `TR-${trip.id?.slice(0, 6)}`}
                                                </span>
                                                <span
                                                    className={`rounded-full px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-0.5 sm:text-xs ${getStatusColor(trip.tripStatus)}`}
                                                >
                                                    {getStatusDisplay(
                                                        trip.tripStatus,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <User
                                                    size={12}
                                                    className="text-[#8E98A8]"
                                                />
                                                <span className="text-xs text-[#8E98A8]">
                                                    {trip.driver?.name ||
                                                        "Unknown"}
                                                </span>
                                            </div>
                                            <div className="mt-0.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Car
                                                        size={12}
                                                        className="text-[#8E98A8]"
                                                    />
                                                    <span className="text-xs text-[#8E98A8]">
                                                        {trip.vehicle
                                                            ?.registrationNumber ||
                                                            "No Vehicle"}
                                                    </span>
                                                </div>
                                                {trip.stats?.hazardsReported >
                                                    0 && (
                                                    <span className="flex items-center gap-1 text-xs text-[#F2A618]">
                                                        <AlertTriangle
                                                            size={12}
                                                        />
                                                        {
                                                            trip.stats
                                                                .hazardsReported
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredTrips.length === 0 && (
                                    <p className="py-4 text-center text-sm text-[#8E98A8]">
                                        No trips found
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Map */}
                    <div className="flex-1">
                        {/* Status Bar */}
                        <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-3 sm:gap-3">
                            <span className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2E7D32] sm:h-2 sm:w-2"></span>
                                <span className="text-xs font-medium text-[#2E7D32] sm:text-sm">
                                    Live
                                </span>
                            </span>
                            <span className="text-xs text-[#8E98A8] sm:text-sm">
                                {
                                    driverLocations.filter((d) => d.isActive)
                                        .length
                                }{" "}
                                drivers online
                            </span>
                        </div>

                        {/* Map Container */}
                        <div className="relative h-[400px] overflow-hidden rounded-xl border border-[#F3F4F6] bg-white shadow-sm sm:h-[500px] lg:h-[600px]">
                            {/* Map */}
                            <div ref={mapRef} className="h-full w-full" />

                            {/* Map Overlay Info - Hazards */}
                            <div className="absolute right-2 top-2 z-10 max-h-[150px] max-w-[160px] overflow-y-auto rounded-lg border border-[#F3F4F6] bg-white p-2 shadow-md sm:right-4 sm:top-4 sm:max-h-[200px] sm:max-w-[200px] sm:p-3">
                                <div className="mb-1 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
                                    <AlertTriangle
                                        size={14}
                                        className="text-[#F2A618]"
                                    />
                                    <span className="text-xs font-medium text-[#1F083B]">
                                        Nearby Hazards
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {hazards.slice(0, 4).map((hazard) => (
                                        <div
                                            key={hazard.id}
                                            className="flex items-center gap-1 text-xs"
                                        >
                                            {getTypeIcon(hazard.type)}
                                            <span className="max-w-[60px] truncate text-[#8E98A8] sm:max-w-[100px]">
                                                {hazard.description?.slice(
                                                    0,
                                                    20,
                                                ) || hazard.type}
                                                ...
                                            </span>
                                            <span
                                                className={`rounded px-1 py-0.5 text-[8px] sm:px-1.5 sm:text-[10px] ${getSeverityColor(hazard.severity)}`}
                                            >
                                                {hazard.severity}
                                            </span>
                                        </div>
                                    ))}
                                    {hazards.length === 0 && (
                                        <span className="text-xs text-[#8E98A8]">
                                            No hazards nearby
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Selected Trip Details - Bottom */}
                            {selectedTrip && (
                                <div className="absolute bottom-2 left-2 right-2 rounded-xl border border-[#F3F4F6] bg-white p-3 shadow-lg sm:bottom-4 sm:left-4 sm:right-4 sm:p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-[#1F083B]">
                                                    {selectedTrip.tripNumber ||
                                                        `TR-${selectedTrip.id?.slice(0, 6)}`}
                                                </span>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(selectedTrip.tripStatus)}`}
                                                >
                                                    {getStatusDisplay(
                                                        selectedTrip.tripStatus,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-4">
                                                <span className="text-xs text-[#8E98A8] sm:text-sm">
                                                    {selectedTrip.driver
                                                        ?.name ||
                                                        "Unknown Driver"}
                                                </span>
                                                <span className="text-xs text-[#8E98A8]">
                                                    {selectedTrip.vehicle
                                                        ?.registrationNumber ||
                                                        "No Vehicle"}
                                                </span>
                                                <span className="text-xs text-[#8E98A8]">
                                                    {selectedTrip.vehicle?.make}{" "}
                                                    {
                                                        selectedTrip.vehicle
                                                            ?.model
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                            <div className="text-right">
                                                <div className="text-xs text-[#8E98A8]">
                                                    Duration
                                                </div>
                                                <div className="text-sm font-medium text-[#1F083B]">
                                                    {formatDuration(
                                                        selectedTrip.stats
                                                            ?.duration || 0,
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-[#8E98A8]">
                                                    Distance
                                                </div>
                                                <div className="text-sm font-medium text-[#1F083B]">
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
