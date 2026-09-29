import {
  ChevronRight,
  ContactRound,
  KeyRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";
import { usePassengerSafety } from "../../../../context/PassengerSafetyContext";

export default function PassengerSafety() {
  const navigate = useNavigate();

  const {
    pickupCodeEnabled,
    emergencyContacts,
  } = usePassengerSafety();

  return (
    <div className="min-h-[100dvh] bg-white">
      <RideHeader
        title="Safety"
        onBack={() =>
          navigate(
            "/passenger/account",
          )
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-5 sm:px-7">
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="overflow-hidden rounded-[17px] bg-white shadow-[0_5px_28px_rgba(30,20,38,0.055)]"
        >
          <motion.button
            type="button"
            whileTap={{
              scale: 0.99,
            }}
            onClick={() =>
              navigate(
                "/passenger/account/safety/pickup-code",
              )
            }
            className="flex min-h-[76px] w-full items-center gap-3 border-b border-[#EEEAF1] px-4 py-3 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#F1EAF7] text-[#7442AD]">
              <KeyRound
                size={20}
              />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[#302B34]">
                Pick-up code
              </span>

              <span
                className={`mt-1 block text-[13px] font-medium ${
                  pickupCodeEnabled
                    ? "text-[#369260]"
                    : "text-[#918B95]"
                }`}
              >
                {pickupCodeEnabled
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </span>

            <ChevronRight
              size={19}
              className="text-[#AAA4AE]"
            />
          </motion.button>

          <motion.button
            type="button"
            whileTap={{
              scale: 0.99,
            }}
            onClick={() =>
              navigate(
                "/passenger/account/safety/emergency-contacts",
              )
            }
            className="flex min-h-[76px] w-full items-center gap-3 px-4 py-3 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#F1EAF7] text-[#7442AD]">
              <ContactRound
                size={20}
              />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[#302B34]">
                Emergency contact
              </span>

              <span className="mt-1 block text-[13px] text-[#918B95]">
                {emergencyContacts.length ===
                0
                  ? "None Added"
                  : `${emergencyContacts.length} ${
                      emergencyContacts.length ===
                      1
                        ? "contact"
                        : "contacts"
                    } added`}
              </span>
            </span>

            <ChevronRight
              size={19}
              className="text-[#AAA4AE]"
            />
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
}