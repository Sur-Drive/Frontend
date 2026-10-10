import { useParams } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { useSharedTrip } from "../hooks/useTripShare";

const pick = (o: any, ...keys: string[]) => {
  for (const k of keys) {
    const v = k.split(".").reduce((a, p) => a?.[p], o);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};
const addr = (v: any): string | undefined =>
  typeof v === "string" ? v : v?.address ?? v?.label ?? v?.name ?? undefined;

/** Public page opened from a share link: GET /rides/trip/:token (no login). */
export default function SharedTripPage() {
  const { token } = useParams();
  const { data, isLoading, isError, error, refetch } = useSharedTrip(token);

  const status = pick(data, "status", "ride.status", "trip.status");
  const driver = pick(data, "driver.name", "driverName", "driver.firstName", "ride.driver.name");
  const vehicle = [
    pick(data, "vehicle.model", "driver.vehicle.model", "vehicleModel"),
    pick(data, "vehicle.plateNumber", "driver.vehicle.plateNumber", "plateNumber"),
  ]
    .filter(Boolean)
    .join(" · ");
  const pickup = addr(pick(data, "pickup", "pickupAddress", "ride.pickup", "origin"));
  const dropoff = addr(pick(data, "dropoff", "dropoffAddress", "destination", "ride.dropoff"));
  const eta = pick(data, "eta", "etaMinutes", "etaText");
  const sharedBy = pick(data, "sharedBy", "passengerName", "rider.name");

  return (
    <div className="font-outfit flex min-h-[100dvh] w-full flex-col items-center bg-white px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-bold text-[#1F2937]">Live trip</h1>
        <p className="mt-1 text-sm text-[#9AA5B8]">
          {sharedBy ? `${sharedBy} shared this trip with you.` : "Someone shared this trip with you."}
        </p>

        {isLoading && (
          <div className="mt-10 flex justify-center">
            <Loader2 size={28} className="animate-spin text-[#6E43A3]" />
          </div>
        )}

        {isError && (
          <div className="mt-8 rounded-2xl bg-gray-50 p-5 text-center">
            <p className="text-sm text-[#4B5768]">
              {error instanceof Error ? error.message : "Couldn't load this trip."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-full bg-[#1F2937] px-5 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        )}

        {data && (
          <div className="mt-6 space-y-4 rounded-2xl border border-gray-100 p-5 shadow-sm">
            {status && (
              <span className="inline-block rounded-full bg-[#EFE0FB] px-3 py-1 text-xs font-semibold capitalize text-[#6E43A3]">
                {String(status).replace(/_/g, " ")}
              </span>
            )}
            {driver && <p className="text-sm text-[#1F2937]">Driver: <b>{String(driver)}</b></p>}
            {vehicle && <p className="text-sm text-[#4B5768]">{vehicle}</p>}
            {pickup && (
              <p className="flex gap-2 text-sm text-[#4B5768]">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#6E43A3]" /> From: {pickup}
              </p>
            )}
            {dropoff && (
              <p className="flex gap-2 text-sm text-[#4B5768]">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#1F2937]" /> To: {dropoff}
              </p>
            )}
            {eta && <p className="text-sm text-[#4B5768]">ETA: {String(eta)}{typeof eta === "number" ? " min" : ""}</p>}
            <p className="pt-1 text-xs text-[#9AA5B8]">Updates every few seconds.</p>
          </div>
        )}
      </div>
    </div>
  );
}
