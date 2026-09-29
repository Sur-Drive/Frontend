import {
  MapPin,
  Navigation,
} from "lucide-react";
import { motion } from "framer-motion";

interface LocationMarkerProps {
  type?: "pickup" | "destination" | "current";
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function LocationMarker({
  type = "destination",
  pulse = false,
  size = "md",
}: LocationMarkerProps) {
  const dimensions = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSize = {
    sm: 15,
    md: 18,
    lg: 21,
  };

  const current = type === "current";
  const pickup = type === "pickup";

  return (
    <div className="relative inline-flex shrink-0">
      {pulse && (
        <>
          <motion.span
            animate={{
              scale: [1, 1.9],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className={`
              absolute inset-0 rounded-full
              ${
                current || pickup
                  ? "bg-[#7442AD]"
                  : "bg-[#302B34]"
              }
            `}
          />

          <motion.span
            animate={{
              scale: [1, 1.55],
              opacity: [0.25, 0],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: 0.5,
              ease: "easeOut",
            }}
            className={`
              absolute inset-0 rounded-full
              ${
                current || pickup
                  ? "bg-[#7442AD]"
                  : "bg-[#302B34]"
              }
            `}
          />
        </>
      )}

      <motion.span
        animate={
          pulse
            ? {
                scale: [1, 1.06, 1],
              }
            : undefined
        }
        transition={{
          duration: 1.4,
          repeat: Infinity,
        }}
        className={`
          relative flex ${dimensions[size]}
          items-center justify-center rounded-full
          border-[3px] border-white
          shadow-[0_5px_18px_rgba(35,24,42,0.18)]
          ${
            current || pickup
              ? "bg-[#7442AD] text-white"
              : "bg-[#302B34] text-white"
          }
        `}
      >
        {current || pickup ? (
          <Navigation size={iconSize[size]} />
        ) : (
          <MapPin size={iconSize[size]} />
        )}
      </motion.span>
    </div>
  );
}