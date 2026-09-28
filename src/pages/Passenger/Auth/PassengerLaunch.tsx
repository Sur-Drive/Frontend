import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../../../assets/logo.png";

export default function PassengerLaunch() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/passenger/signup", { replace: true });
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="
        fixed inset-0 z-[9999]
        flex h-[100dvh] w-screen
        flex-col overflow-hidden
        bg-[#6E43A3]
      "
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 0.12, 0.07],
            scale: [0.6, 1.15, 1],
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
          }}
          className="
            absolute left-1/2 top-1/2
            h-[500px] w-[500px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full bg-white blur-[120px]
          "
        />
      </div>

      {/* Safe-area top */}
      <div className="h-[env(safe-area-inset-top)] shrink-0" />

      {/* Logo */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
            scale: 0.92,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.75,
            delay: 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="
            flex w-full max-w-[300px]
            items-center justify-center gap-2.5
          "
        >
          <motion.img
            src={logo}
            alt="SUR-DRIVE logo"
            className="
              h-11 w-11 shrink-0 object-contain
              sm:h-12 sm:w-12
            "
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div>
            <h1
              className="
                whitespace-nowrap
                text-xl font-extrabold
                leading-none tracking-tight
                text-white
                sm:text-2xl
              "
            >
              SUR-DRIVE
              <sup
                className="
                  ml-0.5 align-super
                  text-[7px] text-yellow-400
                  sm:text-[8px]
                "
              >
                HT
              </sup>
            </h1>

            <p
              className="
                mt-1 text-[8px]
                font-bold tracking-[0.17em]
                text-yellow-400
                sm:text-[9px]
              "
            >
              YOUR ROAD. YOUR GUIDE.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom home indicator */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.5 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.65,
        }}
        className="
          relative z-10
          mx-auto mb-[max(0.75rem,env(safe-area-inset-bottom))]
          h-1 w-32
          shrink-0 rounded-full
          bg-white/80
        "
      />
    </motion.div>
  );
}