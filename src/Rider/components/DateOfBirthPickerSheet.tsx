import { useState } from "react";
import WheelPicker from "./WheelPicker";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - 1950 + 1 },
  (_, i) => 1950 + i,
);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export interface DateOfBirthValue {
  year: number;
  day: number;
  month: number; // 1-12
}

interface DateOfBirthPickerSheetProps {
  initialValue?: DateOfBirthValue;
  onClose: () => void;
  onSelect: (value: DateOfBirthValue) => void;
}

const DEFAULT_VALUE: DateOfBirthValue = { year: 2002, day: 4, month: 4 };

export default function DateOfBirthPickerSheet({
  initialValue = DEFAULT_VALUE,
  onClose,
  onSelect,
}: DateOfBirthPickerSheetProps) {
  const [year, setYear] = useState(initialValue.year);
  const [day, setDay] = useState(initialValue.day);
  const [month, setMonth] = useState(initialValue.month);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[430px] rounded-t-[32px] bg-white px-6 pb-8 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />

        <h2 className="text-center text-2xl font-bold text-[#6E43A3]">
          Date of birth
        </h2>

        <div className="mt-2 flex items-stretch">
          <WheelPicker
            items={YEARS}
            value={year}
            onChange={setYear}
            itemHeight={40}
            visibleCount={7}
            className="flex-[1.2]"
          />
          <WheelPicker
            items={DAYS}
            value={day}
            onChange={setDay}
            itemHeight={40}
            visibleCount={7}
            className="flex-1"
          />
          <WheelPicker
            items={MONTHS.map((_, i) => i + 1)}
            value={month}
            onChange={setMonth}
            renderLabel={(m) => MONTHS[(m as number) - 1]}
            itemHeight={40}
            visibleCount={7}
            className="flex-[1.6]"
          />
        </div>

        <button
          onClick={() => onSelect({ year, day, month })}
          className="mt-4 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
        >
          Select
        </button>
      </div>
    </div>
  );
}
