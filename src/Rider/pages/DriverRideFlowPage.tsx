import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronsRight,
  Star,
  Delete,
  X,
  Loader2,
} from "lucide-react";
import MapBackdrop, { TopBar } from "../components/MapBackdrop";

type Step =
  | "request"
  | "details"
  | "transit"
  | "notified"
  | "verify"
  | "verifying"
  | "dropoff"
  | "confirm";

const PASSENGER = { name: "Adeniji Abiodun", trips: "256 Completed ride" };
const PIN = "4822";

function Pill({ label }: { label: string }) {
  return (
    <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+68px)] z-10 -translate-x-1/2 rounded-full bg-[#12B76A] px-4 py-2 text-sm font-semibold text-white shadow-md">
      {label}
    </div>
  );
}

function DriverCard() {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-100 p-2.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6E43A3] text-sm font-bold text-white">
        AA
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1F2937]">
          {PASSENGER.name}
        </p>
        <p className="text-[11px] text-[#9AA5B8]">{PASSENGER.trips}</p>
      </div>
      <div className="flex items-center gap-1 text-[#F4C542]">
        <Star size={14} className="fill-[#F4C542]" />
      </div>
    </div>
  );
}

export default function DriverRideFlowPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const pressDigit = (d: string) => {
    if (pin.length >= 4) return;
    setPinError(false);
    setPin((p) => p + d);
  };
  const backspace = () => setPin((p) => p.slice(0, -1));

  const submitPin = () => {
    if (pin === PIN) {
      setStep("verifying");
      setTimeout(() => setStep("dropoff"), 1200);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="font-outfit relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
      <div className="relative min-h-0 flex-1">
        <MapBackdrop
          routeLine={step === "dropoff" || step === "confirm"}
        >
          <TopBar
            showBack={
              <button
                type="button"
                onClick={() => navigate("/driver/home")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
              >
                <ChevronLeft size={18} className="text-[#1F2937]" />
              </button>
            }
            onMenu={step === "dropoff" || step === "confirm" ? () => {} : undefined}
          />

          {step === "request" && <Pill label="Pickup on Lyndale Ave S" />}
          {(step === "details" || step === "transit") && (
            <Pill label={step === "transit" ? "In Transit" : "Pickup on Lyndale Ave S"} />
          )}
          {(step === "notified" || step === "verify" || step === "verifying") && (
            <Pill label="Pickup on Lyndale Ave S" />
          )}
          {(step === "dropoff" || step === "confirm") && (
            <Pill label="Dropoff Pillsbury Ave" />
          )}

          {step === "verifying" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10">
              <Loader2 size={36} className="animate-spin text-[#6E43A3]" />
            </div>
          )}
        </MapBackdrop>
      </div>

      {/* ========================= BOTTOM SHEET ========================== */}
      <div className="shrink-0 rounded-t-[28px] bg-white px-5 pb-4 pt-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-200" />

        {step === "request" && (
          <>
            <p className="text-2xl font-extrabold text-[#1F2937]">₦4,200</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#4B5768]">
              <Star size={13} className="fill-[#F4C542] text-[#F4C542]" /> 4.8
            </div>
            <div className="mt-2 space-y-1 text-xs text-[#4B5768]">
              <p>5 mins (1.2 mi) away</p>
              <p>4 min (1.4 mi) trip</p>
              <p className="truncate text-[#9AA5B8]">
                Pickup at Lyndale Ave S &amp; W 54th St, Minneapolis, MN
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm active:scale-[0.99]"
            >
              <ChevronsRight size={18} />
              <span>Drag to Accept</span>
              <ChevronsRight size={18} />
            </button>
          </>
        )}

        {(step === "details" || step === "transit") && (
          <>
            <p className="text-sm font-semibold text-[#1F2937]">
              {step === "transit" ? "Dropoff Pillsbury Ave" : "Pickup on Lyndale Ave S"}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#9AA5B8]">
              Near Kowalski's Market, 5327 Lyndale Ave S, Minneapolis, MN
            </p>
            <div className="mt-2 space-y-1 text-xs text-[#4B5768]">
              <p>5 mins (1.2 mi) away</p>
              <p>4 min (1.4 mi) trip</p>
            </div>
            <DriverCard />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate("/driver/home")}
                className="rounded-2xl bg-[#E53935] py-3 text-sm font-bold text-white active:scale-[0.99]"
              >
                Cancel Ride
              </button>
              <button
                type="button"
                onClick={() =>
                  setStep(step === "transit" ? "notified" : "transit")
                }
                className="rounded-2xl bg-[#6E43A3] py-3 text-sm font-bold text-white active:scale-[0.99]"
              >
                {step === "transit" ? "Stop New Requests" : "Stop New Requests"}
              </button>
            </div>
          </>
        )}

        {step === "notified" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1F2937]">
                Passenger Notified
              </p>
              <span className="text-xs font-semibold text-[#9AA5B8]">
                00:23
              </span>
            </div>
            <DriverCard />
            <button
              type="button"
              onClick={() => setStep("verify")}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm active:scale-[0.99]"
            >
              <ChevronsRight size={18} />
              <span>Drag to verify passenger</span>
              <ChevronsRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/driver/home")}
              className="mt-2 w-full rounded-2xl bg-[#E53935] py-3 text-sm font-bold text-white active:scale-[0.99]"
            >
              Cancel Ride
            </button>
          </>
        )}

        {(step === "dropoff") && (
          <>
            <p className="text-sm font-semibold text-[#1F2937]">
              2.4 mi · 8 min away
            </p>
            <p className="mt-0.5 text-xs text-[#9AA5B8]">Dropping off Abiodun</p>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm active:scale-[0.99]"
            >
              <ChevronsRight size={18} />
              <span>Drag — Arrived at dropoff</span>
              <ChevronsRight size={18} />
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <p className="text-sm font-semibold text-[#1F2937]">
              Dropoff Pillsbury Ave
            </p>
            <p className="mt-0.5 text-xs text-[#9AA5B8]">
              8 mins &nbsp;·&nbsp; 12.3 mi
            </p>
            <div className="mt-2 space-y-1 text-xs text-[#4B5768]">
              <div className="flex justify-between">
                <span>Trip fare</span>
                <span>₦4,200</span>
              </div>
              <div className="flex justify-between">
                <span>Tip</span>
                <span>₦200</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-1 font-bold text-[#1F2937]">
                <span>Total</span>
                <span>₦4,400</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/driver/rate-passenger")}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm active:scale-[0.99]"
            >
              <ChevronsRight size={18} />
              <span>Drag to Confirm Price</span>
              <ChevronsRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* ========================= VERIFY PASSENGER MODAL ========================== */}
      {step === "verify" && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/40">
          <div className="w-full rounded-t-[28px] bg-white p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#1F2937]">
                  Verify passenger
                </p>
                <p className="mt-1 max-w-[240px] text-xs text-[#9AA5B8]">
                  Ask {PASSENGER.name} for the 4-digit trip PIN before
                  starting
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("notified")}
                className="text-[#9AA5B8]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mx-auto mt-4 flex w-fit gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={`flex h-11 w-9 items-center justify-center rounded-lg border text-lg font-bold ${
                    pinError
                      ? "border-[#E53935] text-[#E53935]"
                      : "border-gray-200 text-[#1F2937]"
                  }`}
                >
                  {pin[i] ?? ""}
                </span>
              ))}
            </div>
            {pinError && (
              <p className="mt-2 text-center text-xs font-semibold text-[#E53935]">
                PIN does not match.
              </p>
            )}

            <div className="mx-auto mt-4 grid max-w-[260px] grid-cols-3 gap-y-2 text-xl font-semibold text-[#1F2937]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pressDigit(d)}
                  className="py-2.5"
                >
                  {d}
                </button>
              ))}
              <span />
              <button type="button" onClick={() => pressDigit("0")} className="py-2.5">
                0
              </button>
              <button
                type="button"
                onClick={backspace}
                className="flex items-center justify-center py-2.5 text-[#9AA5B8]"
              >
                <Delete size={20} />
              </button>
            </div>

            <button
              type="button"
              onClick={submitPin}
              disabled={pin.length < 4}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm disabled:opacity-40"
            >
              <ChevronsRight size={18} />
              <span>Drag to verify passenger</span>
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
