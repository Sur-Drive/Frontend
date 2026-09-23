import {
  ChevronLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Car,
  ShieldCheck,
  Activity,
  Gauge,
  Wrench,
  CalendarClock,
} from "lucide-react";

const MANAGERS = [
  {
    initials: "AA",
    name: "Adeniji Abiodun",
    tag: "FLEET OWNER",
    role: "Owner · All Fleets",
    phone: "+234 803 555 0100",
    email: "Abiodun@acmelogistics.ng",
  },
  {
    initials: "CO",
    name: "Chinedu Okeke",
    tag: "YOUR MANAGER",
    role: "Manager · Lagos Metro",
    phone: "+234 803 555 0100",
    email: "Abiodun@acmelogistics.ng",
  },
];

export default function MyFleetPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            My Fleet
          </h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#9AA5B8]">
            View the fleet, vehicle, and Fleet Manager assigned to you.
          </p>

          {/* company card */}
          <div className="mt-6 flex items-center justify-between rounded-3xl bg-[#2D0F4A] px-5 py-5">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Building2 size={22} className="text-white" />
              </span>
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-white/60">
                  COMPANY
                </p>
                <p className="text-lg font-bold text-white">
                  Acme Logistics.
                </p>
                <p className="text-[12.5px] text-white/50">ACME-NG-001</p>
              </div>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">
              PRO FLEET
            </span>
          </div>

          {/* sub-fleet */}
          <h2 className="mb-3 mt-7 text-lg font-bold text-[#1F2937]">
            Sub-fleet
          </h2>
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-4 shadow-sm">
            <div>
              <p className="text-[15px] font-bold text-[#1F2937]">
                Lagos Metro
              </p>
              <p className="mt-1 flex items-center gap-1 text-[13px] text-[#9AA5B8]">
                <MapPin size={13} /> Lagos, SW
              </p>
            </div>
            <span className="rounded-full bg-[#DCF5E4] px-3 py-1.5 text-[11px] font-bold tracking-wide text-[#1E9E56]">
              ACTIVE
            </span>
          </div>

          {/* managers */}
          <h2 className="mb-3 mt-7 text-lg font-bold text-[#1F2937]">
            Managers
          </h2>
          <div className="flex flex-col gap-3">
            {MANAGERS.map((m) => (
              <div
                key={m.name}
                className="rounded-2xl border border-gray-100 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6E43A3] text-sm font-bold text-white">
                      {m.initials}
                    </span>
                    <div>
                      <p className="text-[15px] font-bold text-[#1F2937]">
                        {m.name}
                      </p>
                      <p className="text-[12.5px] text-[#9AA5B8]">{m.role}</p>
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-[#EFE6F7] px-2.5 py-1 text-[10.5px] font-bold tracking-wide text-[#6E43A3]">
                    {m.tag}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="flex items-center gap-2 text-[13px] text-[#4B5768]">
                      <Phone size={13} className="shrink-0 text-[#9AA5B8]" />
                      {m.phone}
                    </p>
                    <p className="flex items-center gap-2 truncate text-[13px] text-[#4B5768]">
                      <Mail size={13} className="shrink-0 text-[#9AA5B8]" />
                      <span className="truncate">{m.email}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFE6F7] text-[#6E43A3]"
                      aria-label={`Call ${m.name}`}
                    >
                      <Phone size={15} />
                    </button>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFE6F7] text-[#6E43A3]"
                      aria-label={`Message ${m.name}`}
                    >
                      <MessageCircle size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* assigned vehicle */}
          <h2 className="mb-3 mt-7 text-lg font-bold text-[#1F2937]">
            Assigned vehicle
          </h2>
          <div className="rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                  <Car size={20} className="text-[#4B5768]" />
                </span>
                <div>
                  <p className="text-[15px] font-bold text-[#1F2937]">
                    Toyota Hiace 2022
                  </p>
                  <p className="text-[12.5px] text-[#9AA5B8]">
                    Van · V-1042
                  </p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#EFE6F7] px-2.5 py-1.5 text-[11px] font-bold text-[#6E43A3]">
                <ShieldCheck size={12} /> LAG-882-KJ
              </span>
            </div>

            <div className="my-4 h-px w-full bg-gray-100" />

            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#9AA5B8]">
                  <Activity size={12} /> TRIPS
                </p>
                <p className="mt-1 text-[15px] font-bold text-[#1F2937]">
                  234
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#9AA5B8]">
                  <Gauge size={12} /> KILOMETER
                </p>
                <p className="mt-1 text-[15px] font-bold text-[#1F2937]">
                  84,210 km
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#9AA5B8]">
                  <Wrench size={12} /> LAST SERVICE
                </p>
                <p className="mt-1 text-[15px] font-bold text-[#1F2937]">
                  2026-05-12
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#9AA5B8]">
                  <CalendarClock size={12} /> NEXT SERVICE
                </p>
                <p className="mt-1 text-[15px] font-bold text-[#1F2937]">
                  2026-07-12
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
