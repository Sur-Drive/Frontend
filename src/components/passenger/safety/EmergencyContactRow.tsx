import {
  MoreVertical,
  Phone,
  UserRound,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  PassengerEmergencyContact,
  EmergencyRelationship,
} from "../../../api/passenger/safety";

interface Props {
  contact: PassengerEmergencyContact;
}

const relationshipLabels: Record<
  EmergencyRelationship,
  string
> = {
  spouse: "Spouse",
  parent: "Parent",
  sibling: "Sibling",
  child: "Child",
  friend: "Friend",
  relative: "Relative",
  colleague: "Colleague",
  other: "Other",
};

function formatPhoneNumber(
  phoneNumber: string,
) {
  if (!phoneNumber) {
    return "";
  }

  /*
   * +2348031234567
   * ->
   * +234 803 123 4567
   */

  const normalized =
    phoneNumber.replace(
      /\s/g,
      "",
    );

  if (
    normalized.startsWith(
      "+234",
    ) &&
    normalized.length === 14
  ) {
    return `${normalized.slice(
      0,
      4,
    )} ${normalized.slice(
      4,
      7,
    )} ${normalized.slice(
      7,
      10,
    )} ${normalized.slice(
      10,
    )}`;
  }

  return phoneNumber;
}

export default function EmergencyContactRow({
  contact,
}: Props) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 5,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="flex min-h-[76px] items-center gap-3 border-b border-[#EEEAF1] px-4 py-3"
    >
      {/* AVATAR */}

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1EAF7] text-[#7442AD]">
        <UserRound
          size={20}
        />
      </div>

      {/* CONTACT */}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[16px] font-semibold text-[#302B34]">
            {contact.name}
          </p>

          <span className="shrink-0 rounded-full bg-[#F1EAF7] px-2 py-0.5 text-[12px] font-medium text-[#7442AD]">
            {relationshipLabels[
              contact.relationship
            ] ??
              contact.relationship}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[#918B95]">
          <Phone
            size={13}
            className="shrink-0"
          />

          <span className="truncate text-[14px]">
            {formatPhoneNumber(
              contact.phoneNumber,
            )}
          </span>
        </div>
      </div>

      {/* ACTION */}

      <button
        type="button"
        aria-label={`More options for ${contact.name}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#AAA4AE] transition-colors hover:bg-[#F6F4F7]"
      >
        <MoreVertical
          size={19}
        />
      </button>
    </motion.div>
  );
}