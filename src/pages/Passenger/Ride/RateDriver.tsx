import {
  Check,
  Star,
  LoaderCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import RideHeader from "../../../components/passenger/ride/RideHeader";
import DriverCard from "../../../components/passenger/ride/DriverCard";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  passengerRideApi,
  type PassengerRideResponse,
} from "../../../api/passenger/rides";

import {
  passengerApi,
} from "../../../api/passenger/passengerClient";

import {
  clearActiveRide,
  getStoredActiveRide,
  getStoredActiveRideId,
  storeActiveRide,
} from "../../../utils/passengerActiveRide";
import { useRideDriverDetails } from "../../../hooks/passenger/useRideDriverDetails";

type StoredDriverDetails = {
  rideId: string;

  driver?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    profilePicture?: string;
    rating?: number;
    totalCompletedRides?: number;
  };

  vehicle?: {
    make?: string;
    model?: string;
    color?: string;
    plateNumber?: string;
    category?: string;
    capacity?: number;
  };
};

function getStoredDriverDetails(
  rideId: string | null | undefined,
): StoredDriverDetails | null {
  if (!rideId) return null;

  try {
    const raw = sessionStorage.getItem(
      `surdrive_driver_details_${rideId}`,
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredDriverDetails;

    return parsed.rideId === rideId ? parsed : null;
  } catch {
    return null;
  }
}

/* =========================================================
   CONFIGURATION
========================================================= */

const HOME_ROUTE = "/passenger/home";

/* =========================================================
   FEEDBACK OPTIONS
========================================================= */

const feedbackOptions = [
  "Clean Car",
  "Professional",
  "Smooth driving",
  "On time",
  "Great conversation",
  "Friendly",
  "Driver asked for extra fee",
];

/* =========================================================
   BACKEND TAG MAPPING
========================================================= */

const backendRatingTags: Record<string, string> = {
  "Clean Car": "Clean Car",
  Professional: "Professional",
  "Smooth driving": "Smooth Driving",
  "On time": "On Time",
  "Great conversation": "Great Conversation",
  Friendly: "Friendly",
  "Driver asked for extra fee":
    "Driver Asked For Extra Fee",
};

/* =========================================================
   TYPES
========================================================= */

type RatingPayload = {
  stars: number;
  comment?: string;
  tags: string[];
};

/* =========================================================
   RATING API
========================================================= */

async function submitDriverRating(
  rideId: string,
  payload: RatingPayload,
): Promise<void> {
  await passengerApi.post(
    `/rides/${encodeURIComponent(rideId)}/ratings/driver`,
    payload,
    {
      authMode: "access",
    },
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RateDriver() {
  const navigate = useNavigate();

  const {
    ride,
    resetRide,
  } = usePassengerRide();

  /* =======================================================
     STATE
  ======================================================= */

  const [backendRide, setBackendRide] =
    useState<PassengerRideResponse | null>(
      () => getStoredActiveRide(),
    );

  const [rating, setRating] = useState(0);

  const [comment, setComment] = useState("");

  const [feedback, setFeedback] =
    useState<string[]>([]);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [loadingRide, setLoadingRide] =
    useState(true);

  const [loadError, setLoadError] =
    useState(false);

  const [showSuccess, setShowSuccess] =
    useState(false);

  /* =======================================================
     RIDE ID
  ======================================================= */

  const rideId =
    backendRide?.id ??
    getStoredActiveRideId();

    const contextDriver =
  ride.driver?.id &&
  backendRide?.driverId === ride.driver.id
    ? ride.driver
    : null;

const {
  driver: driverForCard,
  loading: driverLoading,
  error: driverError,
} = useRideDriverDetails(
  rideId,
  backendRide,
  contextDriver,
);

    const [storedDriverDetails] = useState(() =>
  getStoredDriverDetails(rideId),
);

  /* =======================================================
     RESTORE COMPLETED RIDE
  ======================================================= */

  const loadRide = useCallback(async () => {
    if (!rideId) {
      setLoadingRide(false);
      return;
    }

    setLoadingRide(true);

    try {
      const response =
        await passengerRideApi.getRide(rideId);

      setBackendRide(response);

      storeActiveRide(response);

      setLoadError(false);
    } catch (error) {
      console.error(
        "RATE DRIVER LOAD ERROR:",
        error,
      );

      setLoadError(true);
    } finally {
      setLoadingRide(false);
    }
  }, [rideId]);

  useEffect(() => {
    void loadRide();
  }, [loadRide]);

  /* =======================================================
     DRIVER

     Prefer context driver, then backend driver.
  ======================================================= */

  // const driver = useMemo(() => {
  //   if (ride.driver) {
  //     return ride.driver;
  //   }

  //   const backendDriver = backendRide?.driver;

  //   if (!backendDriver) {
  //     return null;
  //   }

  //   const resolvedDriverId =
  //     backendDriver.id ??
  //     backendRide?.driverId;

  //   if (!resolvedDriverId) {
  //     return null;
  //   }

  //   return {
  //     id: resolvedDriverId,

  //     firstName:
  //       backendDriver.firstName ?? "Driver",

  //     photo:
  //       backendDriver.profilePicture ?? "",

  //     rating:
  //       backendDriver.rating ?? 0,

  //     totalTrips: 0,

  //     vehicle: {
  //       make:
  //         backendRide?.vehicle?.make ?? "",

  //       model:
  //         backendRide?.vehicle?.model ?? "",

  //       color:
  //         backendRide?.vehicle?.color ?? "",

  //       plateNumber:
  //         backendRide?.vehicle?.plateNumber ?? "",
  //     },
  //   };
  // }, [ride.driver, backendRide]);

  const driver = useMemo(() => {
  const storedDriver = storedDriverDetails?.driver;

  const backendDriver = backendRide?.driver;

  const contextDriver = ride.driver;

  const resolvedDriverId =
    storedDriver?.id ??
    backendDriver?.id ??
    contextDriver?.id ??
    backendRide?.driverId;

  if (!resolvedDriverId) {
    return null;
  }

  const vehicle =
    storedDriverDetails?.vehicle ??
    backendRide?.vehicle ??
    contextDriver?.vehicle;

  const fullName =
    storedDriver?.fullName ??
    [
      storedDriver?.firstName,
      storedDriver?.lastName,
    ]
      .filter(Boolean)
      .join(" ");

  return {
    id: resolvedDriverId,

    firstName:
      fullName ||
      backendDriver?.firstName ||
      contextDriver?.firstName ||
      "Your driver",

    photo:
      storedDriver?.profilePicture ??
      backendDriver?.profilePicture ??
      contextDriver?.photo ??
      "",

    rating:
      storedDriver?.rating ??
      backendDriver?.rating ??
      contextDriver?.rating ??
      0,

    totalTrips:
      storedDriver?.totalCompletedRides ??
      contextDriver?.totalTrips ??
      0,

    vehicle: {
      make: vehicle?.make ?? "",
      model: vehicle?.model ?? "",
      color: vehicle?.color ?? "",
      plateNumber: vehicle?.plateNumber ?? "",
      category: vehicle?.category ?? "",
      capacity: vehicle?.capacity ?? null,
    },
  };
}, [
  storedDriverDetails,
  backendRide,
  ride.driver,
]);

  /* =======================================================
     FEEDBACK SELECTION
  ======================================================= */

  const toggleFeedback = (item: string) => {
    if (submitting || submitted) {
      return;
    }

    setFeedback((previous) =>
      previous.includes(item)
        ? previous.filter(
            (value) => value !== item,
          )
        : [...previous, item],
    );
  };

  /* =======================================================
     COMPLETE RIDE SESSION

     Only after success or explicit skip.
  ======================================================= */

//   const finishRide = () => {
//   if (rideId) {
//     sessionStorage.removeItem(
//       `surdrive_driver_details_${rideId}`,
//     );
//   }

//   clearActiveRide();

//   resetRide();

//   navigate(HOME_ROUTE, {
//     replace: true,
//   });
// };

const finishRide = () => {
  clearActiveRide();
  resetRide();

  navigate("/passenger/home", {
    replace: true,
  });
};
  /* =======================================================
     SUBMIT RATING
  ======================================================= */

  const submit = async () => {
    if (submitting || submitted) {
      return;
    }

    if (!rideId) {
      toast.error(
        "Unable to identify this ride.",
      );
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error(
        "Please select a rating.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload: RatingPayload = {
        stars: rating,

        comment:
          comment.trim() || undefined,

        tags: feedback.map(
          (item) =>
            backendRatingTags[item] ?? item,
        ),
      };

      await submitDriverRating(
        rideId,
        payload,
      );

      setSubmitted(true);
      setShowSuccess(true);

      toast.success(
        "Thank you for your feedback!",
      );
    } catch (error) {
      console.error(
        "SUBMIT DRIVER RATING ERROR:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to submit your rating. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     ROUTE GUARD
  ======================================================= */

  if (!rideId) {
    return (
      <Navigate
        to={HOME_ROUTE}
        replace
      />
    );
  }

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (
  (loadingRide || driverLoading) &&
  !driverForCard
) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F8F8FA]">
        <div className="text-center">
          <LoaderCircle
            size={32}
            className="mx-auto animate-spin text-[#7442AD]"
          />

          <p className="mt-4 text-[14px] text-[#918B95]">
            Loading your driver...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR STATE
  ======================================================= */

  if (!driverForCard) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#F8F8FA]">
        <RideHeader title="Rate Your Driver" />

        <main className="flex items-center justify-center flex-1 px-5">
          <div className="w-full max-w-[360px] text-center">
            <AlertCircle
              size={35}
              className="mx-auto text-[#7442AD]"
            />

            <h2 className="mt-4 text-[19px] font-semibold text-[#302B34]">
              Driver information unavailable
            </h2>

            <p className="mt-2 text-[14px] leading-6 text-[#918B95]">
              {loadError || driverError
              ? "We couldn't load your driver's information. Please try again."
              : "Driver information is unavailable for this ride."}
            </p>

            <button
              type="button"
              onClick={() => void loadRide()}
              className="mt-6 h-[52px] w-full rounded-[14px] bg-[#7442AD] text-[15px] font-semibold text-white"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={finishRide}
              className="mt-3 h-[48px] w-full text-[14px] font-semibold text-[#817A85]"
            >
              Skip Rating
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-[100dvh] bg-[#F8F8FA]">

      <RideHeader title="Rate Your Driver" />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-5 sm:px-7">

        {/* DRIVER CARD */}

        <DriverCard
          driver={driverForCard}
          showActions={false}
        />

        {/* RATING */}

        <div className="mt-8 text-center">

          <h2 className="text-[21px] font-semibold text-[#302B34]">
            How was your ride?
          </h2>

          <p className="mt-2 text-[14px] text-[#918B95]">
            Your feedback helps improve the Sur-Drive experience.
          </p>

          <div className="flex justify-center gap-2 mt-6">

            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                aria-label={`Rate ${star} stars`}
                aria-pressed={rating === star}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.88 }}
                disabled={submitting || submitted}
                onClick={() => setRating(star)}
                className="p-1 disabled:cursor-not-allowed"
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
            ))}

          </div>

          {rating > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-[14px] font-medium text-[#7442AD]"
            >
              {rating === 5
                ? "Excellent!"
                : rating === 4
                  ? "Very Good!"
                  : rating === 3
                    ? "Good"
                    : rating === 2
                      ? "Could Be Better"
                      : "Poor Experience"}
            </motion.p>
          )}

        </div>

        {/* FEEDBACK TAGS */}

        <div className="mt-8">

          <p className="text-[15px] font-semibold text-[#302B34]">
            What stood out?
          </p>

          <div className="flex flex-wrap gap-2 mt-3">

            {feedbackOptions.map((item) => {
              const selected = feedback.includes(item);

              return (
                <motion.button
                  key={item}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  disabled={submitting || submitted}
                  onClick={() => toggleFeedback(item)}
                  className={`rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${
                    selected
                      ? "border-[#7442AD] bg-[#7442AD] text-white"
                      : "border-[#DED8E2] bg-white text-[#625C66]"
                  }`}
                >
                  {item}
                </motion.button>
              );
            })}

          </div>

        </div>

        {/* ADDITIONAL FEEDBACK */}

        <div className="mt-7">

          <label
            htmlFor="driver-rating-comment"
            className="text-[15px] font-semibold text-[#302B34]"
          >
            Additional feedback
          </label>

          <textarea
            id="driver-rating-comment"
            value={comment}
            onChange={(event) =>
              setComment(event.target.value)
            }
            placeholder="Tell us more about your ride..."
            rows={5}
            maxLength={1000}
            disabled={submitting || submitted}
            className="mt-3 w-full resize-none rounded-[16px] border border-[#E5E0E8] bg-white p-4 text-[16px] outline-none transition focus:border-[#9E76C7] focus:ring-4 focus:ring-[#7442AD]/5 disabled:opacity-60"
          />

          <p className="mt-2 text-right text-[12px] text-[#A19AA5]">
            {comment.length}/1000
          </p>

        </div>

        {/* SUBMIT BUTTON */}

        <motion.button
          type="button"
          disabled={
            rating === 0 ||
            submitting ||
            submitted
          }
          whileTap={
            rating > 0 && !submitting
              ? { scale: 0.98 }
              : undefined
          }
          onClick={() => void submit()}
          className="mt-7 flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:opacity-40"
        >
          {submitting ? (
            <>
              <LoaderCircle
                size={19}
                className="animate-spin"
              />
              Submitting...
            </>
          ) : submitted ? (
            <>
              <Check size={19} />
              Submitted
            </>
          ) : (
            "Submit Rating"
          )}
        </motion.button>

        {/* SKIP RATING */}

        {!submitted && (
          <button
            type="button"
            disabled={submitting}
            onClick={finishRide}
            className="mt-3 h-[48px] w-full text-[14px] font-semibold text-[#817A85] disabled:opacity-50"
          >
            Skip for Now
          </button>
        )}

      </main>

      {/* SUCCESS MODAL */}

      <AnimatePresence>

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#211927]/45 px-5 backdrop-blur-[5px]"
          >

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 20,
              }}
              className="w-full max-w-[390px] rounded-[26px] bg-white px-6 py-8 text-center"
            >

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E4F7EA] text-[#36A665]">
                <Check
                  size={39}
                  strokeWidth={3}
                />
              </div>

              <h2 className="mt-5 text-[23px] font-semibold text-[#302B34]">
                Thank You!
              </h2>

              <p className="mt-2 text-[14px] leading-6 text-[#918B95]">
                Your rating has been submitted successfully.
                Thank you for helping improve SurDrive.
              </p>

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={finishRide}
                className="mt-7 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
              >
                Back to Home
                <ArrowRight size={19} />
              </motion.button>

            </motion.div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
