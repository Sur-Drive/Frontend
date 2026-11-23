
import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  CarFront,
  Clock3,
  Navigation2,
  Radio,
  WifiOff,
} from "lucide-react";

type Props = {
  stage: "pickup" | "trip";
  etaMinutes: number | null;
  distanceKm: number | null;
  progress: number | null;
  gpsFresh: boolean;
  hasLocation: boolean;
};

export default function LiveDriverStatus({
  stage,
  etaMinutes,
  distanceKm,
  progress,
  gpsFresh,
  hasLocation,
}: Props) {
  const approaching = stage === "pickup";

  const title = approaching
    ? "Your driver is on the way"
    : "You're on your way";

  const subtitle = !hasLocation
    ? "Waiting for driver's GPS location"
    : !gpsFresh
      ? "Updating driver's location"
      : approaching
        ? "Tracking your driver's arrival"
        : "Tracking your journey";

  const displayedMinutes =
    etaMinutes !== null &&
    Number.isFinite(etaMinutes)
      ? Math.max(0, Math.ceil(etaMinutes))
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        rounded-[22px]
        border border-[#EEE6F4]
        bg-white p-4
        shadow-[0_12px_35px_rgba(60,28,90,0.07)]
      "
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={
            gpsFresh
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(116,66,173,.2)",
                    "0 0 0 12px rgba(116,66,173,0)",
                  ],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="
            flex h-12 w-12 shrink-0
            items-center justify-center
            rounded-[15px]
            bg-[#F1E8F8]
          "
        >
          <CarFront
            size={24}
            className="text-[#7442AD]"
          />
        </motion.div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold text-[#302B34]">
            {title}
          </h3>

          <p className="mt-1 text-[13px] text-[#938B99]">
            {subtitle}
          </p>
        </div>

        <div
          className={`
            flex items-center gap-1.5
            rounded-full px-2.5 py-1.5
            text-[11px] font-semibold
            ${
              gpsFresh
                ? "bg-[#EAF7EF] text-[#278A50]"
                : "bg-[#F4F1F6] text-[#81778B]"
            }
          `}
        >
          {gpsFresh ? (
            <Radio size={12} />
          ) : (
            <WifiOff size={12} />
          )}

          {gpsFresh ? "Live" : "Updating"}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-[12px] font-medium text-[#938B99]">
            {approaching
              ? "Driver arrives in"
              : "Estimated time remaining"}
          </p>

          <div className="mt-1 flex items-baseline gap-1.5">
            <AnimatePresence mode="wait">
              <motion.span
                key={displayedMinutes ?? "unknown"}
                initial={{
                  opacity: 0,
                  y: 12,
                  filter: "blur(3px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                  filter: "blur(3px)",
                }}
                transition={{ duration: 0.25 }}
                className="
                  text-[34px] font-bold
                  tracking-[-1px]
                  text-[#7442AD]
                "
              >
                {displayedMinutes ?? "—"}
              </motion.span>
            </AnimatePresence>

            <span className="text-[14px] font-medium text-[#77717D]">
              min
            </span>
          </div>
        </div>

        <div className="text-right">
          <Navigation2
            size={19}
            className="ml-auto text-[#7442AD]"
          />

          <p className="mt-2 text-[13px] font-semibold text-[#302B34]">
            {distanceKm !== null
              ? `${distanceKm.toFixed(1)} km`
              : "—"}
          </p>

          <p className="text-[11px] text-[#938B99]">
            Remaining
          </p>
        </div>
      </div>

      {progress !== null && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[#938B99]">
            <span>Route progress</span>
            <span>
              {Math.round(progress * 100)}%
            </span>
          </div>

          <div className="h-[6px] overflow-hidden rounded-full bg-[#F0E9F5]">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${progress * 100}%`,
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
              className="h-full rounded-full bg-[#7442AD]"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
