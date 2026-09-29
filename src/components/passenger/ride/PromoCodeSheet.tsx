import {
  CheckCircle2,
  Tag,
  XCircle,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  useEffect,
  useState,
} from "react";

import RideModalSheet from "./RideModalSheet";

interface PromoCodeSheetProps {
  open: boolean;
  onClose: () => void;
  currentCode?: string;
  onApply: (code: string) => void;
}

export default function PromoCodeSheet({
  open,
  onClose,
  currentCode = "",
  onApply,
}: PromoCodeSheetProps) {
  const [code, setCode] =
    useState(currentCode);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (open) {
      setCode(currentCode);
      setError("");
    }
  }, [open, currentCode]);

  const handleApply = () => {
    const normalized =
      code.trim().toUpperCase();

    if (!normalized) {
      setError(
        "Enter a promo code first.",
      );

      return;
    }

    setError("");

    onApply(normalized);
    onClose();
  };

  const applied =
    Boolean(currentCode);

  return (
    <RideModalSheet
      open={open}
      onClose={onClose}
      title="Promo code"
      description="Enter a valid promo code to apply it to your ride."
    >
      {applied && (
        <div
          className="
            mb-4 flex items-center
            gap-3 rounded-[15px]
            bg-[#ECF8F0] p-4
            text-[#34815A]
          "
        >
          <CheckCircle2 size={20} />

          <div>
            <p className="text-[14px] font-semibold">
              Promo applied
            </p>

            <p className="mt-0.5 text-[13px]">
              {currentCode}
            </p>
          </div>
        </div>
      )}

      <div
        className={`
          flex h-[58px]
          items-center gap-3
          rounded-[15px]
          border bg-white px-4
          ${
            error
              ? "border-[#E96965]"
              : "border-[#E5E0E8]"
          }
        `}
      >
        <Tag
          size={19}
          className="shrink-0 text-[#7442AD]"
        />

        <input
          type="text"
          value={code}
          onChange={(event) => {
            setCode(
              event.target.value.toUpperCase(),
            );

            setError("");
          }}
          placeholder="Enter promo code"
          className="
            min-w-0 flex-1
            bg-transparent
            text-[16px] font-semibold
            uppercase tracking-[0.04em]
            text-[#302B34]
            outline-none
            placeholder:font-normal
            placeholder:normal-case
            placeholder:tracking-normal
            placeholder:text-[#AAA4AD]
          "
        />

        {code && (
          <button
            type="button"
            onClick={() =>
              setCode("")
            }
            className="text-[#A29CA6]"
          >
            <XCircle size={19} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{
              opacity: 0,
              y: -4,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            className="mt-2 text-[13px] text-[#D94F4B]"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-5">
        <p className="text-[13px] font-medium text-[#817A85]">
          Available promo
        </p>

        <button
          type="button"
          onClick={() =>
            setCode("EYO25")
          }
          className="
            mt-3 flex w-full
            items-center justify-between
            rounded-[15px]
            border border-dashed
            border-[#B79AD2]
            bg-[#FAF7FD]
            p-4 text-left
          "
        >
          <div>
            <p className="text-[15px] font-bold text-[#7442AD]">
              EYO25
            </p>

            <p className="mt-1 text-[12px] text-[#918B95]">
              Tap to use this promo code
            </p>
          </div>

          <Tag
            size={20}
            className="text-[#7442AD]"
          />
        </button>
      </div>

      <motion.button
        type="button"
        whileTap={{
          scale: 0.98,
        }}
        onClick={handleApply}
        className="
          mt-6 h-[56px]
          w-full rounded-[14px]
          bg-[#7442AD]
          text-[16px] font-semibold
          text-white
        "
      >
        Apply Promo
      </motion.button>
    </RideModalSheet>
  );
}