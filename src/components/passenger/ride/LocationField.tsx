import {
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

interface LocationFieldProps {
  type?: "pickup" | "destination" | "stop";
  value: string;
  placeholder: string;
  active?: boolean;
  removable?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onRemove?: () => void;
}

export default function LocationField({
  type = "destination",
  value,
  placeholder,
  active = false,
  removable = false,
  disabled = false,
  onChange,
  onFocus,
  onRemove,
}: LocationFieldProps) {
  const isPickup = type === "pickup";

  return (
    <div
      className={`
        flex min-h-[58px] items-center gap-3
        rounded-[15px] border bg-white px-4
        transition-all duration-200
        ${
          active
            ? "border-[#7442AD] ring-4 ring-[#7442AD]/[0.06]"
            : "border-[#E9E5EC]"
        }
      `}
    >
      <span
        className={`
          flex h-9 w-9 shrink-0
          items-center justify-center rounded-full
          ${
            isPickup
              ? "bg-[#F0E8F8] text-[#7442AD]"
              : type === "stop"
                ? "bg-[#FFF4E2] text-[#B7791F]"
                : "bg-[#F1EFF2] text-[#302B34]"
          }
        `}
      >
        {isPickup ? (
          <Navigation size={17} />
        ) : (
          <MapPin size={17} />
        )}
      </span>

      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={onFocus}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className="
          min-w-0 flex-1 bg-transparent
          text-[16px] font-medium text-[#302B34]
          outline-none placeholder:text-[#AAA4AD]
          disabled:cursor-not-allowed
        "
      />

      {removable && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={onRemove}
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-full text-[#928B96]
            hover:bg-[#F5F2F7]
          "
          aria-label="Remove stop"
        >
          <X size={18} />
        </motion.button>
      )}
    </div>
  );
}