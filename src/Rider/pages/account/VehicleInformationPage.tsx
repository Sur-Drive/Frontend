import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import DocumentUpdatePage from "./DocumentUpdatePage";
import { useDriverVehicle } from "../../hooks/useAccountVehicle";
import { buildDocuments, type DocStatus } from "../../lib/vehicleDocs";
import vehicleCar from "../../../assets/vehicle-car.png";

export type { DocStatus, VehicleDocument } from "../../lib/vehicleDocs";

function statusBadgeClasses(status: DocStatus) {
  switch (status) {
    case "expiring":
    case "warning":
    case "expired":
      return "bg-[#FCE4E4] text-[#E8542F]";
    case "ok":
    case "verified":
    case "on-file":
      return "bg-[#DCF5E4] text-[#1E9E56]";
    case "pending":
    case "missing":
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
  const {
    data: vehicle,
    isLoading,
    isError,
    error,
    refetch,
  } = useDriverVehicle();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const documents = useMemo(() => buildDocuments(vehicle), [vehicle]);
  const vehicleName = vehicle?.vehicleModel || "Vehicle";
  const plate = vehicle?.plateNumber || "";

  const expiringSoon = documents.filter(
    (d) =>
      d.status === "expiring" ||
      d.status === "warning" ||
      d.status === "expired",
  );
  const mostUrgent = expiringSoon[0];

  const activeDoc = documents.find((d) => d.key === activeKey) || null;

  if (activeDoc) {
    return (
      <DocumentUpdatePage
        document={activeDoc}
        vehicleName={vehicleName}
        onBack={() => setActiveKey(null)}
        onSubmitted={() => setActiveKey(null)}
      />
    );
  }

  // Sizes scale with the screen (width + height) so the page stays balanced
  // from small phones (320px) up to tablets and desktop.
  const chevronSize = "h-[clamp(16px,2.4dvh,20px)] w-[clamp(16px,2.4dvh,20px)]";

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-white font-outfit">
      <div className="min-h-0 flex-1 overflow-y-auto px-[clamp(16px,5vw,28px)] pb-[clamp(24px,5dvh,40px)] pt-[clamp(10px,2.4dvh,18px)]">
        <div className="w-full max-w-xl mx-auto">
          {/* header */}
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="absolute left-0 flex h-[clamp(34px,7vw,44px)] w-[clamp(34px,7vw,44px)] items-center justify-center rounded-full bg-gray-50 shadow-md"
            >
              <ChevronLeft className="h-[52%] w-[52%] text-[#1F2937]" />
            </button>
            <h1 className="px-[clamp(40px,12vw,56px)] text-center text-[clamp(15px,4.6vw,20px)] font-bold leading-tight text-[#1F2937]">
              vehicle information
            </h1>
          </div>

          {/* vehicle photo */}
          <div className="mt-[clamp(10px,2.6dvh,24px)] flex items-center justify-center rounded-2xl bg-white py-[clamp(4px,1.4dvh,16px)]">
            <img
              src={vehicleCar}
              alt={vehicleName || "Vehicle"}
              className="h-[clamp(110px,24dvh,200px)] w-full max-w-[min(100%,320px)] object-contain"
            />
          </div>

          {/* vehicle name card */}
          <div className="rounded-2xl border border-gray-100 p-[clamp(12px,3.4vw,20px)] shadow-sm">
            <h2 className="break-words text-[clamp(17px,5.2vw,24px)] font-bold leading-tight text-[#241238]">
              {isLoading ? "Loading…" : vehicleName}
            </h2>
            <p className="mt-1 text-[clamp(12px,3.4vw,15px)] text-[#9AA5B8]">
              {plate}
            </p>
          </div>

          {isError && (
            <div className="mt-[clamp(10px,2dvh,16px)] rounded-2xl bg-[#FCE4E4] px-4 py-3 text-[clamp(12px,3.3vw,14px)] text-[#E8542F]">
              {(error as Error)?.message ||
                "Could not load vehicle information."}{" "}
              <button
                type="button"
                onClick={() => refetch()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* expiry banner */}
          {mostUrgent && (
            <button
              type="button"
              onClick={() => setActiveKey(mostUrgent.key)}
              className="mt-[clamp(10px,2dvh,16px)] flex w-full items-center justify-between gap-2 rounded-2xl bg-[#FCEACB] px-[clamp(12px,3.4vw,16px)] py-[clamp(10px,1.8dvh,14px)] text-left"
            >
              <span className="flex min-w-0 items-center gap-[clamp(6px,2vw,10px)]">
                <AlertTriangle
                  className={`${chevronSize} shrink-0 text-[#D98A1F]`}
                />
                <span className="text-[clamp(12px,3.5vw,15px)] font-medium text-[#B4700F]">
                  {mostUrgent.status === "expired"
                    ? `${mostUrgent.label} has expired`
                    : `${mostUrgent.label} is expiring soon`}
                </span>
              </span>
              <ChevronRight
                className={`${chevronSize} shrink-0 text-[#D98A1F]`}
              />
            </button>
          )}

          {/* document list */}
          <div className="mt-[clamp(10px,2dvh,16px)] divide-y divide-gray-100 rounded-2xl border border-gray-100 px-[clamp(12px,3.4vw,16px)] shadow-sm">
            {documents.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveKey(d.key)}
                className="flex w-full items-center justify-between gap-[clamp(8px,2.4vw,12px)] py-[clamp(10px,2dvh,16px)] text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="break-words text-[clamp(13.5px,4vw,17px)] leading-snug text-[#1F2937]">
                    {d.label}
                  </p>
                  <p className="mt-0.5 text-[clamp(11px,3.2vw,14px)] text-[#9AA5B8]">
                    {d.expiresLabel}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-[clamp(4px,1.4vw,8px)]">
                  <span
                    className={`whitespace-nowrap rounded-full px-[clamp(8px,2.4vw,12px)] py-[clamp(4px,0.9dvh,6px)] text-[clamp(10.5px,3vw,13px)] font-semibold ${statusBadgeClasses(
                      d.status,
                    )}`}
                  >
                    {d.badgeText}
                  </span>
                  <ChevronRight className={`${chevronSize} text-[#C7CCD6]`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
