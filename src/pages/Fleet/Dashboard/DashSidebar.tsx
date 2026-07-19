import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    UserCog,
    Truck,
    User,
    MapPin,
    CreditCard,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Layers,
} from "lucide-react";

interface SidebarProps {
    children?: React.ReactNode;
}

const DashSidebar: React.FC<SidebarProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", path: "/fleet/dashboard" },
        { icon: Layers, label: "Sub Fleets", path: "/fleet/sub-fleets" },
        { icon: UserCog, label: "Managers", path: "/fleet/managers" },
        { icon: Truck, label: "Vehicles", path: "/fleet/vehicles" },
        { icon: User, label: "Drivers", path: "/fleet/drivers" },
        { icon: MapPin, label: "Trips", path: "/fleet/trips" },
        { icon: CreditCard, label: "Billing", path: "/fleet/billing" },
        { icon: FileText, label: "Report", path: "/fleet/report" },
        { icon: Settings, label: "Settings", path: "/fleet/settings" },
    ];

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        navigate("/fleet");
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div
                className={`flex flex-col bg-[#4A148C] transition-all duration-300 relative ${
                    collapsed ? "w-[72px]" : "w-[250px]"
                }`}
                style={{
                    borderRightWidth: "1.21px",
                    borderRightColor: "rgba(255,255,255,0.1)",
                    justifyContent: "space-between",
                    paddingTop: "32px",
                    paddingBottom: "32px",
                    paddingLeft: "20px",
                    paddingRight: "0px",
                    height: "100vh",
                }}
            >
                {/* Logo Section with Toggle Button */}
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8 relative">
                        {!collapsed && (
                            <div className="text-white font-bold text-xl">
                                <img
                                    src="/images/logo-white.png"
                                    alt="Logo"
                                    style={{
                                        width: "234.91903686523438px",
                                        height: "40px",
                                        objectFit: "contain",
                                        opacity: 1,
                                    }}
                                />
                            </div>
                        )}

                        {/* Toggle Button - Fully inside the sidebar */}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="flex items-center justify-center transition-all hover:opacity-80 flex-shrink-0"
                            style={{
                                width: "20px",
                                height: "40px",
                                marginLeft: "auto",
                                marginRight: "0px",
                                borderTopLeftRadius: "12px",
                                borderBottomLeftRadius: "12px",
                                borderTopRightRadius: "0px",
                                borderBottomRightRadius: "0px",
                                backgroundColor: "#EDE8F4CC",
                                zIndex: 10,
                                padding: "0",
                            }}
                        >
                            {collapsed ? (
                                <ChevronRight
                                    size={14}
                                    style={{ color: "#6E43A3" }}
                                />
                            ) : (
                                <ChevronLeft
                                    size={14}
                                    style={{ color: "#6E43A3" }}
                                />
                            )}
                        </button>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
                                        isActive
                                            ? "bg-[#E8E6EB] text-[#6E43A3]"
                                            : "text-[#EDE8F4] hover:bg-[#E8E6EB] hover:text-[#6E43A3]"
                                    }`}
                                    style={{
                                        backgroundColor: isActive
                                            ? "#E8E6EB"
                                            : "transparent",
                                        color: isActive ? "#6E43A3" : "#EDE8F4",
                                    }}
                                >
                                    <item.icon size={20} />
                                    {!collapsed && (
                                        <span className="text-sm font-medium">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button - Red background */}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:opacity-90 ${
                            collapsed ? "justify-center" : ""
                        }`}
                        style={{
                            backgroundColor: "#FB2323",
                            color: "#FFFFFF",
                            fontFamily: "Outfit",
                        }}
                    >
                        <LogOut size={20} />
                        {!collapsed && (
                            <span className="text-sm font-medium">Logout</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-[#F3F0F7]">{children}</div>
        </div>
    );
};

export default DashSidebar;
