import {
  ChevronDown,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";
import RelationshipSheet from "../../../../components/passenger/safety/RelationshipSheet";

import {
  usePassengerSafety,
  type EmergencyRelationship,
} from "../../../../context/PassengerSafetyContext";

export default function AddEmergencyContact() {
  const navigate = useNavigate();

  const {
    addEmergencyContact,
  } = usePassengerSafety();

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    relationship,
    setRelationship,
  ] =
    useState<EmergencyRelationship | null>(
      null,
    );

  const [
    relationshipOpen,
    setRelationshipOpen,
  ] = useState(false);

  const isValid =
    useMemo(() => {
      const cleanPhone =
        phone.replace(
          /\D/g,
          "",
        );

      return (
        name.trim().length >=
          2 &&
        cleanPhone.length >=
          10 &&
        relationship !== null
      );
    }, [
      name,
      phone,
      relationship,
    ]);

  const saveContact = () => {
    if (
      !isValid ||
      !relationship
    ) {
      return;
    }

    const cleanPhone =
      phone.replace(
        /\D/g,
        "",
      );

    addEmergencyContact({
      name:
        name.trim(),
      phone: `+234 ${cleanPhone}`,
      relationship,
    });

    navigate(
      "/passenger/account/safety/emergency-contacts",
      {
        replace: true,
      },
    );
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <RideHeader
        title="Add contact"
        onBack={() =>
          navigate(
            "/passenger/account/safety/emergency-contacts",
          )
        }
      />

      <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col px-5 pb-[calc(90px+env(safe-area-inset-bottom))] pt-5 sm:px-7">
        {/* NAME */}

        <label className="flex min-h-[58px] items-center gap-3 rounded-[13px] bg-[#F6F5F6] px-4">
          <UserRound
            size={18}
            className="shrink-0 text-[#7442AD]"
          />

          <input
            value={name}
            onChange={(
              event,
            ) =>
              setName(
                event.target
                  .value,
              )
            }
            placeholder="Full Name"
            autoComplete="name"
            className="w-full bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#C3BEC6]"
          />
        </label>

        {/* PHONE */}

        <div className="mt-3 flex gap-2">
          <div className="flex h-[58px] shrink-0 items-center gap-2 rounded-[13px] bg-[#F6F5F6] px-3">
            <span
              aria-hidden="true"
              className="text-[17px]"
            >
              🇳🇬
            </span>

            <span className="text-[14px] font-medium text-[#514B55]">
              +234
            </span>
          </div>

          <label className="flex h-[58px] min-w-0 flex-1 items-center gap-3 rounded-[13px] bg-[#F6F5F6] px-4">
            <Phone
              size={17}
              className="shrink-0 text-[#7442AD]"
            />

            <input
              value={phone}
              onChange={(
                event,
              ) =>
                setPhone(
                  event.target.value
                    .replace(
                      /\D/g,
                      "",
                    )
                    .slice(
                      0,
                      10,
                    ),
                )
              }
              inputMode="tel"
              autoComplete="tel"
              placeholder="803 660 0027"
              className="w-full bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#C3BEC6]"
            />
          </label>
        </div>

        {/* RELATIONSHIP */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.99,
          }}
          onClick={() =>
            setRelationshipOpen(
              true,
            )
          }
          className="mt-3 flex min-h-[58px] w-full items-center gap-3 rounded-[13px] bg-[#F6F5F6] px-4 text-left"
        >
          <UsersRound
            size={18}
            className="shrink-0 text-[#7442AD]"
          />

          <span
            className={`min-w-0 flex-1 text-[15px] ${
              relationship
                ? "font-medium text-[#302B34]"
                : "text-[#C3BEC6]"
            }`}
          >
            {relationship ??
              "Select Relationship"}
          </span>

          <ChevronDown
            size={18}
            className="text-[#AAA4AE]"
          />
        </motion.button>

        {/* PRIVACY */}

        <p className="mt-5 text-[13px] leading-5 text-[#918B95]">
          By adding a trusted
          contact, you confirm they
          know you've provided their
          details to Sur Drive. We
          may contact them in an
          emergency if you're
          unreachable. For more
          information, please see
          the Sur Drive{" "}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/passenger/account/legal/privacy",
              )
            }
            className="font-semibold text-[#7442AD]"
          >
            Privacy Policy.
          </button>
        </p>
      </main>

      {/* FIXED SAVE BUTTON */}

      <div className="fixed inset-x-0 bottom-0 z-[100] bg-white px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <motion.button
          type="button"
          disabled={
            !isValid
          }
          whileTap={
            isValid
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={
            saveContact
          }
          className="mx-auto block h-[56px] w-full max-w-[640px] rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_25px_rgba(116,66,173,0.22)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add contact
        </motion.button>
      </div>

      <RelationshipSheet
        open={
          relationshipOpen
        }
        selected={
          relationship
        }
        onClose={() =>
          setRelationshipOpen(
            false,
          )
        }
        onSelect={
          setRelationship
        }
      />
    </div>
  );
}