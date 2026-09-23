import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsRight, ChevronsLeft, Star } from "lucide-react";
import MapBackdrop, { TopBar } from "../components/MapBackdrop";
import DriverBottomNav from "../components/DriverBottomNav";

export default function DriverHomePage() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);

  return (
    <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
      {/* ========================= MAP ========================== */}
      <div className="relative flex-1 min-h-0">
        <MapBackdrop pulse={isOnline}>
          <TopBar />

          {/* Online -> Offline toggle pill (top bar), only shown while online */}
          {isOnline && (
            <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+16px)] z-10 w-[calc(100%-96px)] max-w-[260px] -translate-x-1/2">
              <button
                type="button"
                onClick={() => setIsOnline(false)}
                className="flex w-full items-center justify-between rounded-full bg-[#B9BFC9] px-3 py-2.5 text-sm font-semibold text-white shadow-md transition"
              >
                <ChevronsLeft size={18} />
                <span>Go Offline</span>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/30">
                  <ChevronsLeft size={14} />
                </span>
              </button>
            </div>
          )}
        </MapBackdrop>
      </div>

      {/* ========================= BOTTOM SHEET ========================== */}
      <div className="shrink-0 rounded-t-[28px] bg-white px-5 pb-3 pt-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="w-10 h-1 mx-auto mb-3 bg-gray-200 rounded-full" />

        {!isOnline && (
          <>
            <p className="mb-2 text-center text-sm text-[#4B5768]">
              Go online to get more bookings
            </p>

            <button
              type="button"
              onClick={() => setIsOnline(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-[#12B76A] px-2 py-3 text-base font-bold text-white shadow-sm transition active:scale-[0.99]"
            >
              <span className="flex items-center justify-center w-8 h-8 border-2 rounded-xl border-white/70">
                <ChevronsRight size={18} />
              </span>
              <span>Drag to go Online</span>
              <ChevronsRight size={18} />
            </button>
          </>
        )}

        {/* Today's earnings */}
        <button
          type="button"
          onClick={() => navigate("/driver/earnings")}
          className="flex items-center justify-between w-full px-4 py-3 mt-3 text-left border border-gray-100 shadow-sm rounded-2xl"
        >
          <div>
            <p className="text-[13px] text-[#4B5768]">Today's Earnings</p>
            <p className="mt-1 text-xl font-extrabold text-[#1F2937]">₦0.00</p>
          </div>
          <span className="text-gray-300">›</span>
        </button>

        {/* Drive score / rating */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="px-4 py-3 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[#4B5768]">Drive score</p>
              <span className="text-gray-300">›</span>
            </div>
            <p className="mt-1 text-lg font-extrabold text-[#1F2937]">93%</p>
          </div>
          <div className="px-4 py-3 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[#4B5768]">Current Rating</p>
              <span className="text-gray-300">›</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-lg font-extrabold text-[#1F2937]">
              4.7 <Star size={16} className="fill-[#F4C542] text-[#F4C542]" />
            </p>
          </div>
        </div>
      </div>

      <DriverBottomNav
        active="home"
        onChange={(tab) => {
          if (tab === "rides") navigate("/driver/rides");
          if (tab === "earnings") navigate("/driver/earnings");
          if (tab === "account") navigate("/driver/account");
        }}
      />
    </div>
  );
}
