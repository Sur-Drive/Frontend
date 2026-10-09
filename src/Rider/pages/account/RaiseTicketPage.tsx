import { useState } from "react";
import { ChevronLeft, ChevronDown, Loader2 } from "lucide-react";
import { useSupportRides } from "../../hooks/useSupport";

const NONE = "None of the above";

const PRIORITIES = ["Low", "Medium", "High"];

export interface NewTicket {
  summary: string;
  /** Ride id from GET /support/rides (undefined for "None of the above"). */
  rideId?: string;
  ride: string;
  priority: string;
  details: string;
}

export default function RaiseTicketPage({
  onBack,
  onSubmit,
  submitting = false,
  serverError = "",
}: {
  onBack: () => void;
  onSubmit: (ticket: NewTicket) => void;
  submitting?: boolean;
  serverError?: string;
}) {
  const rides = useSupportRides();
  const [summary, setSummary] = useState("");
  const [ride, setRide] = useState("");
  const [rideId, setRideId] = useState<string | undefined>();
  const [priority, setPriority] = useState("");
  const [details, setDetails] = useState("");
  const [rideOpen, setRideOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [error, setError] = useState("");

  const fieldClass =
    "h-14 w-full rounded-2xl bg-[#f4f4f3] px-4 text-sm sm:text-base text-gray-800 outline-none placeholder:text-gray-400";

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
    onSubmit({ summary: summary.trim(), rideId, ride, priority, details: details.trim() });
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

          <h1 className="mt-6 text-[22px] sm:text-[28px] font-bold text-[#1F2937]">
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
                  {rides.isLoading && (
                    <div className="flex justify-center py-4">
                      <Loader2 size={18} className="animate-spin text-[#6E43A3]" />
                    </div>
                  )}
                  {rides.isError && (
                    <p className="px-4 py-3 text-sm text-red-600">Could not load your rides.</p>
                  )}
                  {[...(rides.data ?? []), { id: "", label: NONE }].map((r) => (
                    <button
                      key={r.id || NONE}
                      type="button"
                      onClick={() => {
                        setRide(r.label);
                        setRideId(r.id || undefined);
                        setRideOpen(false);
                      }}
                      className={`block w-full rounded-xl px-4 py-3 text-left text-sm sm:text-base transition ${
                        ride === r.label
                          ? "bg-[#ece4f5] font-semibold text-[#6E43A3]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {r.label}
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
                      className={`block w-full rounded-xl px-4 py-3 text-left text-sm sm:text-base transition ${
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
              className="w-full rounded-2xl bg-[#f4f4f3] px-4 py-4 text-sm sm:text-base text-gray-800 outline-none placeholder:text-gray-400"
            />
          </div>

          {(error || serverError) && (
            <p className="mt-4 text-center text-[13px] sm:text-sm text-red-600">{error || serverError}</p>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="mx-auto w-full max-w-xl">
          <button
            onClick={submit}
            disabled={submitting}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#6E43A3] text-[15px] sm:text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-60"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
