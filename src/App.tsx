// import { useState, useEffect } from "react";
// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   useLocation,
//   Navigate,
// } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// import HomePage from "./pages/HomePage";
// import LandingPage from "./pages/LandingPage";
// import SplashScreen from "./pages/SplashScreen";
// import WelcomePage from "./Rider/pages/WelcomePage";
// import SignInPage from "./Rider/pages/SiginPage";
// import FeedPage from "./pages/FeedPage";
// import ReportPage from "./pages/ReportPage";
// import PrivateRoute from "./routes/PrivateRoute";
// import ProfilePage from "./pages/ProfilePage";
// import PlanRoutePage from "./pages/PlanRoutePage";
// import BottomNav from "./components/BottomNav";
// import "./styles/index.css";
// import { AdminDashboard } from "./pages/AdminDashboard";
// import { AdminLogin } from "./pages/AdminLogin";
// import { WaitlistPage } from "./pages/WaitlistPage";
// import FleetRegistration from "./pages/Fleet/FleetRegistration";
// import KYC from "./pages/Fleet/KYC/KYC";
// import FleetDashboard from "./pages/Fleet/Dashboard/FleetDashboard";
// import DashSidebar from "./pages/Fleet/Dashboard/DashSidebar";
// import { Settings } from "lucide-react";

// import SubFleetManagement from "./pages/Fleet/SubFleets/SubFleetManagement";
// import FleetManagers from "./pages/Fleet/SubFleets/FleetManagers";
// import FleetDrivers from "./pages/Fleet/SubFleets/FleetDrivers";
// import FleetVehicles from "./pages/Fleet/SubFleets/FleetVehicles";
// import FleetBilling from "./pages/Fleet/SubFleets/FleetBilling";
// import PaymentCallback from "./pages/Fleet/SubFleets/PaymentCallback";
// import KYCPending from "./pages/Fleet/KYC/components/KYCPending";
// import PaymentPending from "./pages/Fleet/KYC/components/PaymentPending";
// import SubscriptionRenew from "./pages/Fleet/KYC/components/SubscriptionRenew";
// import ForgotPassword from "./pages/Fleet/Auth/ForgotPassword/ForgotPassword";
// import GoogleCallback from "./pages/Fleet/components/GoogleCallback";
// import ManagerAcceptInvite from "./pages/Fleet/SubFleets/ManagerAcceptInvite";
// import ManagerSignIn from "./pages/Fleet/Manager/ManagerSignIn";
// import ManagerDashboard from "./pages/Fleet/Manager/ManagerDashboard";
// import ManagerDriver from "./pages/Fleet/Manager/ManagerDriver";
// import ManagerSidebar from "./pages/Fleet/Manager/ManagerSidebar";
// import ManagerForgotPassword from "./pages/Fleet/Manager/ManagerForgotPassword";
// import ManagerVehicles from "./pages/Fleet/Manager/ManagerVehicles";
// import PrivacyPage from "./pages/PrivacyPage";
// import DeleteAccount from "./pages/DeleteAccount";

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       staleTime: 1000 * 60 * 5,
//       refetchOnWindowFocus: false,
//     },
//     mutations: {
//       retry: 0,
//     },
//   },
// });

// // Pages that should NOT show the BottomNav
// const NO_NAV_PAGES = [
//   "/",
//   "/welcome",
//   "/signin",
//   "/access-list",
//   "/admin/login",
//   "/admin/dashboard",
//   "/fleet",
//   "/fleet/kyc",
//   "/fleet/dashboard",
//   "/fleet/sub-fleets",
//   "/fleet/managers",
//   "/fleet/drivers",
//   "/fleet/vehicles",
//   "/fleet/billing",
//   "/payment/success",
//   "/payment/cancel",
//   "/payment/* ",
//   "/fleet/payment/pending",
//   "/fleet/subscription/renew",
//   "/fleet/kyc-pending",
//   "/fleet/forgot-password",
//   "/fleet/accept-invite",
//   "/manager",
//   "/manager/dashboard",
//   "/manager/drivers",
//   "/manager/forgot-password",
//   "/manager/vehicles",
// ];

// const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
//   const token = localStorage.getItem("token");
//   if (!token) {
//     return <Navigate to="/fleet" />;
//   }
//   return <>{children}</>;
// };

// // In the installed PWA, "/" should open the app flow, not the marketing site.
// function RootEntry() {
//   const isStandalone =
//     window.matchMedia("(display-mode: standalone)").matches ||
//     (navigator as any).standalone === true;

//   if (!isStandalone) return <LandingPage />;
//   return <Navigate to={localStorage.getItem("token") ? "/home" : "/welcome"} replace />;
// }

// function AppRoutes() {
//   const location = useLocation();

//   const pathname = location.pathname;

//   // Check if current page is an app route (should show splash and nav)
//   const isAppRoute =
//     pathname === "/welcome" ||
//     pathname === "/home" ||
//     pathname === "/feed" ||
//     pathname === "/report" ||
//     pathname === "/profile" ||
//     pathname === "/plan-route";

//   // Check if current page should show BottomNav
//   const showNav = !NO_NAV_PAGES.includes(pathname);

//   // Splash plays once per app launch (session), not on every navigation
//   const [showSplash, setShowSplash] = useState(
//     isAppRoute && !sessionStorage.getItem("splashShown"),
//   );
//   const [fadeOut, setFadeOut] = useState(false);

//   useEffect(() => {
//     if (!isAppRoute || sessionStorage.getItem("splashShown")) {
//       setShowSplash(false);
//       return;
//     }

//     setShowSplash(true);
//     setFadeOut(false);

//     const fadeTimer = setTimeout(() => setFadeOut(true), 1600);
//     const removeTimer = setTimeout(() => {
//       setShowSplash(false);
//       sessionStorage.setItem("splashShown", "1");
//     }, 2100);

//     return () => {
//       clearTimeout(fadeTimer);
//       clearTimeout(removeTimer);
//     };
//   }, [isAppRoute]);

//   return (
//     <>
//       <div className={`min-h-screen bg-gray-50 ${showNav ? "" : ""}`}>
//         <Routes>
//           <Route path="/" element={<RootEntry />} />
//           <Route path="/welcome" element={<WelcomePage />} />
//           <Route path="/signin" element={<SignInPage />} />
//           <Route path="/access-list" element={<WaitlistPage />} />
//           <Route path="/home" element={<HomePage />} />
//           <Route path="/feed" element={<FeedPage />} />
//           <Route path="/report" element={<ReportPage />} />
//           <Route path="/profile" element={<ProfilePage />} />
//           <Route path="/privacy" element={<PrivacyPage />} />
//           <Route path="/delete-account" element={<DeleteAccount />} />
//           <Route
//             path="/test"
//             element={
//               <div style={{ padding: "20px", fontSize: "20px" }}>
//                 Test route is working!
//               </div>
//             }
//           />
//           <Route path="/payment/success" element={<PaymentCallback />} />
//           <Route path="/payment/cancel" element={<PaymentCallback />} />
//           <Route path="/auth/google/callback" element={<GoogleCallback />} />

//           <Route
//             path="/fleet/accept-invite"
//             element={<ManagerAcceptInvite />}
//           />
//           <Route path="/manager/dashboard" element={<ManagerDashboard />} />

//           <Route
//             path="/manager/drivers"
//             element={
//               <ManagerSidebar>
//                 <ManagerDriver />
//               </ManagerSidebar>
//             }
//           />

//           <Route
//             path="/manager/vehicles"
//             element={
//               <ManagerSidebar>
//                 <ManagerVehicles />
//               </ManagerSidebar>
//             }
//           />

//           <Route path="/manager" element={<ManagerSignIn />} />
//           <Route path="/payment/*" element={<PaymentCallback />} />
//           <Route path="/plan-route" element={<PlanRoutePage />} />
//           <Route path="/admin/login" element={<AdminLogin />} />
//           <Route path="/fleet" element={<FleetRegistration />} />
//           <Route path="/fleet/forgot-password" element={<ForgotPassword />} />
//           <Route
//             path="/manager/forgot-password"
//             element={<ManagerForgotPassword />}
//           />
//           <Route
//             path="/fleet/kyc"
//             element={
//               <ProtectedRoute>
//                 <KYC />
//               </ProtectedRoute>
//             }
//           />

//           <Route path="/fleet/kyc-pending" element={<KYCPending />} />
//           <Route
//             path="/fleet/subscription/renew"
//             element={<SubscriptionRenew />}
//           />
//           <Route path="/fleet/payment/pending" element={<PaymentPending />} />
//           <Route element={<PrivateRoute />}>
//             <Route
//               path="/fleet/dashboard"
//               element={
//                 <DashSidebar>
//                   <FleetDashboard />
//                 </DashSidebar>
//               }
//             />
//             <Route
//               path="/fleet/sub-fleets"
//               element={
//                 <DashSidebar>
//                   <SubFleetManagement />
//                 </DashSidebar>
//               }
//             />
//             <Route
//               path="/fleet/managers"
//               element={
//                 <DashSidebar>
//                   <FleetManagers />
//                 </DashSidebar>
//               }
//             />
//             <Route
//               path="/fleet/drivers"
//               element={
//                 <DashSidebar>
//                   <FleetDrivers />
//                 </DashSidebar>
//               }
//             />

//             <Route
//               path="/fleet/vehicles"
//               element={
//                 <DashSidebar>
//                   <FleetVehicles />
//                 </DashSidebar>
//               }
//             />

//             <Route
//               path="/fleet/billing"
//               element={
//                 <DashSidebar>
//                   <FleetBilling />
//                 </DashSidebar>
//               }
//             />
//           </Route>
//           <Route path="/admin/dashboard" element={<AdminDashboard />} />
//         </Routes>
//       </div>

//       {/* BottomNav only shows on app pages, and never underneath the splash overlay */}
//       {showNav && !showSplash && <BottomNav />}

//       {/* Splash screen overlay - only on app routes */}
//       {showSplash && (
//         <div
//           className={`fixed inset-0 z-50 transition-opacity duration-500 ease-out ${
//             fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
//           }`}
//         >
//           <SplashScreen />
//         </div>
//       )}
//     </>
//   );
// }

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <BrowserRouter>
//         <AppRoutes />
//       </BrowserRouter>
//       <ReactQueryDevtools initialIsOpen={false} />
//     </QueryClientProvider>
//   );
// }

// export default App;

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
import WelcomePage from "./Rider/pages/WelcomePage";
import SignInPage from "./Rider/pages/SiginPage";
import RegisterPage from "./Rider/pages/RegisterPage";
import OtpPage from "./Rider/pages/OtpPage";
import PersonalInformationPage from "./Rider/pages/PersonalInformationPage";
import DriversLicensePage from "./Rider/pages/DriversLicensePage";
import VehicleInspectionPage from "./Rider/pages/VehicleInspectionPage";
import FaceVerificationPage from "./Rider/pages/FaceVerificationPage";
import CreatePasswordPage from "./Rider/pages/CreatePasswordPage";
import ApplicationUnderReviewPage from "./Rider/pages/ApplicationUnderReviewPage";
import ForgotPasswordPage from "./Rider/pages/ForgotPasswordPage";
import ResetOtpPage from "./Rider/pages/ResetOtpPage";
import ResetPasswordPage from "./Rider/pages/ResetPasswordPage";
import DriverHomePage from "./Rider/pages/DriverHomePage";
import DriverRideFlowPage from "./Rider/pages/DriverRideFlowPage";
import RideHistoryPage from "./Rider/pages/RideHistoryPage";
import EarningsPage from "./Rider/pages/EarningsPage";
import AccountPage from "./Rider/pages/AccountPage";
import RatePassengerPage from "./Rider/pages/RatePassengerPage";
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
import PrivacyPage from "./pages/PrivacyPage";
import DeleteAccount from "./pages/DeleteAccount";

// PASSENGER
import PassengerLaunch from "./pages/Passenger/Auth/PassengerLaunch";
import PassengerSignup from "./pages/Passenger/Auth/PassengerSignup";
import PassengerOtp from "./pages/Passenger/Auth/PassengerOtp";
import CompletePassengerProfile from "./pages/Passenger/Auth/CompletePassengerProfile";
import PassengerLocation from "./pages/Passenger/Auth/PassengerLocation";
import PassengerBiometric from "./pages/Passenger/Auth/PassengerBiometric";
import PassengerHome from "./pages/Passenger/Home/PassengerHome"; 
import BookRide from "./pages/Passenger/Ride/BookRide"; 
import { PassengerRideProvider } from "./context/PassengerRideContext";
import SelectRide from "./pages/Passenger/Ride/SelectRide";
import ConfirmPickup from "./pages/Passenger/Ride/ConfirmPickup";
import SearchingDriver from "./pages/Passenger/Ride/SearchingDriver";
import DriverAssigned from "./pages/Passenger/Ride/DriverAssigned";
import DriverEnRoute from "./pages/Passenger/Ride/DriverEnRoute";
import DriverArrived from "./pages/Passenger/Ride/DriverArrived";
import VerifyRide from "./pages/Passenger/Ride/VerifyRide";
import ActiveTrip from "./pages/Passenger/Ride/ActiveTrip";
import RideSafety from "./pages/Passenger/Ride/RideSafety";
import TripComplete from "./pages/Passenger/Ride/TripComplete";
import RateDriver from "./pages/Passenger/Ride/RateDriver";
import DriverArriving from "./pages/Passenger/Ride/DriverArriving";
import RideChat from "./pages/Passenger/Ride/RideChat";
import EmergencyAlert from "./pages/Passenger/Ride/EmergencyAlert";
import PassengerActivity from "./pages/Passenger/Activity/PassengerActivity";
import RideDetails from "./pages/Passenger/Activity/RideDetails";
import PassengerAlerts from "./pages/Passenger/Alerts/PassengerAlerts";
import { PassengerProfileProvider } from "./context/PassengerProfileContext";
import PassengerAccount from "./pages/Passenger/Account/PassengerAccount";
import PassengerProfile from "./pages/Passenger/Account/PassengerProfile";
import ChangeEmail from "./pages/Passenger/Account/ChangeEmail";
import ChangePhone from "./pages/Passenger/Account/ChangePhone";
import ProfileOtpVerification from "./pages/Passenger/Account/ProfileOtpVerification";
import Legal from "./pages/Passenger/Account/Legal";
import PrivacyPolicy from "./pages/Passenger/Account/PrivacyPolicy";
import TermsConditions from "./pages/Passenger/Account/TermsConditions";
import PaymentMethods from "./pages/Passenger/Account/PaymentMethods";
import AddCard from "./pages/Passenger/Account/AddCard";
import PromosRewards from "./pages/Passenger/Account/PromosRewards";
import { PassengerSafetyProvider } from "./context/PassengerSafetyContext";
import PassengerSafety from "./pages/Passenger/Account/Safety/PassengerSafety";
import PickupCode from "./pages/Passenger/Account/Safety/PickupCode";
import EmergencyContacts from "./pages/Passenger/Account/Safety/EmergencyContacts";
import AddEmergencyContact from "./pages/Passenger/Account/Safety/AddEmergencyContact";
import { PassengerSavedPlacesProvider } from "./context/PassengerSavedPlacesContext";
import SavedPlaces from "./pages/Passenger/Account/SavedPlaces/SavedPlaces";
import SavedPlaceLocation from "./pages/Passenger/Account/SavedPlaces/SavedPlaceLocation";
import SavedPlaceMap from "./pages/Passenger/Account/SavedPlaces/SavedPlaceMap";
import ConfirmSavedPlace from "./pages/Passenger/Account/SavedPlaces/ConfirmSavedPlace";
import NameSavedPlace from "./pages/Passenger/Account/SavedPlaces/NameSavedPlace";
import PassengerRateUs from "./pages/Passenger/Account/RateUs/PassengerRateUs";
import PassengerSupport from "./pages/Passenger/Account/Support/PassengerSupport";
import { PassengerSupportProvider } from "./context/PassengerSupportContext";
import SupportArticles from "./pages/Passenger/Account/Support/SupportArticles";
import Tickets from "./pages/Passenger/Account/Support/Tickets";
import RaiseTicket from "./pages/Passenger/Account/Support/RaiseTicket";
import TicketConversation from "./pages/Passenger/Account/Support/TicketConversation";
import LiveSupportChat from "./pages/Passenger/Account/Support/LiveSupportChat";


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
  "/welcome",
  "/signin",
  "/register",
  "/register/otp",
  "/register/personal-information",
  "/register/license",
  "/register/vehicle-inspection",
  "/register/face-verification",
  "/register/password",
  "/register/review",
  "/forgot-password",
  "/forgot-password/otp",
  "/forgot-password/reset",
  "/driver/home",
  "/driver/ride",
  "/driver/rides",
  "/driver/earnings",
  "/driver/account",
  "/driver/rate-passenger",
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
  "/payment/*",
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
];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/fleet" />;
  }
  return <>{children}</>;
};

// In the installed PWA, "/" should open the app flow, not the marketing site.
function RootEntry() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;

  if (!isStandalone) return <LandingPage />;
  return (
    <Navigate
      to={localStorage.getItem("token") ? "/home" : "/welcome"}
      replace
    />
  );
}

function AppRoutes() {
  const location = useLocation();

  const pathname = location.pathname;

  // Check if current page is an app route (should show splash and nav)
  const isAppRoute =
    pathname === "/welcome" ||
    pathname === "/home" ||
    pathname === "/feed" ||
    pathname === "/report" ||
    pathname === "/profile" ||
    pathname === "/plan-route";

  // Check if current page should show BottomNav
  // const showNav = !NO_NAV_PAGES.includes(pathname);
  const isPassengerRoute = pathname.startsWith("/passenger");

const showNav = !isPassengerRoute && !NO_NAV_PAGES.includes(pathname);

  // Splash plays once per app launch (session), not on every navigation
  const [showSplash, setShowSplash] = useState(
    isAppRoute && !sessionStorage.getItem("splashShown"),
  );
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isAppRoute || sessionStorage.getItem("splashShown")) {
      setShowSplash(false);
      return;
    }

    setShowSplash(true);
    setFadeOut(false);

    const fadeTimer = setTimeout(() => setFadeOut(true), 1600);
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("splashShown", "1");
    }, 2100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [isAppRoute]);

  return (
    <>
      <div className={`min-h-screen bg-gray-50 ${showNav ? "" : ""}`}>
        <Routes>
          <Route path="/" element={<RootEntry />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/forgot-password/otp" element={<ResetOtpPage />} />
          <Route
            path="/forgot-password/reset"
            element={<ResetPasswordPage />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/otp" element={<OtpPage />} />
          <Route
            path="/register/personal-information"
            element={<PersonalInformationPage />}
          />
          <Route path="/register/license" element={<DriversLicensePage />} />
          <Route
            path="/register/vehicle-inspection"
            element={<VehicleInspectionPage />}
          />
          <Route
            path="/register/face-verification"
            element={<FaceVerificationPage />}
          />
          <Route path="/register/password" element={<CreatePasswordPage />} />
          <Route
            path="/register/review"
            element={<ApplicationUnderReviewPage />}
          />
          <Route path="/driver/home" element={<DriverHomePage />} />
          <Route path="/driver/ride" element={<DriverRideFlowPage />} />
          <Route path="/driver/rides" element={<RideHistoryPage />} />
          <Route path="/driver/earnings" element={<EarningsPage />} />
          <Route path="/driver/account" element={<AccountPage />} />
          <Route
            path="/driver/rate-passenger"
            element={<RatePassengerPage />}
          />
          <Route path="/access-list" element={<WaitlistPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route
            path="/test"
            element={
              <div style={{ padding: "20px", fontSize: "20px" }}>
                Test route is working!
              </div>
            }
          />
          <Route path="/payment/success" element={<PaymentCallback />} />
          <Route path="/payment/cancel" element={<PaymentCallback />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          <Route
            path="/fleet/accept-invite"
            element={<ManagerAcceptInvite />}
          />
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />

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
          <Route path="/payment/*" element={<PaymentCallback />} />
          <Route path="/plan-route" element={<PlanRoutePage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/fleet" element={<FleetRegistration />} />
          <Route path="/fleet/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/manager/forgot-password"
            element={<ManagerForgotPassword />}
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
          <Route path="/fleet/payment/pending" element={<PaymentPending />} />
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
          </Route>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* PASSENGER */}
          {/* =========================================
    PASSENGER
========================================= */}
          <Route
  path="/passenger"
  element={<Navigate to="/passenger/launch" replace />}
/>

<Route
  path="/passenger/launch"
  element={<PassengerLaunch />}
/>

<Route
  path="/passenger/signup"
  element={<PassengerSignup />}
/>

<Route
  path="/passenger/otp"
  element={<PassengerOtp />}
/>
<Route
  path="/passenger/complete-profile"
  element={<CompletePassengerProfile />}
/>
<Route
  path="/passenger/location"
  element={<PassengerLocation />}
/>
<Route
  path="/passenger/biometric"
  element={<PassengerBiometric />}
/>
<Route
  path="/passenger/home"
  element={<PassengerHome />}
/>
<Route
  path="/passenger/book-ride"
  element={<BookRide />}
/>

<Route
  path="/passenger/ride/select"
  element={<SelectRide />}
/>

<Route
  path="/passenger/ride/confirm"
  element={<ConfirmPickup />}
/>

<Route
  path="/passenger/ride/searching"
  element={<SearchingDriver />}
/>

<Route
  path="/passenger/ride/driver-assigned"
  element={<DriverAssigned />}
/>

<Route
  path="/passenger/ride/driver-en-route"
  element={<DriverEnRoute />}
/>
<Route
  path="/passenger/ride/driver-arriving"
  element={<DriverArriving />}
/>
<Route
  path="/passenger/ride/driver-arrived"
  element={<DriverArrived />}
/>

<Route
  path="/passenger/ride/verify"
  element={<VerifyRide />}
/>

<Route
  path="/passenger/ride/trip"
  element={<ActiveTrip />}
/>

<Route
  path="/passenger/ride/safety"
  element={<RideSafety />}
/>

<Route
  path="/passenger/ride/arrived"
  element={<TripComplete />}
/>

<Route
  path="/passenger/ride/rate"
  element={<RateDriver />}
/>

<Route
  path="/passenger/ride/chat"
  element={<RideChat />}
/>

<Route
  path="/passenger/ride/emergency"
  element={<EmergencyAlert />}
/>

<Route
  path="/passenger/activity"
  element={<PassengerActivity />}
/>

<Route
  path="/passenger/activity/:rideId"
  element={<RideDetails />}
/>

<Route
  path="/passenger/alerts"
  element={<PassengerAlerts />}
/>

<Route
  path="/passenger/account"
  element={<PassengerAccount />}
/>

<Route
  path="/passenger/account/profile"
  element={<PassengerProfile />}
/>

<Route
  path="/passenger/account/profile/change-email"
  element={<ChangeEmail />}
/>

<Route
  path="/passenger/account/profile/change-phone"
  element={<ChangePhone />}
/>

<Route
  path="/passenger/account/profile/verify"
  element={<ProfileOtpVerification />}
/>

<Route
  path="/passenger/account/legal"
  element={<Legal />}
/>

<Route
  path="/passenger/account/legal/privacy"
  element={<PrivacyPolicy />}
/>

<Route
  path="/passenger/account/legal/terms"
  element={<TermsConditions />}
/>

<Route
  path="/passenger/account/payment-methods"
  element={<PaymentMethods />}
/>

<Route
  path="/passenger/account/payment-methods/add-card"
  element={<AddCard />}
/>

<Route
  path="/passenger/account/promos"
  element={<PromosRewards />}
/>

<Route
  path="/passenger/account/safety"
  element={<PassengerSafety />}
/>

<Route
  path="/passenger/account/safety/pickup-code"
  element={<PickupCode />}
/>

<Route
  path="/passenger/account/safety/emergency-contacts"
  element={<EmergencyContacts />}
/>

<Route
  path="/passenger/account/safety/emergency-contacts/add"
  element={<AddEmergencyContact />}
/>

<Route
  path="/passenger/account/saved-places"
  element={<SavedPlaces />}
/>

<Route
  path="/passenger/account/saved-places/location/:mode"
  element={<SavedPlaceLocation />}
/>

<Route
  path="/passenger/account/saved-places/location/edit/:id"
  element={<SavedPlaceLocation />}
/>

<Route
  path="/passenger/account/saved-places/map"
  element={<SavedPlaceMap />}
/>

<Route
  path="/passenger/account/saved-places/confirm"
  element={<ConfirmSavedPlace />}
/>

<Route
  path="/passenger/account/saved-places/name"
  element={<NameSavedPlace />}
/>

<Route
  path="/passenger/account/rate-us"
  element={<PassengerRateUs />}
/>

<Route
  path="/passenger/account/support"
  element={<PassengerSupport />}
/>

<Route
  path="/passenger/account/support/articles"
  element={<SupportArticles />}
/>

<Route
  path="/passenger/account/support/live-chat"
  element={<LiveSupportChat />}
/>

<Route
  path="/passenger/account/support/tickets"
  element={<Tickets />}
/>

<Route
  path="/passenger/account/support/tickets/new"
  element={<RaiseTicket />}
/>

<Route
  path="/passenger/account/support/tickets/:ticketId"
  element={<TicketConversation />}
/>
        </Routes>
      </div>

      {/* BottomNav only shows on app pages, and never underneath the splash overlay */}
      {showNav && !showSplash && <BottomNav />}

      {/* Splash screen overlay - only on app routes */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-500 ease-out ${
            fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
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
      <PassengerProfileProvider>
        <PassengerRideProvider>
           <PassengerSafetyProvider>
            <PassengerSavedPlacesProvider>
               <PassengerSupportProvider>
          <AppRoutes />
          </PassengerSupportProvider>
          </PassengerSavedPlacesProvider>
          </PassengerSafetyProvider>
        </PassengerRideProvider>
        </PassengerProfileProvider>
      </BrowserRouter>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
