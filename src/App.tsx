import { useState, useEffect } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
    Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import SplashScreen from "./pages/SplashScreen";
import FeedPage from "./pages/FeedPage";
import ReportPage from "./pages/ReportPage";
import PrivateRoute from "./routes/PrivateRoute";
import ProfilePage from "./pages/ProfilePage";
import PlanRoutePage from "./pages/PlanRoutePage";
import BottomNav from "./components/BottomNav";
import "./styles/index.css";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { WaitlistPage } from "./pages/WaitlistPage";
import FleetRegistration from "./pages/Fleet/FleetRegistration";
import KYC from "./pages/Fleet/KYC/KYC";
import FleetDashboard from "./pages/Fleet/Dashboard/FleetDashboard";
import DashSidebar from "./pages/Fleet/Dashboard/DashSidebar";
import { Settings } from "lucide-react";

import SubFleetManagement from "./pages/Fleet/SubFleets/SubFleetManagement";
import FleetManagers from "./pages/Fleet/SubFleets/FleetManagers";
import FleetDrivers from "./pages/Fleet/SubFleets/FleetDrivers";
import FleetVehicles from "./pages/Fleet/SubFleets/FleetVehicles";
import FleetBilling from "./pages/Fleet/SubFleets/FleetBilling";
import PaymentCallback from "./pages/Fleet/SubFleets/PaymentCallback";
import KYCPending from "./pages/Fleet/KYC/components/KYCPending";
import PaymentPending from "./pages/Fleet/KYC/components/PaymentPending";
import SubscriptionRenew from "./pages/Fleet/KYC/components/SubscriptionRenew";
import ForgotPassword from "./pages/Fleet/Auth/ForgotPassword/ForgotPassword";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});

// Pages that should NOT show the BottomNav
const NO_NAV_PAGES = [
    "/",
    "/access-list",
    "/admin/login",
    "/admin/dashboard",
    "/fleet",
    "/fleet/kyc",
    "/fleet/dashboard",
    "/fleet/sub-fleets",
    "/fleet/managers",
    "/fleet/drivers",
    "/fleet/vehicles",
    "/fleet/billing",
    "/payment/success",
    "/payment/cancel",
    "/payment/* ",
    "/fleet/payment/pending",
    "/fleet/subscription/renew",
    "/fleet/kyc-pending",
    "/fleet/forgot-password",
];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/fleet" />;
    }
    return <>{children}</>;
};

function AppRoutes() {
    const location = useLocation();
    const pathname = location.pathname;

    // Check if current page is an app route (should show splash and nav)
    const isAppRoute =
        pathname === "/home" ||
        pathname === "/feed" ||
        pathname === "/report" ||
        pathname === "/profile" ||
        pathname === "/plan-route";

    // Check if current page should show BottomNav
    const showNav = !NO_NAV_PAGES.includes(pathname);

    const [showSplash, setShowSplash] = useState(isAppRoute);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        if (!isAppRoute) {
            setShowSplash(false);
            return;
        }

        setShowSplash(true);
        setFadeOut(false);

        const fadeTimer = setTimeout(() => setFadeOut(true), 1600);
        const removeTimer = setTimeout(() => setShowSplash(false), 2100);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, [isAppRoute]);

    return (
        <>
            <div className={`min-h-screen bg-gray-50 ${showNav ? "" : ""}`}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/access-list" element={<WaitlistPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route
                        path="/test"
                        element={
                            <div style={{ padding: "20px", fontSize: "20px" }}>
                                Test route is working!
                            </div>
                        }
                    />
                    <Route
                        path="/payment/success"
                        element={<PaymentCallback />}
                    />
                    <Route
                        path="/payment/cancel"
                        element={<PaymentCallback />}
                    />
                    <Route path="/payment/*" element={<PaymentCallback />} />
                    <Route path="/plan-route" element={<PlanRoutePage />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/fleet" element={<FleetRegistration />} />
                    <Route
                        path="/fleet/forgot-password"
                        element={<ForgotPassword />}
                    />
                    <Route
                        path="/fleet/kyc"
                        element={
                            <ProtectedRoute>
                                <KYC />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/fleet/kyc-pending" element={<KYCPending />} />
                    <Route
                        path="/fleet/subscription/renew"
                        element={<SubscriptionRenew />}
                    />
                    <Route
                        path="/fleet/payment/pending"
                        element={<PaymentPending />}
                    />
                    <Route element={<PrivateRoute />}>
                        <Route
                            path="/fleet/dashboard"
                            element={
                                <DashSidebar>
                                    <FleetDashboard />
                                </DashSidebar>
                            }
                        />
                        <Route
                            path="/fleet/sub-fleets"
                            element={
                                <DashSidebar>
                                    <SubFleetManagement />
                                </DashSidebar>
                            }
                        />
                        <Route
                            path="/fleet/managers"
                            element={
                                <DashSidebar>
                                    <FleetManagers />
                                </DashSidebar>
                            }
                        />
                        <Route
                            path="/fleet/drivers"
                            element={
                                <DashSidebar>
                                    <FleetDrivers />
                                </DashSidebar>
                            }
                        />

                        <Route
                            path="/fleet/vehicles"
                            element={
                                <DashSidebar>
                                    <FleetVehicles />
                                </DashSidebar>
                            }
                        />

                        <Route
                            path="/fleet/billing"
                            element={
                                <DashSidebar>
                                    <FleetBilling />
                                </DashSidebar>
                            }
                        />

                        {/*
                        <Route
                            path="/fleet/drivers"
                            element={
                                <DashSidebar>
                                    <FleetDrivers />
                                </DashSidebar>
                            }
                        />
                        <Route
                            path="/fleet/trips"
                            element={
                                <DashSidebar>
                                    <Trips />
                                </DashSidebar>
                            }
                        />
                        <Route
                            path="/fleet/billing"
                            element={
                                <DashSidebar>
                                    <Billing />
                                </DashSidebar>
                            }
                        />
                        <Route
                            path="/fleet/settings"
                            element={
                                <DashSidebar>
                                    <Settings />
                                </DashSidebar>
                            }
                        />  */}
                    </Route>
                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard />}
                    />
                </Routes>
            </div>

            {/* BottomNav only shows on app pages */}
            {showNav && <BottomNav />}

            {/* Splash screen overlay - only on app routes */}
            {showSplash && (
                <div
                    className={`fixed inset-0 z-50 transition-opacity duration-500 ease-out ${
                        fadeOut
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                    }`}
                >
                    <SplashScreen />
                </div>
            )}
        </>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

export default App;
