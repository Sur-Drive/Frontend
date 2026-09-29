import { Home, CalendarClock, Wallet, User } from "lucide-react";

type TabKey = "home" | "rides" | "earnings" | "account";

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "rides", label: "Rides", icon: CalendarClock },
  { key: "earnings", label: "Earnings", icon: Wallet },
  { key: "account", label: "Account", icon: User },
];

export default function DriverBottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange?: (tab: TabKey) => void;
}) {
  return (
    <nav className="flex shrink-0 items-center justify-around border-t border-gray-100 bg-white px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            className="flex flex-col items-center gap-1 px-3 py-1"
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.4 : 1.8}
              className={isActive ? "text-[#6E43A3]" : "text-[#9AA5B8]"}
            />
            <span
              className={`text-[11px] ${
                isActive
                  ? "font-semibold text-[#6E43A3]"
                  : "text-[#9AA5B8]"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
