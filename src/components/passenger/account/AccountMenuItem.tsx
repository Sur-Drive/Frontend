import {
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

interface Props {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}

export default function AccountMenuItem({
  icon: Icon,
  label,
  danger = false,
  onClick,
}: Props) {
  return (
    <motion.button
      type="button"
      whileTap={{
        scale: 0.985,
      }}
      onClick={onClick}
      className="flex min-h-[60px] w-full items-center gap-3 border-b border-[#F1EDF3] px-4 text-left last:border-b-0"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${
          danger
            ? "bg-[#FFECEE] text-[#F05A69]"
            : "bg-[#F1EAF8] text-[#7442AD]"
        }`}
      >
        <Icon size={19} />
      </span>

      <span
        className={`flex-1 text-[15px] font-medium ${
          danger
            ? "text-[#F05A69]"
            : "text-[#302B34]"
        }`}
      >
        {label}
      </span>

      {!danger && (
        <ChevronRight
          size={18}
          className="text-[#A9A1AE]"
        />
      )}
    </motion.button>
  );
}