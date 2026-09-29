import {
  Check,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";

import RideHeader from "../../../components/passenger/ride/RideHeader";
import DriverCard from "../../../components/passenger/ride/DriverCard";

import { usePassengerRide } from "../../../context/PassengerRideContext";
import { mockAssignedDriver } from "../../../data/passengerRide";

const feedbackOptions = [
  "Clean Car",
  "Professional",
  "Smooth driving",
  "On time",
  "Great conversation",
  "Friendly",
  "Driver asked for extra fee",
];

export default function RateDriver() {
  const navigate = useNavigate();

  const {
    ride,
    resetRide,
  } = usePassengerRide();

  const [rating, setRating] =
    useState(0);

  const [comment, setComment] =
    useState("");

  const [feedback, setFeedback] =
    useState<string[]>([]);

  const [submitted, setSubmitted] =
    useState(false);

  if (!ride.driver && ride.status === "idle") {
    return <Navigate to="/passenger/home" replace />;
  }

  const driver =
    ride.driver ?? mockAssignedDriver;

  const toggleFeedback = (
    item: string,
  ) => {
    setFeedback((previous) =>
      previous.includes(item)
        ? previous.filter(
            (value) => value !== item,
          )
        : [...previous, item],
    );
  };

  const submit = () => {
    setSubmitted(true);

    window.setTimeout(() => {
      resetRide();

      navigate(
        "/passenger/home",
        {
          replace: true,
        },
      );
    }, 1200);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F8FA]">
      <RideHeader title="Rate Your Driver" />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-5 sm:px-7">
        <DriverCard
          driver={driver}
          showActions={false}
        />

        <div className="mt-8 text-center">
          <h2 className="text-[21px] font-semibold text-[#302B34]">
            How was your ride?
          </h2>

          <p className="mt-2 text-[14px] text-[#918B95]">
            Your feedback helps improve the Sur-Drive experience.
          </p>

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
        </div>

        <div className="mt-8">
          <p className="text-[15px] font-semibold text-[#302B34]">
            What went well?
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {feedbackOptions.map(
              (item) => {
                const selected =
                  feedback.includes(item);

                return (
                  <motion.button
                    key={item}
                    type="button"
                    whileTap={{
                      scale: 0.95,
                    }}
                    onClick={() =>
                      toggleFeedback(item)
                    }
                    className={`
                      rounded-full
                      border px-4 py-2.5
                      text-[13px]
                      font-medium
                      transition-colors

                      ${
                        selected
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

        <div className="mt-7">
          <label className="text-[15px] font-semibold text-[#302B34]">
            Additional feedback
          </label>

          <textarea
            value={comment}
            onChange={(event) =>
              setComment(
                event.target.value,
              )
            }
            placeholder="Tell us more about your ride..."
            rows={5}
            className="mt-3 w-full resize-none rounded-[16px] border border-[#E5E0E8] bg-white p-4 text-[16px] outline-none transition focus:border-[#9E76C7] focus:ring-4 focus:ring-[#7442AD]/5"
          />
        </div>

        <motion.button
          type="button"
          disabled={
            rating === 0 ||
            submitted
          }
          whileTap={
            rating > 0
              ? { scale: 0.98 }
              : undefined
          }
          onClick={submit}
          className="mt-7 flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:opacity-40"
        >
          {submitted ? (
            <>
              <Check size={19} />
              Submitted
            </>
          ) : (
            "Submit"
          )}
        </motion.button>
      </main>
    </div>
  );
}