import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Star,
  Wallet,
  Building2,
  Car,
  CreditCard,
  ShieldCheck,
  Lock,
  HelpCircle,
  Landmark,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import DriverBottomNav from "../components/DriverBottomNav";
import ProfileFlow from "./account/ProfileFlow";
import MyFleetPage from "./account/MyFleetPage";
import WalletPage from "./account/WalletPage";
import SafetyPage from "./account/SafetyPage";
import PrivacySecurityPage from "./account/PrivacySecurityPage";
import LegalPage from "./account/LegalPage";
import VehicleInformationPage from "./account/VehicleInformationPage";
import SupportPage from "./account/SupportPage";
import ReceivedRatingsPage from "./account/ReceivedRatingsPage";
import { useRideDriverProfile } from "../hooks/useProfile";
import { useEarningsWallet } from "../hooks/useEarnings";
import { useReceivedRatings } from "../hooks/useRatings";
import { useUnregisterDeviceToken } from "../hooks/useDeviceToken";
import { clearFcmToken, getStoredFcmToken } from "../lib/fcm";

type View =
  | "home"
  | "profile"
  | "my-fleet"
  | "vehicle-information"
  | "wallet"
  | "safety"
  | "privacy-security"
  | "legal"
  | "support"
  | "rate-driver";

const DRIVER = {
  driveScore: 93,
};

function MenuRow({
  icon,
  label,
  badge,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 py-4 text-left"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          danger ? "bg-[#FCE4E4]" : "bg-[#F1F2F5]"
        }`}
      >
        {icon}
      </span>
      <span
        className={`flex-1 text-[13px] sm:text-[15px] font-medium ${
          danger ? "text-[#E8542F]" : "text-[#1F2937]"
        }`}
      >
        {label}
      </span>
      {badge}
      <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
    </button>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const unregisterToken = useUnregisterDeviceToken();

  // DELETE /notifications/device-token, then clear the driver session.
  const handleLogout = async () => {
    const fcm = getStoredFcmToken();
    if (fcm) {
      try {
        await unregisterToken.mutateAsync({ token: fcm });
      } catch (e) {
        console.warn("[notifications] device token removal failed:", e);
      }
      clearFcmToken();
    }
    localStorage.removeItem("token");
    localStorage.removeItem("driverRefreshToken");
    navigate("/signin", { replace: true });
  };
  const [view, setView] = useState<View>("home");
  const { data: profile } = useRideDriverProfile();
  const driverName = profile?.fullName ?? "";
  const driverPhone = profile?.phone ?? "";
  const wallet = useEarningsWallet();
  const ratings = useReceivedRatings();
  const rated = (ratings.data?.pages ?? []).flatMap((p) => p.items);
  const rating = rated.length
    ? rated.reduce((sum, r) => sum + r.stars, 0) / rated.length
    : undefined;
  const ratingText = (rating ?? 0).toFixed(1); // 0.0 only when no passenger has rated yet
  const balanceText = wallet.data
    ? `${wallet.data.currency === "NGN" ? "₦" : `${wallet.data.currency} `}${wallet.data.balance.toLocaleString(
        "en-NG",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      )}`
    : wallet.isLoading
      ? "…"
      : "—";

  if (view === "profile") {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <ProfileFlow onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "my-fleet") {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <MyFleetPage onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "vehicle-information") {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <VehicleInformationPage onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "wallet") {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <WalletPage onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "safety") {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <SafetyPage onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "privacy-security") {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <PrivacySecurityPage onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "support") {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <SupportPage onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "rate-driver") {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <ReceivedRatingsPage onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "legal") {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <LegalPage onBack={() => setView("home")} />
      </div>
    );
  }

  return (
    <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FA] px-5 pb-4 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
        <div className="w-full max-w-xl mx-auto">
          <h1 className="mb-5 text-[21px] sm:text-[26px] font-extrabold text-[#1F2937]">
            Account
          </h1>

          {/* profile + balance card */}
          <div className="p-2 bg-white shadow-sm rounded-3xl">
            <button
              type="button"
              onClick={() => setView("profile")}
              className="flex w-full items-center gap-3.5 px-3 py-3.5 text-left"
            >
              <div className="relative shrink-0">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#6E43A3]">
                  <div className="flex h-full w-full items-center justify-center bg-[#EFE6F7] text-[15px] sm:text-lg font-bold text-[#6E43A3]">
                    {driverName
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                </div>
                <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-full bg-[#F4C542] px-1.5 py-[1px] text-[10px] font-bold text-white shadow">
                  <Star size={9} className="fill-white" />
                  {ratingText}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[15px] sm:text-[17px] font-bold text-[#1F2937]">
                  {driverName || "Your profile"}
                </p>
                <p className="mt-0.5 text-[12px] sm:text-[13.5px] text-[#9AA5B8]">
                  {driverPhone}
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <ChevronRight size={16} className="text-[#6E43A3]" />
              </span>
            </button>

            <div className="h-px mx-3 bg-gray-100" />

            <button
              type="button"
              onClick={() => setView("wallet")}
              className="flex w-full items-center gap-3.5 px-3 py-3.5 text-left"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1F2F5]">
                <Wallet size={20} className="text-[#6E43A3]" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] sm:text-xl font-extrabold text-[#1F2937]">
                  {balanceText}
                </p>
                <p className="text-[12px] sm:text-[13px] text-[#9AA5B8]">Balance</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <ChevronRight size={16} className="text-[#6E43A3]" />
              </span>
            </button>
          </div>

          {/* stats */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="px-4 py-4 bg-white shadow-sm rounded-2xl">
              <p className="text-[12px] sm:text-[13.5px] text-[#9AA5B8]">Drive score</p>
              <p className="mt-1.5 text-xl sm:text-2xl font-extrabold text-[#1E9E56]">
                {DRIVER.driveScore}%
              </p>
            </div>
            <div className="px-4 py-4 bg-white shadow-sm rounded-2xl">
              <p className="text-[12px] sm:text-[13.5px] text-[#9AA5B8]">Current Rating</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xl sm:text-2xl font-extrabold text-[#1F2937]">
                {ratingText}
                <Star size={18} className="fill-[#F4C542] text-[#F4C542]" />
              </p>
            </div>
          </div>

          {/* menu */}
          <div className="px-4 mt-3 bg-white divide-y divide-gray-100 shadow-sm rounded-3xl">
            <MenuRow
              icon={<Building2 size={18} className="text-[#4B5768]" />}
              label="My Fleet"
              onClick={() => setView("my-fleet")}
            />
            <MenuRow
              icon={<Car size={18} className="text-[#4B5768]" />}
              label="Vehicle Information"
              badge={
                <span className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FDF1DC]">
                  <AlertTriangle size={14} className="text-[#E8A93E]" />
                </span>
              }
              onClick={() => setView("vehicle-information")}
            />
            <MenuRow
              icon={<CreditCard size={18} className="text-[#4B5768]" />}
              label="Wallet"
              onClick={() => setView("wallet")}
            />
            <MenuRow
              icon={<ShieldCheck size={18} className="text-[#4B5768]" />}
              label="Safety"
              onClick={() => setView("safety")}
            />
            <MenuRow
              icon={<Lock size={18} className="text-[#4B5768]" />}
              label="Privacy & security"
              onClick={() => setView("privacy-security")}
            />
            <MenuRow
              icon={<HelpCircle size={18} className="text-[#4B5768]" />}
              label="Help & Support"
              onClick={() => setView("support")}
            />
            <MenuRow
              icon={<Landmark size={18} className="text-[#4B5768]" />}
              label="Legal"
              onClick={() => setView("legal")}
            />
            <MenuRow
              icon={<Star size={18} className="text-[#4B5768]" />}
              label="My ratings"
              onClick={() => setView("rate-driver")}
            />
            <MenuRow
              icon={<LogOut size={18} className="text-[#E8542F]" />}
              label="Logout"
              danger
              onClick={handleLogout}
            />
          </div>
        </div>
      </div>

      <DriverBottomNav
        active="account"
        onChange={(tab) => {
          if (tab === "home") navigate("/driver/home");
          if (tab === "rides") navigate("/driver/rides");
          if (tab === "earnings") navigate("/driver/earnings");
        }}
      />
    </div>
  );
}
