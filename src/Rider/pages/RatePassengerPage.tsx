import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Star } from "lucide-react";

const TAGS = [
  "Pleasant ride",
  "Respectful",
  "Professional",
  "Great conversation",
  "No issues",
  "On time",
  "Friendly",
  "Polite",
  "Damaged the vehicle",
  "Aggressive behaviour",
  "Payment issue",
];

const PASSENGER = {
  name: "Abiodun A.",
  id: "ABC-123456",
  pickup: "14 Admiralty Way Lekki",
  distance: "8 mins",
};

export default function RatePassengerPage() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toggleTag = (tag: string) =>
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  return (
    <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <button
          type="button"
          onClick={() => navigate("/driver/home")}
          className="text-[#1F2937]"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-base font-bold text-[#1F2937]">Rate Passenger</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        {/* Avatar + name */}
        <div className="flex flex-col items-center pt-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6E43A3] text-lg font-bold text-white">
            AA
          </div>
          <p className="mt-2 text-base font-bold text-[#1F2937]">
            {PASSENGER.name}
          </p>
          <p className="text-[11px] text-[#9AA5B8]">{PASSENGER.id}</p>
        </div>

        {/* Trip summary */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 text-xs text-[#4B5768]">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#9AA5B8]">
              Destination
            </p>
            <p className="mt-0.5 font-semibold text-[#1F2937]">
              {PASSENGER.pickup}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-[#9AA5B8]">
              Distance
            </p>
            <p className="mt-0.5 font-semibold text-[#1F2937]">
              {PASSENGER.distance}
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-sm font-semibold text-[#1F2937]">
          You've Arrived! Thanks for riding with SUR-DRIVE HT, remember not to
          leave anything behind
        </p>

        {/* Stars */}
        <div className="mt-3 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)}>
              <Star
                size={30}
                className={
                  n <= rating
                    ? "fill-[#F4C542] text-[#F4C542]"
                    : "fill-transparent text-gray-300"
                }
              />
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold text-[#1F2937]">
          What influenced your rating
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your comment"
          rows={2}
          className="mt-2 w-full resize-none rounded-xl border border-gray-200 p-3 text-xs text-[#1F2937] placeholder:text-[#9AA5B8] focus:border-[#6E43A3] focus:outline-none"
        />

        <p className="mt-3 text-[11px] text-[#9AA5B8]">
          Or select feedback
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const isBad =
              tag === "Damaged the vehicle" ||
              tag === "Aggressive behaviour" ||
              tag === "Payment issue";
            const isSelected = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                  isSelected
                    ? isBad
                      ? "border-[#E53935] bg-[#E53935]/10 text-[#E53935]"
                      : "border-[#6E43A3] bg-[#6E43A3]/10 text-[#6E43A3]"
                    : "border-gray-200 text-[#4B5768]"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-2">
        <button
          type="button"
          disabled={rating === 0}
          onClick={() => navigate("/driver/home")}
          className="w-full rounded-2xl bg-[#6E43A3] py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-40"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
