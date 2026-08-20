// BlurSidebar.tsx
import React, { useState, useEffect } from "react";
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
    Clock,
    AlertCircle,
    Menu,
    X,
} from "lucide-react";

interface BlurSidebarProps {
    children?: React.ReactNode;
    status?: "pending" | "expired" | "payment_pending" | "active";
}

const BlurSidebar: React.FC<BlurSidebarProps> = ({
    children,
    status = "active",
}) => {
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

    const getStatusConfig = () => {
        switch (status) {
            case "pending":
                return {
                    icon: <Clock size={16} className="text-[#F2A618]" />,
                    label: "KYC Pending",
                    bgColor: "bg-[#F2A61820]",
                    textColor: "text-[#F2A618]",
                };
            case "expired":
                return {
                    icon: <AlertCircle size={16} className="text-[#FE3F21]" />,
                    label: "Subscription Expired",
                    bgColor: "bg-[#FE3F2124]",
                    textColor: "text-[#FE3F21]",
                };
            case "payment_pending":
                return {
                    icon: <CreditCard size={16} className="text-[#F2A618]" />,
                    label: "Payment Pending",
                    bgColor: "bg-[#F2A61820]",
                    textColor: "text-[#F2A618]",
                };
            default:
                return {
                    icon: null,
                    label: "",
                    bgColor: "",
                    textColor: "",
                };
        }
    };

    const statusConfig = getStatusConfig();
    const isRestricted =
        status === "expired" ||
        status === "pending" ||
        status === "payment_pending";

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

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        navigate("/fleet");
    };

    const handleLinkClick = (path: string) => {
        // If restricted, prevent navigation
        if (isRestricted) {
            return;
        }

        if (isMobile) {
            setMobileOpen(false);
        }
        navigate(path);
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
                    ${isRestricted ? "pointer-events-none" : ""}
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

                <div className="flex h-full flex-col">
                    {/* Logo Section with Toggle Button */}
                    <div className="relative mb-6 flex items-center justify-between">
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

                    {/* Status Badge */}
                    {isRestricted && (
                        <div
                            className={`mb-6 flex items-center gap-2 rounded-lg px-4 py-2 ${statusConfig.bgColor}`}
                        >
                            {statusConfig.icon}
                            {!collapsed && (
                                <span
                                    className={`text-xs font-medium ${statusConfig.textColor}`}
                                    style={{ fontFamily: "Outfit" }}
                                >
                                    {statusConfig.label}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Menu Items */}
                    <nav className="flex-1 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <div
                                    key={item.path}
                                    className={`
                                        flex w-full items-center gap-3 rounded-lg px-3 py-3 
                                        transition-all duration-200
                                        sm:px-4 sm:py-3
                                        ${isRestricted ? "cursor-not-allowed opacity-40" : ""}
                                        ${
                                            isActive && !isRestricted
                                                ? "bg-[#E8E6EB] text-[#6E43A3]"
                                                : "text-[#EDE8F4]"
                                        }
                                        ${collapsed && !isMobile ? "justify-center px-2" : ""}
                                    `}
                                    onClick={() => handleLinkClick(item.path)}
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
                                </div>
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
                            ${collapsed && !isMobile ? "justify-center px-2" : ""}
                            ${isRestricted ? "pointer-events-none opacity-40" : ""}
                        `}
                        style={{ backgroundColor: "#FB2323" }}
                        disabled={isRestricted}
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

                {/* Status Banner at top of content */}
                {isRestricted && (
                    <div
                        className={`${statusConfig.bgColor} flex flex-col gap-2 border-b border-[#E5E7EB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6`}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            {statusConfig.icon}
                            <span
                                className={`text-sm font-medium ${statusConfig.textColor}`}
                                style={{ fontFamily: "Outfit" }}
                            >
                                {statusConfig.label}
                            </span>
                            <span
                                className="text-sm text-[#8E98A8]"
                                style={{ fontFamily: "Outfit" }}
                            >
                                • Access restricted until resolved
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                if (status === "pending") {
                                    navigate("/fleet/kyc-pending");
                                } else if (status === "expired") {
                                    navigate("/fleet/subscription/renew");
                                } else {
                                    navigate("/fleet/payment/pending");
                                }
                            }}
                            className="w-full rounded-lg bg-[#6E43A3] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
                            style={{ fontFamily: "Outfit" }}
                        >
                            Resolve Now
                        </button>
                    </div>
                )}

                {/* Page Content - NO OVERLAY, just the content */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BlurSidebar;
