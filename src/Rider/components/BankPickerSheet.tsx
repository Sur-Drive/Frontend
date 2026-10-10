import { useState } from "react";
import { motion } from "framer-motion";
import { backdropMotion, sheetMotion, tapMotion } from "./motion";
import WheelPicker from "./WheelPicker";

export const NIGERIAN_BANKS = [
  "Access Bank",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Kuda Bank",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Wema Bank",
  "Zenith Bank",
];

interface BankPickerSheetProps {
  /** Bank names to show; defaults to the built-in list. */
  banks?: string[];
  initialValue?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}

export default function BankPickerSheet({
  banks = NIGERIAN_BANKS,
  initialValue = banks === NIGERIAN_BANKS ? NIGERIAN_BANKS[3] : banks[0],
  onClose,
  onSelect,
}: BankPickerSheetProps) {
  const [value, setValue] = useState<string>(initialValue ?? banks[0]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <motion.div
        {...backdropMotion}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        {...sheetMotion}
        className="relative w-full max-w-[430px] rounded-t-[32px] bg-white px-6 pb-8 pt-3"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />

        <h2 className="text-center text-xl sm:text-2xl font-bold text-[#2b2b2b]">
          Select bank
        </h2>

        <WheelPicker
          items={banks}
          value={value}
          onChange={setValue}
          itemHeight={44}
          visibleCount={5}
          className="mt-2"
        />

        <motion.button
          type="button"
          {...tapMotion}
          onClick={() => onSelect(value)}
          className="mt-4 h-14 w-full rounded-2xl bg-[#6E43A3] text-base sm:text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30"
        >
          Select
        </motion.button>
      </motion.div>
    </div>
  );
}
