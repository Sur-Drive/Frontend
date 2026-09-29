import { useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";

const RIDES = [
  "Ikoyi → Ajah, 5 Nov",
  "VI → Lekki Phase 1, 3 Nov",
  "Ikeja → MM Airport, 18 Oct",
  "None of the above",
];

const PRIORITIES = ["Low", "Medium", "High"];

export interface NewTicket {
  summary: string;
  ride: string;
  priority: string;
  details: string;
}

export default function RaiseTicketPage({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (ticket: NewTicket) => void;
}) {
  const [summary, setSummary] = useState("");
  const [ride, setRide] = useState("");
  const [priority, setPriority] = useState("");
  const [details, setDetails] = useState("");
  const [rideOpen, setRideOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [error, setError] = useState("");

  const fieldClass =
    "h-14 w-full rounded-2xl bg-[#f4f4f3] px-4 text-base text-gray-800 outline-none placeholder:text-gray-400";

  const submit = () => {
    if (!summary.trim()) {
      setError("Add a brief summary of your issue.");
      return;
    }
    if (!priority) {
      setError("Select a priority.");
      return;
    }
    setError("");
    onSubmit({ summary: summary.trim(), ride, priority, details: details.trim() });
  };

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            Raise a Support Ticket
          </h1>

          <div className="mt-6 space-y-4">
            <input
              type="text"
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setError("");
              }}
              placeholder="Brief summary of your issue"
              className={fieldClass}
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setRideOpen((o) => !o);
                  setPriorityOpen(false);
                }}
                className={`${fieldClass} flex items-center justify-between text-left`}
              >
                <span className={ride ? "text-gray-800" : "text-gray-400"}>
                  {ride || "Select Ride"}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-500 transition-transform ${rideOpen ? "rotate-180" : ""}`}
                />
              </button>
              {rideOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl">
                  {RIDES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRide(r);
                        setRideOpen(false);
                      }}
                      className={`block w-full rounded-xl px-4 py-3 text-left text-base transition ${
                        ride === r
                          ? "bg-[#ece4f5] font-semibold text-[#6E43A3]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPriorityOpen((o) => !o);
                  setRideOpen(false);
                }}
                className={`${fieldClass} flex items-center justify-between text-left`}
              >
                <span
                  className={priority ? "text-gray-800" : "text-gray-400"}
                >
                  {priority || "Select Priority"}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-500 transition-transform ${priorityOpen ? "rotate-180" : ""}`}
                />
              </button>
              {priorityOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl bg-white p-2 shadow-xl">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPriority(p);
                        setPriorityOpen(false);
                        setError("");
                      }}
                      className={`block w-full rounded-xl px-4 py-3 text-left text-base transition ${
                        priority === p
                          ? "bg-[#ece4f5] font-semibold text-[#6E43A3]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Tell us more about the issue..."
              rows={5}
              className="w-full rounded-2xl bg-[#f4f4f3] px-4 py-4 text-base text-gray-800 outline-none placeholder:text-gray-400"
            />
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="mx-auto w-full max-w-xl">
          <button
            onClick={submit}
            className="h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
          >
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
