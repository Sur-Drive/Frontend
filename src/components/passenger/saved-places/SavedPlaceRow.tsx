import {
  BriefcaseBusiness,
  ChevronRight,
  House,
  MapPin,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

interface Props {
  name: string;
  address?: string;
  type:
    | "home"
    | "work"
    | "custom";
  onClick: () => void;
}

export default function SavedPlaceRow({
  name,
  address,
  type,
  onClick,
}: Props) {
  const Icon =
    type === "home"
      ? House
      : type === "work"
        ? BriefcaseBusiness
        : MapPin;

  return (
    <motion.button
      type="button"
      whileTap={{
        scale: 0.99,
      }}
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 border-b border-[#EEEAF1] px-4 py-3 text-left last:border-b-0"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#F1EAF7] text-[#7442AD]">
        <Icon
          size={19}
          strokeWidth={1.9}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-[#302B34]">
          {name}
        </span>

        <span className="mt-1 block truncate text-[13px] text-[#7D6AA0]">
          {address ||
            (type === "home"
              ? "Tap to add your home address"
              : type === "work"
                ? "Tap to add your work address"
                : "Add a favorite location")}
        </span>
      </span>

      <ChevronRight
        size={18}
        className="shrink-0 text-[#AAA4AE]"
      />
    </motion.button>
  );
}