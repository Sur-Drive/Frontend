import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import SplashScreen from "./pages/SplashScreen";
import FeedPage from "./pages/FeedPage";
import ReportPage from "./pages/ReportPage";
import ProfilePage from "./pages/ProfilePage";
import PlanRoutePage from "./pages/PlanRoutePage";
import BottomNav from "./components/BottomNav";
import "./styles/index.css";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { WaitlistPage } from "./pages/WaitlistPage";

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
const NO_NAV_PAGES = ["/", "/access-list", "/admin/login", "/admin/dashboard"];

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
            <div
                className={`min-h-screen bg-gray-50 ${showNav ? "" : ""}`}
            >
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/access-list" element={<WaitlistPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/plan-route" element={<PlanRoutePage />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
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
