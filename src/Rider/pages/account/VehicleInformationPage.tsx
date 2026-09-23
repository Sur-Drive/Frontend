import { useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import DocumentUpdatePage from "./DocumentUpdatePage";

export type DocStatus = "expiring" | "warning" | "ok" | "verified" | "pending";

export interface VehicleDocument {
  key: string;
  label: string;
  expiresLabel: string;
  status: DocStatus;
  badgeText: string;
  fileName?: string;
  previewUrl?: string;
}

const VEHICLE = {
  name: "Corrolla toyota 2021",
  plate: "LAG-001-AB",
};

const INITIAL_DOCUMENTS: VehicleDocument[] = [
  {
    key: "vehicle-license",
    label: "Vehicle License",
    expiresLabel: "Expires Sept 21, 2026",
    status: "expiring",
    badgeText: "Expires in 3 days",
  },
  {
    key: "road-worthiness",
    label: "Vehicle Road Worthiness",
    expiresLabel: "Expires Sept 21, 2026",
    status: "warning",
    badgeText: "Expiring soon",
  },
  {
    key: "drivers-license",
    label: "Driver's License",
    expiresLabel: "Expires Dec 21, 2026",
    status: "ok",
    badgeText: "Up to date",
  },
  {
    key: "ownership",
    label: "Ownership Document",
    expiresLabel: "Document has been Verified",
    status: "verified",
    badgeText: "Verified",
  },
];

function statusBadgeClasses(status: DocStatus) {
  switch (status) {
    case "expiring":
    case "warning":
      return "bg-[#FCE4E4] text-[#E8542F]";
    case "ok":
    case "verified":
      return "bg-[#DCF5E4] text-[#1E9E56]";
    case "pending":
      return "bg-[#FDF1DC] text-[#E8A93E]";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function VehicleInformationPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const [documents, setDocuments] =
    useState<VehicleDocument[]>(INITIAL_DOCUMENTS);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const expiringSoon = documents.filter(
    (d) => d.status === "expiring" || d.status === "warning",
  );
  const mostUrgent = expiringSoon[0];

  const activeDoc = documents.find((d) => d.key === activeKey) || null;

  const markSubmitted = (key: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.key === key
          ? {
              ...d,
              status: "pending",
              badgeText: "Pending Review",
              expiresLabel: "Submitted for review",
            }
          : d,
      ),
    );
  };

  if (activeDoc) {
    return (
      <DocumentUpdatePage
        document={activeDoc}
        vehicleName={VEHICLE.name}
        onBack={() => setActiveKey(null)}
        onSubmitted={() => markSubmitted(activeDoc.key)}
      />
    );
  }

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={onBack}
              className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
            >
              <ChevronLeft size={22} className="text-[#1F2937]" />
            </button>
            <h1 className="text-xl font-bold text-[#1F2937]">
              vehicle information
            </h1>
          </div>

          {/* vehicle photo */}
          <div className="mt-6 flex items-center justify-center rounded-2xl bg-white py-6">
            <svg
              viewBox="0 0 220 110"
              className="h-32 w-56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="110" cy="92" rx="90" ry="7" fill="#EEF0F3" />
              <path
                d="M18 78c-4-2-6-8-4-16 3-11 12-15 22-16l14-19c5-7 13-11 22-11h46c9 0 17 4 22 11l14 19c10 1 19 5 22 16 2 8 0 14-4 16"
                fill="#B9C2CC"
              />
              <path
                d="M22 74c-3-2-4-6-3-12 2-9 10-12 18-13l12-16c4-6 11-9 18-9h38c7 0 14 3 18 9l12 16c8 1 16 4 18 13 1 6 0 10-3 12z"
                fill="#D6DCE2"
              />
              <path
                d="M58 63l9-22c2-4 6-7 10-7h32c4 0 8 3 10 7l9 22z"
                fill="#EEF1F4"
              />
              <path d="M92 65V37h16v28z" fill="#B9C2CC" opacity="0.5" />
              <circle cx="62" cy="80" r="14" fill="#3A3F45" />
              <circle cx="62" cy="80" r="6" fill="#C7CCD1" />
              <circle cx="158" cy="80" r="14" fill="#3A3F45" />
              <circle cx="158" cy="80" r="6" fill="#C7CCD1" />
              <rect x="20" y="66" width="10" height="5" rx="2" fill="#8A94A0" />
              <rect
                x="190"
                y="66"
                width="10"
                height="5"
                rx="2"
                fill="#8A94A0"
              />
            </svg>
          </div>

          {/* vehicle name card */}
          <div className="rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-2xl font-bold text-[#241238]">
              {VEHICLE.name}
            </h2>
            <p className="mt-1 text-[15px] text-[#9AA5B8]">{VEHICLE.plate}</p>
          </div>

          {/* expiry banner */}
          {mostUrgent && (
            <button
              type="button"
              onClick={() => setActiveKey(mostUrgent.key)}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#FCEACB] px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-[#D98A1F]" />
                <span className="text-[15px] font-medium text-[#B4700F]">
                  Your documents will expire in 3 days
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-[#D98A1F]" />
            </button>
          )}

          {/* document list */}
          <div className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100 px-4 shadow-sm">
            {documents.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveKey(d.key)}
                className="flex w-full items-center justify-between gap-3 py-4 text-left"
              >
                <div className="min-w-0">
                  <p className="text-[17px] text-[#1F2937]">{d.label}</p>
                  <p className="mt-0.5 text-[14px] text-[#9AA5B8]">
                    {d.expiresLabel}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${statusBadgeClasses(
                      d.status,
                    )}`}
                  >
                    {d.badgeText}
                  </span>
                  <ChevronRight size={18} className="text-[#C7CCD6]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
