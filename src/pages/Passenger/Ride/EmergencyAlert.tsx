import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import {
  motion,
} from "framer-motion";



import {
  useState,
} from "react";

import RideHeader from "../../../components/passenger/ride/RideHeader";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";
import { useNavigate } from "react-router-dom";

export default function EmergencyAlert() {
  const navigate = useNavigate();

  const {
    ride,
  } = usePassengerRide();

  const [
    cancelled,
    setCancelled,
  ] = useState(false);

  const cancelAlert = () => {
    setCancelled(true);

    window.setTimeout(() => {
      navigate(
        "/passenger/ride/safety",
        {
          replace: true,
        },
      );
    }, 700);
  };

  return (
    <div
      className="
        min-h-[100dvh]
        bg-[#FAF9FB]
      "
    >
      <RideHeader
        title="Emergency Alert"
        onBack={() =>
          navigate(
            "/passenger/ride/safety",
          )
        }
      />

      <main
        className="
          mx-auto
          w-full
          max-w-[680px]
          px-5
          pb-10
          pt-5
          sm:px-7
        "
      >
        {/* ===================================
            ALERT STATUS
        =================================== */}

        <section className="text-center">
          <div
            className="
              relative
              mx-auto
              flex
              h-[88px]
              w-[88px]
              items-center
              justify-center
            "
          >
            <motion.span
              animate={{
                scale: [
                  0.9,
                  1.35,
                ],
                opacity: [
                  0.45,
                  0,
                ],
              }}
              transition={{
                duration: 1.6,
                repeat:
                  Infinity,
                ease: "easeOut",
              }}
              className="
                absolute
                inset-0
                rounded-full
                bg-[#FF5A4F]/15
              "
            />

            <motion.span
              animate={{
                scale: [
                  0.9,
                  1.18,
                  0.9,
                ],
              }}
              transition={{
                duration: 1.4,
                repeat:
                  Infinity,
              }}
              className="
                absolute
                inset-[12px]
                rounded-full
                bg-[#FFE1DE]
              "
            />

            <div
              className="
                relative
                flex
                h-[48px]
                w-[48px]
                items-center
                justify-center
                rounded-full
                bg-[#FFEEE9]
                text-[#F4544B]
              "
            >
              <ShieldAlert
                size={23}
              />
            </div>
          </div>

          <motion.p
            animate={{
              opacity: [
                1,
                0.65,
                1,
              ],
            }}
            transition={{
              duration: 1.4,
              repeat:
                Infinity,
            }}
            className="
              mt-2
              text-[14px]
              font-bold
              uppercase
              tracking-[0.04em]
              text-[#E84943]
            "
          >
            Alert Active
          </motion.p>
        </section>

        {/* ===================================
            CONTACTS
        =================================== */}

        <section
          className="
            mt-6
            rounded-[18px]
            bg-white
            p-4
            shadow-[0_5px_25px_rgba(30,20,38,0.04)]
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              border-b
              border-[#EEEAF1]
              pb-3
            "
          >
            <UsersRound
              size={19}
              className="text-[#E9514B]"
            />

            <h2
              className="
                text-[15px]
                font-semibold
                text-[#302B34]
              "
            >
              Notified Contacts
            </h2>
          </div>

          <EmergencyContact
            name="Pumpkin 🎃"
            phone="+234 812 456 8901"
            relation="Spouse or partner"
          />

          <div className="h-px bg-[#F0EDF2]" />

          <EmergencyContact
            name="Adeniji Junior"
            phone="+234 812 456 8901"
            relation="Sibling"
          />
        </section>

        {/* ===================================
            SAFETY DESK
        =================================== */}

        <section
          className="
            mt-4
            rounded-[18px]
            bg-white
            p-4
            shadow-[0_5px_25px_rgba(30,20,38,0.04)]
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <ShieldCheck
                size={19}
                className="text-[#7442AD]"
              />

              <h2
                className="
                  text-[15px]
                  font-semibold
                  text-[#302B34]
                "
              >
                Safety Desk
                Active
              </h2>
            </div>

            <span
              className="
                text-[13px]
                font-medium
                text-[#928B96]
              "
            >
              Just now
            </span>
          </div>

          <p
            className="
              mt-3
              text-[14px]
              leading-6
              text-[#7D7681]
            "
          >
            Our 24/7 dedicated
            support team has
            received your
            distress signal and
            is tracking your
            vehicle's live
            coordinates.
          </p>
        </section>

        {/* ===================================
            LOCATION
        =================================== */}

        <section
          className="
            mt-4
            flex
            items-start
            gap-3
            rounded-[18px]
            bg-white
            p-4
            shadow-[0_5px_25px_rgba(30,20,38,0.04)]
          "
        >
          <span
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#FFF5DD]
              text-[#D99B17]
            "
          >
            <MapPin
              size={20}
            />
          </span>

          <div>
            <h2
              className="
                text-[15px]
                font-semibold
                text-[#302B34]
              "
            >
              Live Location
              Shared
            </h2>

            <p
              className="
                mt-1
                text-[13px]
                leading-5
                text-[#96909A]
              "
            >
              Your current trip
              location is being
              shared with your
              emergency contacts
              and Sur-Drive
              safety team.
            </p>
          </div>
        </section>

        {/* ===================================
            EMERGENCY CALL
        =================================== */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.985,
          }}
          className="
            mt-5
            flex
            h-[58px]
            w-full
            items-center
            rounded-[13px]
            bg-[#FF5A42]
            px-2
            text-white
            shadow-[0_10px_25px_rgba(255,90,66,0.24)]
          "
        >
          <motion.span
            animate={{
              x: [
                0,
                7,
                0,
              ],
            }}
            transition={{
              duration: 1.2,
              repeat:
                Infinity,
            }}
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-[10px]
              bg-white
              text-[#FF5A42]
            "
          >
            <ChevronRight
              size={24}
            />
          </motion.span>

          <span
            className="
              flex-1
              pr-8
              text-center
              text-[15px]
              font-semibold
            "
          >
            Call Emergency
            Services
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{
            scale: 0.985,
          }}
          onClick={
            cancelAlert
          }
          disabled={
            cancelled
          }
          className="
            mt-3
            flex
            h-[54px]
            w-full
            items-center
            justify-center
            gap-2
            rounded-[13px]
            bg-[#EFE8F5]
            text-[15px]
            font-semibold
            text-[#65566F]
          "
        >
          {cancelled ? (
            <>
              <CheckCircle2
                size={19}
              />
              Alert Cancelled
            </>
          ) : (
            "Cancel Alert (False Alarm)"
          )}
        </motion.button>

        <div
          className="
            mt-5
            flex
            items-start
            gap-3
            rounded-[14px]
            bg-[#FFF1EF]
            p-4
          "
        >
          <BellRing
            size={19}
            className="
              mt-0.5
              shrink-0
              text-[#E9514B]
            "
          />

          <p
            className="
              text-[13px]
              leading-5
              text-[#80514E]
            "
          >
            Keep this screen
            open while help is
            being coordinated.
          </p>
        </div>
      </main>
    </div>
  );
}

function EmergencyContact({
  name,
  phone,
  relation,
}: {
  name: string;
  phone: string;
  relation: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        py-4
      "
    >
      <div className="min-w-0 flex-1">
        <p
          className="
            text-[15px]
            font-semibold
            text-[#302B34]
          "
        >
          {name}
        </p>

        <div
          className="
            mt-1
            flex
            flex-wrap
            items-center
            gap-x-2
            gap-y-1
            text-[13px]
            text-[#918B95]
          "
        >
          <span>
            {phone}
          </span>

          <span>
            •
          </span>

          <span>
            {relation}
          </span>
        </div>
      </div>

      <span
        className="
          rounded-full
          bg-[#EAF7EC]
          px-3
          py-1.5
          text-[13px]
          font-semibold
          text-[#3A955B]
        "
      >
        Notified
      </span>
    </div>
  );
}