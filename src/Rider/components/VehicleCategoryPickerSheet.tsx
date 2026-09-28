import { useState } from "react";
import WheelPicker from "./WheelPicker";

export type VehicleCategory = "Economy" | "Comfort" | "SUV";

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  Economy: "Economy — No air conditioning",
  Comfort: "Comfort — Air conditioning",
  SUV: "SUV — Air conditioning + larger luggage/storage space",
};

const CATEGORIES: VehicleCategory[] = ["Economy", "Comfort", "SUV"];

interface VehicleCategoryPickerSheetProps {
  initialValue?: VehicleCategory;
  onClose: () => void;
  onSelect: (value: VehicleCategory) => void;
}

export default function VehicleCategoryPickerSheet({
  initialValue = "Comfort",
  onClose,
  onSelect,
}: VehicleCategoryPickerSheetProps) {
  const [value, setValue] = useState<VehicleCategory>(initialValue);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[430px] rounded-t-[32px] bg-white px-6 pb-8 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />

        <h2 className="text-center text-2xl font-bold text-[#9298b8]">
          Select vehicle category
        </h2>

        <WheelPicker
          items={CATEGORIES}
          value={value}
          onChange={setValue}
          renderLabel={(v) => CATEGORY_LABELS[v]}
          itemHeight={56}
          visibleCount={3}
          className="mt-2 px-2 text-center"
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
