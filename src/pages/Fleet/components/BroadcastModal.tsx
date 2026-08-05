import React, { useState, useEffect } from "react";
import { X, Send, CheckCircle, Search, Megaphone } from "lucide-react";

const API_BASE = "https://backend-production-01de.up.railway.app";

interface Driver {
    id: string;
    name: string;
    vehicle: string;
    status:
        | "available"
        | "on_trip"
        | "offline"
        | "active"
        | "suspended"
        | "invited"
        | "pending";
    region?: string;
}

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [audience, setAudience] = useState<string>("all_drivers");
    const [type, setType] = useState<string>("general");
    const [priority, setPriority] = useState<string>("normal");
    const [region, setRegion] = useState("");
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState("");

    // Get real counts from drivers data
    const getAudienceCounts = () => {
        const total = drivers.length;
        const onTrip = drivers.filter(
            (d) => d.status === "on_trip" || d.status === "active",
        ).length;
        const available = drivers.filter(
            (d) => d.status === "available",
        ).length;
        const archive = drivers.filter(
            (d) =>
                d.status === "suspended" ||
                d.status === "invited" ||
                d.status === "pending",
        ).length;

        return { total, onTrip, available, archive };
    };

    const counts = getAudienceCounts();

    const audienceOptions = [
        { value: "all_drivers", label: `All Drivers (${counts.total})` },
        { value: "on_trip", label: `On Trip (${counts.onTrip})` },
        { value: "available", label: `Available (${counts.onTrip})` },
        { value: "custom", label: "Custom" },
    ];

    const typeOptions = [
        { value: "general", label: "General" },
        { value: "route_update", label: "Route Update" },
        { value: "safety_notice", label: "Safety Notice" },
        { value: "weather_alert", label: "Weather Alert" },
        { value: "emergency", label: "Emergency" },
    ];

    const priorityOptions = [
        { value: "normal", label: "Normal - In-app notification" },
        { value: "high", label: "Medium - Push notification" },
        { value: "urgent", label: "Urgent - Push + SMS fallback" },
    ];

    useEffect(() => {
        if (isOpen) {
            fetchDrivers();
            setShowSuccess(false);
        }
    }, [isOpen]);

    const fetchDrivers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE}/fleet/drivers`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                const driversData = Array.isArray(data) ? data : [];
                setDrivers(
                    driversData.map((d: any) => ({
                        id: d.id,
                        name: d.fullName || d.name || "Unknown",
                        vehicle:
                            d.vehicle?.registrationNumber ||
                            d.vehicle?.name ||
                            "V-1042",
                        status: d.status || "available",
                        region: d.subFleet?.region || d.region || "Lagos",
                    })),
                );
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
        }
    };

    const handleSubmit = async () => {
        if (!title || !message) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const payload: any = {
                title,
                message,
                type,
                audience,
                priority,
                channel: priority === "urgent" ? "push_and_sms" : "in_app",
            };

            if (audience === "custom" && selectedDrivers.length > 0) {
                payload.customAudience = {
                    driverIds: selectedDrivers,
                };
            }

            if (region) {
                payload.filters = { region };
            }

            const response = await fetch(`${API_BASE}/broadcasts`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to send broadcast");
            }

            setBroadcastTitle(title);
            setShowSuccess(true);
            setLoading(false);
            // Don't close modal, show success state
        } catch (error) {
            console.error("Error sending broadcast:", error);
            alert("Failed to send broadcast. Please try again.");
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowSuccess(false);
        setTitle("");
        setMessage("");
        setAudience("all_drivers");
        setType("general");
        setPriority("normal");
        setRegion("");
        setSelectedDrivers([]);
        setBroadcastTitle("");
        onClose();
        if (onSuccess) onSuccess();
    };

    const toggleDriverSelection = (driverId: string) => {
        setSelectedDrivers((prev) =>
            prev.includes(driverId)
                ? prev.filter((id) => id !== driverId)
                : [...prev, driverId],
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "available":
                return "text-[#2E7D32] bg-[#2E7D3224]";
            case "on_trip":
            case "active":
                return "text-[#F2A618] bg-[#F2A61824]";
            case "suspended":
            case "invited":
            case "pending":
                return "text-[#8E98A8] bg-[#8E98A824]";
            default:
                return "text-[#8E98A8] bg-gray-100";
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case "available":
                return "bg-[#2E7D32]";
            case "on_trip":
            case "active":
                return "bg-[#F2A618]";
            case "suspended":
            case "invited":
            case "pending":
                return "bg-[#8E98A8]";
            default:
                return "bg-[#8E98A8]";
        }
    };

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case "on_trip":
                return "On Trip";
            case "active":
                return "Active";
            case "suspended":
                return "Suspended";
            case "invited":
                return "Invited";
            case "pending":
                return "Pending";
            default:
                return status;
        }
    };

    const filteredDrivers = drivers.filter((driver) =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (!isOpen) return null;

    // Success State
    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#D6F5DA] flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-[#267F50]" />
                    </div>
                    <h3
                        className="text-2xl font-bold text-[#1F083B] mb-2"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Broadcast Sent!
                    </h3>
                    <p
                        className="text-[#5B646F] mb-1"
                        style={{ fontFamily: "Outfit" }}
                    >
                        "{broadcastTitle}" has been sent successfully.
                    </p>
                    <p
                        className="text-sm text-[#8E98A8] mb-6"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Drivers will receive the notification on their app.
                    </p>
                    <button
                        onClick={handleClose}
                        className="w-full bg-[#6E43A3] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Megaphone size={24} className="text-[#6E43A3]" />
                            <h2
                                className="text-2xl font-bold text-[#1F083B]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Broadcast Message
                            </h2>
                        </div>
                        <p
                            className="text-[#5B646F] text-sm mt-1"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Send an announcement to drivers through the driver
                            app.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#5B646F] hover:text-[#1F083B] transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="h-px w-full bg-[#E5E7EB] mb-6" />

                {/* Form */}
                <div className="space-y-4">
                    {/* Audience */}
                    <div>
                        <label
                            className="block text-sm font-medium text-[#1F083B] mb-1.5"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Audience
                        </label>
                        <select
                            value={audience}
                            onChange={(e) => {
                                setAudience(e.target.value);
                                if (e.target.value !== "custom") {
                                    setSelectedDrivers([]);
                                }
                            }}
                            className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {audienceOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type */}
                    <div>
                        <label
                            className="block text-sm font-medium text-[#1F083B] mb-1.5"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {typeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label
                            className="block text-sm font-medium text-[#1F083B] mb-1.5"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Route Update: Lagos-Ibadan Expressway"
                            className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                            style={{ fontFamily: "Outfit" }}
                            maxLength={100}
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label
                            className="block text-sm font-medium text-[#1F083B] mb-1.5"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type the message the drivers will receive..."
                            className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition resize-none"
                            style={{ fontFamily: "Outfit" }}
                            rows={4}
                            maxLength={500}
                        />
                        <div className="flex justify-end text-xs text-[#8E98A8] mt-1">
                            {message.length}/500
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label
                            className="block text-sm font-medium text-[#1F083B] mb-1.5"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Priority
                        </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-4 py-3 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition bg-white"
                            style={{ fontFamily: "Outfit" }}
                        >
                            {priorityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Audience - Driver Selection */}
                    {audience === "custom" && (
                        <div>
                            <label
                                className="block text-sm font-medium text-[#1F083B] mb-1.5"
                                style={{ fontFamily: "Outfit" }}
                            >
                                Select Drivers ({selectedDrivers.length})
                            </label>
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="relative flex-1">
                                        <Search
                                            size={16}
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E98A8]"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search drivers..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="w-full pl-9 pr-4 py-2 border border-[#E0E5EB] rounded-xl focus:outline-none focus:border-[#6E43A3] transition"
                                            style={{ fontFamily: "Outfit" }}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto border border-[#E0E5EB] rounded-xl p-2 space-y-1">
                                    {filteredDrivers.length === 0 ? (
                                        <p
                                            className="text-center text-[#8E98A8] py-4 text-sm"
                                            style={{ fontFamily: "Outfit" }}
                                        >
                                            No drivers found
                                        </p>
                                    ) : (
                                        filteredDrivers.map((driver) => (
                                            <label
                                                key={driver.id}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8F8F8] transition cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDrivers.includes(
                                                        driver.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleDriverSelection(
                                                            driver.id,
                                                        )
                                                    }
                                                    className="w-4 h-4 rounded border-[#D1D5DB] accent-[#6E43A3]"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="text-sm font-medium text-[#1F083B]"
                                                            style={{
                                                                fontFamily:
                                                                    "Outfit",
                                                            }}
                                                        >
                                                            {driver.name}
                                                        </span>
                                                        <span
                                                            className="text-xs text-[#8E98A8]"
                                                            style={{
                                                                fontFamily:
                                                                    "Outfit",
                                                            }}
                                                        >
                                                            {driver.vehicle}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span
                                                            className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(
                                                                driver.status,
                                                            )}`}
                                                        >
                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${getStatusDot(
                                                                    driver.status,
                                                                )}`}
                                                            ></span>
                                                            {getStatusDisplay(
                                                                driver.status,
                                                            )}
                                                        </span>
                                                        {driver.region && (
                                                            <span className="text-[10px] text-[#8E98A8]">
                                                                {driver.region}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl text-[#8E98A8] border border-[#E0E5EB] hover:bg-gray-50 transition"
                        style={{ fontFamily: "Outfit" }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !title || !message}
                        className="flex-1 bg-[#6E43A3] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: "Outfit" }}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                            <>
                                <Send size={18} />
                                Send Broadcast
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BroadcastModal;
