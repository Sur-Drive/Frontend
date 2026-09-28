import {
  ChevronRight,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  LucideIcon,
} from "lucide-react";

interface SupportRowProps {
  icon: LucideIcon;

  title: string;

  description: string;

  onClick?: () => void;

  trailing?: React.ReactNode;

  showChevron?: boolean;
}

export default function SupportRow({
  icon: Icon,
  title,
  description,
  onClick,
  trailing,
  showChevron = true,
}: SupportRowProps) {
  return (
    <motion.div
      whileTap={
        onClick
          ? {
              scale: 0.995,
            }
          : undefined
      }
      className="
        flex
        w-full
        items-center
        border-b
        border-[#EEEAF0]
        last:border-b-0
      "
    >
      {/* MAIN CLICKABLE AREA */}

      <button
        type="button"
        onClick={
          onClick
        }
        disabled={
          !onClick
        }
        className="
          flex
          min-w-0
          flex-1
          items-center
          gap-3
          px-3
          py-4
          text-left
          disabled:cursor-default
        "
      >
        {/* ICON */}

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-[10px]
            bg-[#F1E9FA]
            text-[#7442AD]
          "
        >
          <Icon
            size={19}
            strokeWidth={1.9}
          />
        </div>

        {/* TEXT */}

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-[#302B34]">
            {title}
          </p>

          <p className="mt-0.5 truncate text-[13px] leading-5 text-[#817A85]">
            {description}
          </p>
        </div>

        {/* CHEVRON */}

        {!trailing &&
          showChevron && (
            <ChevronRight
              size={18}
              strokeWidth={1.8}
              className="shrink-0 text-[#AAA4AE]"
            />
          )}
      </button>

      {/* SEPARATE TRAILING ACTION */}

      {trailing && (
        <div className="shrink-0 pr-3">
          {trailing}
        </div>
      )}
    </motion.div>
  );
}