import {
  motion,
} from "framer-motion";
import { useNavigate } from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";
import { usePassengerSafety } from "../../../../context/PassengerSafetyContext";

export default function PickupCode() {
  const navigate = useNavigate();

  const {
    pickupCodeEnabled,
    setPickupCodeEnabled,
  } = usePassengerSafety();

  return (
    <div className="min-h-[100dvh] bg-white">
      <RideHeader
        title="Pick-up code"
        onBack={() =>
          navigate(
            "/passenger/account/safety",
          )
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-5 sm:px-7">
        <p className="max-w-[500px] text-[14px] leading-6 text-[#918B95]">
          Verify your ride with a unique code.
          Match the code with your driver before
          getting in to make sure you're in the
          right vehicle with the right driver.
        </p>

        <div className="mt-6 flex min-h-[64px] items-center justify-between rounded-[15px] bg-[#FAF9FB] px-4">
          <span className="text-[15px] font-medium text-[#302B34]">
            Enable Pick-up code
          </span>

          <motion.button
            type="button"
            role="switch"
            aria-checked={
              pickupCodeEnabled
            }
            whileTap={{
              scale: 0.94,
            }}
            onClick={() =>
              setPickupCodeEnabled(
                !pickupCodeEnabled,
              )
            }
            className={`relative h-[30px] w-[52px] rounded-full transition-colors ${
              pickupCodeEnabled
                ? "bg-[#7442AD]"
                : "bg-[#DDDCE2]"
            }`}
          >
            <motion.span
              animate={{
                x: pickupCodeEnabled
                  ? 24
                  : 3,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
              className="absolute left-0 top-[3px] h-6 w-6 rounded-full bg-white shadow-sm"
            />
          </motion.button>
        </div>

        {pickupCodeEnabled && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-4 rounded-[14px] bg-[#F1EAF7] p-4"
          >
            <p className="text-[14px] leading-6 text-[#695A78]">
              Pick-up verification will be required
              before your future rides can begin.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}