import React, { useState } from "react";
import { motion } from "framer-motion";

interface ScoutModeProps {
    onModalOpen: () => void;
}

export const ScoutMode: React.FC<ScoutModeProps> = ({ onModalOpen }) => {
    const [selectedRoute, setSelectedRoute] = useState("route1");

    const routes = [
        {
            id: "route1",
            name: "Route A - Main Highway",
            distance: "12.4 km",
            time: "18 min",
            hazards: 3,
            score: 85,
            risk: "Medium",
        },
        {
            id: "route2",
            name: "Route B - City Streets",
            distance: "14.8 km",
            time: "25 min",
            hazards: 1,
            score: 92,
            risk: "Low",
        },
        {
            id: "route3",
            name: "Route C - Scenic Route",
            distance: "18.2 km",
            time: "30 min",
            hazards: 5,
            score: 72,
            risk: "High",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <div className="text-center mb-12">
                        <span className="text-sm font-bold text-gold-500 uppercase tracking-wider">
                            Scout Mode
                        </span>
                        <h1 className="text-4xl md:text-5xl font-archivo text-purple-900 mt-2">
                            Check Your Route Before You Leave
                        </h1>
                        <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
                            Preview any route with safety scores, hazard counts,
                            and risk levels before you start driving.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-3xl mx-auto mb-8"
                    >
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Enter destination or address..."
                                className="flex-1 px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent outline-none text-sm"
                            />
                            <button
                                onClick={onModalOpen}
                                className="px-6 py-4 bg-purple-700 text-white rounded-xl hover:bg-purple-800 transition-all duration-300 font-medium shadow-lg shadow-purple-700/30"
                            >
                                <i className="fas fa-search mr-2"></i>Scout
                            </button>
                        </div>
                    </motion.div>

                    {/* Route Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {routes.map((route, index) => (
                            <motion.div
                                key={route.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                whileHover={{ y: -8 }}
                                onClick={() => setSelectedRoute(route.id)}
                                className={`bg-white rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-300 border-2 ${
                                    selectedRoute === route.id
                                        ? "border-purple-700"
                                        : "border-transparent hover:border-purple-300"
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-purple-900">
                                        {route.name}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            route.risk === "Low"
                                                ? "bg-green-100 text-green-700"
                                                : route.risk === "Medium"
                                                  ? "bg-orange-100 text-orange-700"
                                                  : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {route.risk}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Distance
                                        </span>
                                        <span className="font-medium text-purple-900">
                                            {route.distance}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Est. Time
                                        </span>
                                        <span className="font-medium text-purple-900">
                                            {route.time}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Hazards
                                        </span>
                                        <span className="font-medium text-orange-600">
                                            {route.hazards}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">
                                            Safety Score
                                        </span>
                                        <span
                                            className={`font-bold ${
                                                route.score >= 80
                                                    ? "text-green-600"
                                                    : route.score >= 60
                                                      ? "text-orange-600"
                                                      : "text-red-600"
                                            }`}
                                        >
                                            {route.score}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${route.score}%` }}
                                        transition={{
                                            duration: 1,
                                            delay: 0.5 + index * 0.1,
                                        }}
                                        className={`h-full ${
                                            route.score >= 80
                                                ? "bg-green-600"
                                                : route.score >= 60
                                                  ? "bg-orange-600"
                                                  : "bg-red-600"
                                        } rounded-full`}
                                    />
                                </div>

                                <button
                                    onClick={onModalOpen}
                                    className="w-full mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-700 hover:text-white transition-all duration-300 text-sm font-medium"
                                >
                                    View Details
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Selected Route Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-8 shadow-xl border border-purple-100"
                    >
                        <h3 className="text-xl font-archivo text-purple-900 mb-4">
                            Route Analysis
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center">
                                    <div className="text-center">
                                        <i className="fas fa-map text-4xl text-purple-700"></i>
                                        <p className="text-gray-600 text-sm mt-2">
                                            Interactive Map Preview
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Hazards • Traffic • Route
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-gray-600">
                                        Route Safety Score
                                    </span>
                                    <span className="text-2xl font-archivo text-green-600">
                                        85%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-gray-600">
                                        Hazard Count
                                    </span>
                                    <span className="text-lg font-bold text-orange-600">
                                        3
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-gray-600">
                                        Risk Level
                                    </span>
                                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                        Medium
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-gray-600">
                                        Estimated Arrival
                                    </span>
                                    <span className="text-lg font-bold text-purple-900">
                                        18 min
                                    </span>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={onModalOpen}
                                        className="flex-1 px-4 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all duration-300 font-medium"
                                    >
                                        <i className="fas fa-route mr-2"></i>
                                        Start Navigation
                                    </button>
                                    <button
                                        onClick={onModalOpen}
                                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
                                    >
                                        <i className="fas fa-share-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Hazard Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 bg-white rounded-2xl p-8 shadow-xl border border-purple-100"
                    >
                        <h4 className="font-bold text-purple-900 mb-4">
                            Hazards on Route
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Pothole", color: "bg-yellow-600" },
                                { label: "Road Works", color: "bg-amber-600" },
                                {
                                    label: "Flood Zone",
                                    color: "bg-checkpoint-blue",
                                },
                                { label: "Checkpoint", color: "bg-purple-700" },
                            ].map((hazard, index) => (
                                <div
                                    key={index}
                                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl"
                                >
                                    <span
                                        className={`w-3 h-3 ${hazard.color} rounded-full`}
                                    ></span>
                                    <span className="text-sm text-gray-700">
                                        {hazard.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};
