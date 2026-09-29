import { useState } from "react";
import WheelPicker from "./WheelPicker";

export type BankAccountType = "Savings" | "Current";

const ACCOUNT_TYPES: BankAccountType[] = ["Savings", "Current"];

interface AccountTypePickerSheetProps {
  initialValue?: BankAccountType;
  onClose: () => void;
  onSelect: (value: BankAccountType) => void;
}

export default function AccountTypePickerSheet({
  initialValue = "Savings",
  onClose,
  onSelect,
}: AccountTypePickerSheetProps) {
  const [value, setValue] = useState<BankAccountType>(initialValue);

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
          Account type
        </h2>

        <WheelPicker
          items={ACCOUNT_TYPES}
          value={value}
          onChange={setValue}
          itemHeight={44}
          visibleCount={3}
          className="mt-2"
        />

        <button
          type="button"
          onClick={() => onSelect(value)}
          className="mt-4 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
        >
          Select
        </button>
      </div>
    </div>
  );
}
