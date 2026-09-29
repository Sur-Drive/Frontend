import {
  Check,
  Star,
} from "lucide-react";
import {
  motion,
} from "framer-motion";
import {
  useEffect,
  useState,
} from "react";

import RideModalSheet from "./RideModalSheet";

import type {
  RideDriver,
} from "../../../types/passengerRide";

const feedbackOptions = [
  "Clean Car",
  "Professional",
  "Smooth driving",
  "On time",
  "Great conversation",
  "Friendly",
  "Driver asked for extra fee",
];

interface RatingSheetProps {
  open: boolean;
  onClose: () => void;
  driver?: RideDriver | null;
  onSubmit: (data: {
    rating: number;
    feedback: string[];
    comment: string;
  }) => void;
}

export default function RatingSheet({
  open,
  onClose,
  driver,
  onSubmit,
}: RatingSheetProps) {
  const [rating, setRating] =
    useState(0);

  const [
    feedback,
    setFeedback,
  ] = useState<string[]>([]);

  const [comment, setComment] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (!open) {
      setRating(0);
      setFeedback([]);
      setComment("");
      setSubmitting(false);
    }
  }, [open]);

  const toggle = (
    value: string,
  ) => {
    setFeedback((current) =>
      current.includes(value)
        ? current.filter(
            (item) =>
              item !== value,
          )
        : [
            ...current,
            value,
          ],
    );
  };

  const submit = () => {
    if (!rating || submitting) {
      return;
    }

    setSubmitting(true);

    onSubmit({
      rating,
      feedback,
      comment: comment.trim(),
    });
  };

  return (
    <RideModalSheet
      open={open}
      onClose={onClose}
      title="Rate your driver"
      description="Your feedback helps improve the Sur-Drive experience."
    >
      {driver && (
        <div className="flex items-center justify-center gap-3">
          <div
            className="
              flex h-14 w-14
              items-center justify-center
              overflow-hidden
              rounded-full
              bg-[#EEE7F5]
              text-[19px] font-bold
              text-[#7442AD]
            "
          >
            {driver.photo ? (
              <img
                src={driver.photo}
                alt={driver.firstName}
                className="h-full w-full object-cover"
              />
            ) : (
              driver.firstName.charAt(0)
            )}
          </div>

          <div>
            <p className="text-[16px] font-semibold text-[#302B34]">
              {driver.firstName}
            </p>

            <p className="mt-1 text-[12px] text-[#918B95]">
              {driver.vehicle.make}{" "}
              {driver.vehicle.model}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map(
          (star) => (
            <motion.button
              key={star}
              type="button"
              whileHover={{
                scale: 1.12,
              }}
              whileTap={{
                scale: 0.88,
              }}
              onClick={() =>
                setRating(star)
              }
              className="p-1"
            >
              <Star
                size={37}
                strokeWidth={1.7}
                fill={
                  star <= rating
                    ? "#F5B942"
                    : "transparent"
                }
                className={
                  star <= rating
                    ? "text-[#F5B942]"
                    : "text-[#D8D3DB]"
                }
              />
            </motion.button>
          ),
        )}
      </div>

      <div className="mt-6">
        <p className="text-[14px] font-semibold text-[#302B34]">
          What went well?
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {feedbackOptions.map(
            (item) => {
              const active =
                feedback.includes(item);

              return (
                <motion.button
                  key={item}
                  type="button"
                  whileTap={{
                    scale: 0.95,
                  }}
                  onClick={() =>
                    toggle(item)
                  }
                  className={`
                    rounded-full
                    border px-4 py-2.5
                    text-[13px]
                    font-medium
                    ${
                      active
                        ? `
                          border-[#7442AD]
                          bg-[#7442AD]
                          text-white
                        `
                        : `
                          border-[#DED8E2]
                          bg-white
                          text-[#625C66]
                        `
                    }
                  `}
                >
                  {item}
                </motion.button>
              );
            },
          )}
        </div>
      </div>

      <textarea
        value={comment}
        onChange={(event) =>
          setComment(
            event.target.value,
          )
        }
        placeholder="Tell us more about your ride..."
        rows={4}
        className="
          mt-5 w-full resize-none
          rounded-[15px]
          border border-[#E5E0E8]
          p-4 text-[16px]
          outline-none
          transition
          focus:border-[#7442AD]
          focus:ring-4
          focus:ring-[#7442AD]/5
        "
      />

      <motion.button
        type="button"
        disabled={
          !rating ||
          submitting
        }
        whileTap={
          rating
            ? {
                scale: 0.98,
              }
            : undefined
        }
        onClick={submit}
        className="
          mt-5 flex h-[54px]
          w-full items-center
          justify-center gap-2
          rounded-[14px]
          bg-[#7442AD]
          text-[16px] font-semibold
          text-white
          disabled:opacity-40
        "
      >
        {submitting ? (
          <>
            <Check size={18} />
            Submitted
          </>
        ) : (
          "Submit Rating"
        )}
      </motion.button>
    </RideModalSheet>
  );
}