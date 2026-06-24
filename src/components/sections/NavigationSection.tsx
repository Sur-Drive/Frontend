import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export const NavigationSection: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize map
        const map = L.map(mapRef.current, {
            zoomControl: false,
        }).setView([6.5244, 3.3792], 13);

        // Add tile layer (OpenStreetMap)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        // Standard location marker (no popup)
        L.marker([6.5244, 3.3792]).addTo(map);

        // Add some hazard markers (simulated)
        const hazardLocations = [
            { lat: 6.5344, lng: 3.3892, label: "⚠️ Pothole", color: "red" },
            {
                lat: 6.5144,
                lng: 3.3692,
                label: "🚧 Road Works",
                color: "orange",
            },
            { lat: 6.5444, lng: 3.3592, label: "🌊 Flood Zone", color: "blue" },
            { lat: 6.5044, lng: 3.3992, label: "🚨 Accident", color: "red" },
        ];

        // Custom hazard markers
        hazardLocations.forEach((hazard) => {
            const icon = L.divIcon({
                className: "custom-div-icon",
                html: `<div style="background-color: ${hazard.color === "red" ? "#C62828" : hazard.color === "orange" ? "#E65100" : "#1565C0"}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
            });

            L.marker([hazard.lat, hazard.lng], { icon }).addTo(map);
        });

        // Add a route line (simulated route)
        const routePoints: [number, number][] = [
            [6.5244, 3.3792],
            [6.5344, 3.3892],
            [6.5444, 3.3992],
            [6.5544, 3.4092],
        ];

        L.polyline(routePoints, {
            color: "#4A148C",
            weight: 4,
            opacity: 0.8,
            dashArray: "10, 10",
        }).addTo(map);

        // Add a route line (alternative route)
        const altRoutePoints: [number, number][] = [
            [6.5244, 3.3792],
            [6.5144, 3.3692],
            [6.5044, 3.3592],
            [6.4944, 3.3492],
        ];

        L.polyline(altRoutePoints, {
            color: "#D4AF37",
            weight: 3,
            opacity: 0.6,
            dashArray: "5, 5",
        }).addTo(map);

        // Add a legend
        const legend = new L.Control({ position: "bottomright" });

        legend.onAdd = () => {
            const div = L.DomUtil.create("div", "info legend");
            div.style.backgroundColor = "white";
            div.style.padding = "10px";
            div.style.borderRadius = "8px";
            div.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
            div.style.fontSize = "12px";
            div.style.fontFamily = "DM Sans, sans-serif";
            div.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 6px; color: #1A0033;">Legend</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="display: inline-block; width: 12px; height: 12px; background: #4A148C; border-radius: 4px;"></span>
                    <span style="color: #4A148C;">Main Route</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="display: inline-block; width: 12px; height: 12px; background: #D4AF37; border-radius: 4px;"></span>
                    <span style="color: #D4AF37;">Alt Route</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 12px; height: 12px; background: #C62828; border-radius: 50%;"></span>
                    <span style="color: #333;">Hazards</span>
                </div>
            `;
            return div;
        };

        legend.addTo(map);

        mapInstanceRef.current = map;

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <section
            id="navigation"
            className="py-16 md:py-24 bg-white w-full relative z-0"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-sm font-bold text-gold-500 uppercase tracking-wider">
                            Navigation
                        </span>
                        <h2 className="text-3xl md:text-4xl font-archivo text-purple-900 mt-2">
                            Navigate Smarter. Arrive Safer.
                        </h2>
                        <p className="text-gray-600 mt-4 text-lg">
                            SUR-DRIVE<span className="ht">HT</span> works just
                            like Google Maps — but with real-time hazard
                            intelligence built in.
                        </p>

                        <div className="mt-8 space-y-4">
                            {[
                                {
                                    color: "border-gold-500",
                                    title: "Turn-by-Turn Voice Guidance",
                                    desc: "Spoken directions with hazard warnings along your route.",
                                },
                                {
                                    color: "border-purple-700",
                                    title: "Interactive Map",
                                    desc: "Zoom, pan, and explore with hazard layers and traffic overlay.",
                                },
                                {
                                    color: "border-orange-600",
                                    title: "Live Route Updates",
                                    desc: "Routes adjust automatically based on new hazards and traffic.",
                                },
                                {
                                    color: "border-green-600",
                                    title: "Lane Guidance",
                                    desc: "Know which lane to be in before you get there.",
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.1,
                                    }}
                                    viewport={{ once: true }}
                                    className={`border-l-4 ${item.color} pl-4 py-2 text-left`}
                                >
                                    <p className="font-bold text-purple-900 text-left">
                                        {item.title}
                                    </p>
                                    <p className="text-sm text-gray-600 text-left">
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="bg-purple-100 rounded-3xl p-4 sm:p-6 shadow-xl relative z-0"
                    >
                        <div className="bg-white rounded-2xl p-4 sm:p-6">
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <span className="font-bold text-purple-900 text-left text-sm sm:text-base">
                                    Live Navigation
                                </span>
                                <span className="text-xs font-bold text-green-600 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                    Live
                                </span>
                            </div>

                            {/* Map Container - Larger on mobile */}
                            <div
                                ref={mapRef}
                                className="rounded-xl h-72 sm:h-64 md:h-72 lg:h-80 overflow-hidden border-2 border-purple-100 relative z-0"
                                style={{ minHeight: "280px" }}
                            />

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-purple-100 rounded-xl p-3 text-center">
                                    <span className="font-bold text-purple-900 block text-left text-sm sm:text-base">
                                        12 min
                                    </span>
                                    <p className="text-xs text-gray-600 text-left">
                                        ETA
                                    </p>
                                </div>
                                <div className="bg-purple-100 rounded-xl p-3 text-center">
                                    <span className="font-bold text-green-600 block text-left text-sm sm:text-base">
                                        85%
                                    </span>
                                    <p className="text-xs text-gray-600 text-left">
                                        Safety Score
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
