
import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";

export default function AnimatedLocationMarker() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none relative h-[170px] w-[170px]"
      aria-label="Current location"
    >
      {/* Soft rotating light */}

      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            conic-gradient(
              from 0deg,
              transparent 0deg,
              transparent 225deg,
              rgba(137, 71, 224, 0.02) 260deg,
              rgba(137, 71, 224, 0.20) 305deg,
              transparent 345deg
            )
          `,
          filter: "blur(12px)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { rotate: 360 }
        }
        transition={{
          duration: 7,
          ease: "linear",
          repeat: Infinity,
        }}
      />

      {/* Gentle glow */}

      <motion.div
        className="absolute inset-[48px] rounded-full bg-[#8C4DDB]/20 blur-xl"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [0.9, 1.5, 0.9],
                opacity: [0.3, 0.65, 0.3],
              }
        }
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* GPS pulse */}

      <motion.div
        className="absolute inset-[62px] rounded-full border border-[#7442AD]/40"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [0.8, 2.4],
                opacity: [0.7, 0],
              }
        }
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />

      {/* Purple pin */}

      <motion.div
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -4, 0] }
        }
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          <MapPin
            size={40}
            fill="#7442AD"
            stroke="#7442AD"
            strokeWidth={1.5}
            className="drop-shadow-[0_5px_10px_rgba(116,66,173,0.3)]"
          />

          <span className="absolute left-1/2 top-[37%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        </div>
      </motion.div>
    </div>
  );
}
