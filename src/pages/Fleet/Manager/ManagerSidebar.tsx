import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Truck,
    User,
    MapPin,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
} from "lucide-react";

interface SidebarProps {
    children?: React.ReactNode;
}

const ManagerSidebar: React.FC<SidebarProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const location = useLocation();
    const navigate = useNavigate();

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setMobileOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: "Overview",
            path: "/manager/dashboard",
        },
        { icon: Truck, label: "Vehicles", path: "/manager/vehicles" },
        { icon: User, label: "Drivers", path: "/manager/drivers" },
        { icon: MapPin, label: "Trips", path: "/manager/trips" },
        { icon: FileText, label: "Report", path: "/manager/report" },
        { icon: Settings, label: "Settings", path: "/manager/settings" },
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        navigate("/manager");
    };

    const handleLinkClick = () => {
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const sidebarWidth = collapsed ? "w-[72px]" : "w-[250px]";
    const mobilePosition = mobileOpen ? "translate-x-0" : "-translate-x-full";

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <div
                className={`
                    fixed z-50 flex h-screen flex-col bg-[#4A148C] 
                    transition-all duration-300 ease-in-out
                    md:relative md:translate-x-0
                    ${isMobile ? mobilePosition : sidebarWidth}
                    ${!isMobile && sidebarWidth}
                `}
                style={{
                    borderRight: "1.21px solid rgba(255,255,255,0.1)",
                    justifyContent: "space-between",
                    paddingTop: "32px",
                    paddingBottom: "32px",
                    paddingLeft: "20px",
                    paddingRight: "0px",
                    boxShadow: mobileOpen
                        ? "4px 0 30px rgba(0,0,0,0.3)"
                        : "none",
                }}
            >
                {/* Mobile Close Button */}
                {isMobile && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Logo & Toggle Section */}
                <div className="flex h-full flex-col">
                    <div className="relative mb-8 flex items-center justify-between">
                        {!collapsed && (
                            <div className="text-xl font-bold text-white">
                                <img
                                    src="/images/logo-white.png"
                                    alt="Logo"
                                    className="h-8 w-auto object-contain opacity-100 sm:h-10"
                                    style={{
                                        maxWidth: isMobile
                                            ? "160px"
                                            : "234.919px",
                                    }}
                                />
                            </div>
                        )}

                        {/* Desktop Toggle Button */}
                        {!isMobile && (
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="ml-auto mr-0 flex h-10 w-5 flex-shrink-0 items-center justify-center rounded-l-xl rounded-r-none bg-[#EDE8F4CC] p-0 transition-all hover:opacity-80"
                                style={{ zIndex: 10 }}
                            >
                                {collapsed ? (
                                    <ChevronRight size={14} color="#6E43A3" />
                                ) : (
                                    <ChevronLeft size={14} color="#6E43A3" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={handleLinkClick}
                                    className={`
                                        flex items-center gap-3 rounded-lg px-3 py-3 
                                        transition-all duration-200
                                        sm:px-4 sm:py-3
                                        ${
                                            isActive
                                                ? "bg-[#E8E6EB] text-[#6E43A3]"
                                                : "text-[#EDE8F4] hover:bg-[#E8E6EB] hover:text-[#6E43A3]"
                                        }
                                        ${collapsed && !isMobile ? "justify-center px-2" : ""}
                                    `}
                                    title={
                                        collapsed && !isMobile
                                            ? item.label
                                            : undefined
                                    }
                                >
                                    <item.icon
                                        size={20}
                                        className="flex-shrink-0"
                                    />
                                    {(!collapsed || isMobile) && (
                                        <span className="truncate text-sm font-medium">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`
                            flex items-center gap-3 rounded-lg px-3 py-3 
                            font-['Outfit'] text-white transition-all 
                            hover:opacity-90 active:scale-95
                            sm:px-4 sm:py-3
                            ${collapsed && !isMobile ? "justify-center px-2" : ""}
                        `}
                        style={{ backgroundColor: "#FB2323" }}
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        {(!collapsed || isMobile) && (
                            <span className="text-sm font-medium">Logout</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex min-h-screen flex-1 flex-col bg-[#F3F0F7]">
                {/* Mobile Header */}
                {isMobile && (
                    <header className="sticky top-0 z-30 flex items-center justify-between bg-[#4A148C] px-4 py-3 shadow-md">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <img
                                src="/images/logo-white.png"
                                alt="Logo"
                                className="h-8 w-auto object-contain"
                                style={{ maxWidth: "120px" }}
                            />
                        </div>
                        <div className="w-10" /> {/* Spacer for alignment */}
                    </header>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default ManagerSidebar;
