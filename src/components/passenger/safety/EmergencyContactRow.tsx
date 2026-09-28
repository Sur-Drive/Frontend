import {
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

import type {
  EmergencyContact,
} from "../../../context/PassengerSafetyContext";

interface Props {
  contact: EmergencyContact;
  onClick?: () => void;
}

export default function EmergencyContactRow({
  contact,
  onClick,
}: Props) {
  return (
    <motion.button
      type="button"
      whileTap={{
        scale: 0.99,
      }}
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 border-b border-[#EEEAF1] px-4 py-3 text-left last:border-b-0"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F1EAF7] text-[15px] font-semibold text-[#7442AD]">
        {contact.name
          .charAt(0)
          .toUpperCase()}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-[#302B34]">
          {contact.name}
        </span>

        <span className="mt-1 block truncate text-[13px] text-[#817A85]">
          {contact.phone}
          <span className="mx-1.5">
            •
          </span>
          {contact.relationship}
        </span>
      </span>

      <ChevronRight
        size={18}
        className="shrink-0 text-[#AAA4AE]"
      />
    </motion.button>
  );
}