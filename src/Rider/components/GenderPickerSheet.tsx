import { useState } from "react";
import WheelPicker from "./WheelPicker";

export type Gender = "Male" | "Female" | "Others";

const GENDERS: Gender[] = ["Male", "Female", "Others"];

interface GenderPickerSheetProps {
  initialValue?: Gender;
  onClose: () => void;
  onSelect: (value: Gender) => void;
}

export default function GenderPickerSheet({
  initialValue = "Female",
  onClose,
  onSelect,
}: GenderPickerSheetProps) {
  const [value, setValue] = useState<Gender>(initialValue);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[430px] rounded-t-[32px] bg-white px-6 pb-8 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />

        <h2 className="text-center text-2xl font-bold text-[#2b2b2b]">
          Select gender
        </h2>

        <WheelPicker
          items={GENDERS}
          value={value}
          onChange={setValue}
          itemHeight={44}
          visibleCount={3}
          className="mt-2"
        />

        <button
          onClick={() => onSelect(value)}
          className="mt-4 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
        >
          Select
        </button>
      </div>
    </div>
  );
}
