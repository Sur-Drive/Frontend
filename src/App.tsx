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
import GoogleCallback from "./pages/Fleet/components/GoogleCallback";
import ManagerAcceptInvite from "./pages/Fleet/SubFleets/ManagerAcceptInvite";
import ManagerSignIn from "./pages/Fleet/Manager/ManagerSignIn";
import ManagerDashboard from "./pages/Fleet/Manager/ManagerDashboard";
import ManagerDriver from "./pages/Fleet/Manager/ManagerDriver";
import ManagerSidebar from "./pages/Fleet/Manager/ManagerSidebar";
import ManagerForgotPassword from "./pages/Fleet/Manager/ManagerForgotPassword";
import ManagerVehicles from "./pages/Fleet/Manager/ManagerVehicles";
import ManagerTrips from "./pages/Fleet/Manager/ManagerTrips";
import FleetTrips from "./pages/Fleet/Dashboard/FleetTrips";
import FleetReports from "./pages/Fleet/Dashboard/FleetReports";
import ManagerReports from "./pages/Fleet/Manager/ManagerReport";
import FleetSettings from "./pages/Fleet/Dashboard/FleetSettings";
import ManagerSettings from "./pages/Fleet/Manager/ManagerSettings";
import PlanGuard from "./components/PlanGuard";
import LiveTracking from "./pages/Fleet/Dashboard/LiveTracking";
import DriverAcceptInvite from "./pages/Fleet/SubFleets/DriverAcceptInvite";
import ManagerLiveTracking from "./pages/Fleet/Manager/ManagerLiveTracking";

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
    "/fleet/payment/callback",
    "/fleet/payment/success",
    "/fleet/payment/cancel",
    "/fleet/payment/pending",
    "/fleet/subscription/renew",
    "/fleet/kyc-pending",
    "/fleet/forgot-password",
    "/fleet/accept-invite",
    "/manager",
    "/manager/dashboard",
    "/manager/drivers",
    "/manager/forgot-password",
    "/manager/vehicles",
    "/manager/trips",
    "/fleet/trips",
    "/fleet/report",
    "/manager/report",
    "/fleet/settings",
    "/manager/settings",
    "/fleet/live-tracking",
    "/driver/accept-invite",
    "/manager/live-tracking",
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
                    <Route
                        path="/fleet/payment/callback"
                        element={<PaymentCallback />}
                    />
                    <Route
                        path="/fleet/payment/success"
                        element={<PaymentCallback />}
                    />
                    <Route
                        path="/fleet/payment/cancel"
                        element={<PaymentCallback />}
                    />
                    <Route
                        path="/auth/google/callback"
                        element={<GoogleCallback />}
                    />

                    <Route
                        path="/fleet/accept-invite"
                        element={<ManagerAcceptInvite />}
                    />

                    <Route
                        path="/driver/accept-invite"
                        element={<DriverAcceptInvite />}
                    />
                    <Route
                        path="/manager/dashboard"
                        element={<ManagerDashboard />}
                    />

                    <Route path="/fleet/trips" element={<FleetTrips />} />
                    <Route
                        path="/fleet/report"
                        element={
                            <PlanGuard requiredPlans={["pro", "enterprise"]}>
                                <FleetReports />
                            </PlanGuard>
                        }
                    />

                    <Route
                        path="/fleet/live-tracking"
                        element={
                            <PlanGuard requiredPlans={["pro", "enterprise"]}>
                                <LiveTracking />
                            </PlanGuard>
                        }
                    />

                    <Route
                        path="/manager/live-tracking"
                        element={
                            <PlanGuard requiredPlans={["pro", "enterprise"]}>
                                <ManagerLiveTracking />
                            </PlanGuard>
                        }
                    />

                    <Route
                        path="/manager/drivers"
                        element={
                            <ManagerSidebar>
                                <ManagerDriver />
                            </ManagerSidebar>
                        }
                    />

                    <Route
                        path="/manager/vehicles"
                        element={
                            <ManagerSidebar>
                                <ManagerVehicles />
                            </ManagerSidebar>
                        }
                    />

                    <Route path="/manager" element={<ManagerSignIn />} />
                    <Route
                        path="/manager/report"
                        element={
                            <PlanGuard requiredPlans={["pro", "enterprise"]}>
                                <ManagerReports />
                            </PlanGuard>
                        }
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
                        path="/manager/forgot-password"
                        element={<ManagerForgotPassword />}
                    />
                    <Route path="/manager/trips" element={<ManagerTrips />} />
                    <Route
                        path="/fleet/kyc"
                        element={
                            <ProtectedRoute>
                                <KYC />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/fleet/kyc-pending" element={<KYCPending />} />
                    <Route path="/fleet/settings" element={<FleetSettings />} />
                    <Route
                        path="/manager/settings"
                        element={<ManagerSettings />}
                    />
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
                            element={<FleetDashboard />}
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

            {/* BottomNav only shows on app pages, and never underneath the splash overlay */}
            {showNav && !showSplash && <BottomNav />}

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
