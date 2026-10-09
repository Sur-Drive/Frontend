import { useState } from "react";
import { Check, ChevronLeft, Loader2, Star } from "lucide-react";
import { useRateDriver } from "../../hooks/useRatings";
import {
  DRIVER_RATING_TAGS,
  NEGATIVE_DRIVER_RATING_TAGS,
  type DriverRatingTag,
} from "../../api/ratings";

interface Props {
  onBack: () => void;
  /** Ride being rated. If omitted, the screen asks for the ride ID. */
  rideId?: string;
}

export default function RateDriverPage({ onBack, rideId: rideIdProp }: Props) {
  const [rideIdInput, setRideIdInput] = useState("");
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<DriverRatingTag[]>([]);
  const [done, setDone] = useState(false);

  const { mutate, isPending, error, reset } = useRateDriver();

  const rideId = (rideIdProp ?? rideIdInput).trim();
  const canSubmit = stars > 0 && !!rideId && !isPending;

  const toggleTag = (tag: DriverRatingTag) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const submit = () => {
    if (!canSubmit) return;
    const trimmed = comment.trim();
    mutate(
      {
        rideId,
        stars,
        ...(trimmed ? { comment: trimmed } : {}),
        ...(tags.length ? { tags } : {}),
      },
      { onSuccess: () => setDone(true) },
    );
  };

  if (done) {
    return (
      <div className="font-outfit flex h-full w-full flex-col items-center justify-center bg-white px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFE6F7]">
          <Check size={30} className="text-[#6E43A3]" />
        </span>
        <h2 className="mt-4 text-lg sm:text-xl font-extrabold text-[#1F2937]">
          Thanks for your feedback
        </h2>
        <p className="mt-1 text-sm text-[#9AA5B8]">
          Your rating has been submitted.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 w-full max-w-xs rounded-2xl bg-[#6E43A3] py-3.5 text-sm font-bold text-white"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="font-outfit flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <button type="button" onClick={onBack} className="text-[#1F2937]">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-sm sm:text-base font-bold text-[#1F2937]">Rate driver</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <div className="w-full max-w-xl mx-auto">
          {rideIdProp === undefined && (
            <>
              <p className="text-xs font-semibold text-[#1F2937]">Ride ID</p>
              <input
                value={rideIdInput}
                onChange={(e) => setRideIdInput(e.target.value)}
                placeholder="Enter the ride ID"
                className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-base text-[#1F2937] placeholder:text-[#9AA5B8] focus:border-[#6E43A3] focus:outline-none"
              />
            </>
          )}

          <p className="mt-5 text-center text-sm font-semibold text-[#1F2937]">
            How was your driver?
          </p>
          <div className="flex justify-center gap-2 mt-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setStars(n)}>
                <Star
                  size={32}
                  className={
                    n <= stars
                      ? "fill-[#F4C542] text-[#F4C542]"
                      : "fill-transparent text-gray-300"
                  }
                />
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs font-semibold text-[#1F2937]">
            Select feedback
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {DRIVER_RATING_TAGS.map((tag) => {
              const isBad = NEGATIVE_DRIVER_RATING_TAGS.includes(tag);
              const isSelected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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

          <p className="mt-5 text-xs font-semibold text-[#1F2937]">
            Comment <span className="font-normal text-[#9AA5B8]">(optional)</span>
          </p>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) reset();
            }}
            placeholder="Tell us more about your ride"
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-gray-200 p-3 text-base text-[#1F2937] placeholder:text-[#9AA5B8] focus:border-[#6E43A3] focus:outline-none"
          />

          {error && (
            <p className="mt-3 text-xs font-medium text-[#E53935]">
              {(error as Error).message}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-2xl bg-[#6E43A3] py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-40"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : "Submit"}
        </button>
      </div>
    </div>
  );
}
