import { useNavigate } from "react-router-dom";
import {
  Car,
  ChevronLeft,
  ClipboardCheck,
  Contact,
  IdCard,
  ScanFace,
} from "lucide-react";

type Status = "Verified" | "Pending";

interface ReviewItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  status: Status;
}

const ITEMS: ReviewItem[] = [
  {
    icon: Contact,
    title: "Personal details",
    subtitle: "Personal information has been Verified",
    status: "Verified",
  },
  {
    icon: Car,
    title: "Vehicle Information",
    subtitle: "Submitted for review.",
    status: "Pending",
  },
  {
    icon: IdCard,
    title: "Driver's License",
    subtitle: "Submitted for verification.",
    status: "Pending",
  },
  {
    icon: ClipboardCheck,
    title: "Vehicle Inspection",
    subtitle: "Awaiting review.",
    status: "Pending",
  },
  {
    icon: ScanFace,
    title: "Face Verification",
    subtitle: "Awaiting review.",
    status: "Pending",
  },
];

export default function ApplicationUnderReviewPage() {
  const navigate = useNavigate();

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-4 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4">
      <div className="w-full max-w-xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex items-center justify-center bg-white rounded-full shadow-md h-9 w-9 sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
        </button>

        <h1 className="mt-5 text-[22px] font-bold leading-tight text-[#2b2b2b] sm:mt-8 sm:text-[28px]">
          Application under review
        </h1>
        <p className="mt-1.5 text-sm leading-snug text-gray-400 sm:mt-2 sm:text-base">
          Most providers are approved within 24 hours. We'll notify you here and
          by email.
        </p>

        <div className="mt-5 rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:mt-8 sm:rounded-3xl">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.title}>
                <div className="flex items-center gap-2.5 px-3.5 py-3 sm:gap-3 sm:px-5 sm:py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ece4f5] text-[#6E43A3] sm:h-11 sm:w-11 sm:rounded-2xl">
                    <Icon className="w-4 h-4 sm:h-5 sm:w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[#2b2b2b] sm:text-base">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-[#8a7fb0] sm:text-sm">
                      {item.subtitle}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                      item.status === "Verified"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                {i < ITEMS.length - 1 && (
                  <div className="mx-3.5 border-t border-gray-100 sm:mx-5" />
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            // Force the splash screen to replay before landing on /welcome
            sessionStorage.removeItem("splashShown");
            navigate("/driver/home");
          }}
          className="mt-6 h-12 w-full rounded-xl bg-[#6E43A3] text-base font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] sm:mt-10 sm:h-14 sm:rounded-2xl sm:text-lg"
        >
          Back to Welcome Screen
        </button>
      </div>
    </div>
  );
}
