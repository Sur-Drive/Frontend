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
    <div className="font-outfit min-h-[100dvh] bg-white px-6 pb-8 pt-4">
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
      >
        <ChevronLeft size={22} />
      </button>

      <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
        Application under review
      </h1>
      <p className="mt-2 text-base text-gray-400">
        Most providers are approved within 24 hours. We'll notify you here
        and by email.
      </p>

      <div className="mt-8 rounded-3xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={item.title}>
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ece4f5] text-[#6E43A3]">
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#2b2b2b]">{item.title}</p>
                  <p className="truncate text-sm text-[#8a7fb0]">
                    {item.subtitle}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "Verified"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              {i < ITEMS.length - 1 && (
                <div className="mx-5 border-t border-gray-100" />
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/welcome")}
        className="mt-10 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
      >
        Back to Welcome Screen
      </button>
    </div>
  );
}
