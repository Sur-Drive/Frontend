import { useState } from "react";
import WheelPicker from "./WheelPicker";

// Label shown in the picker -> value the API expects.
export const RELATIONSHIP_OPTIONS = [
  { label: "Parent", value: "parent" },
  { label: "Sibling", value: "sibling" },
  { label: "Spouse", value: "spouse" },
  { label: "Child", value: "child" },
  { label: "Friend", value: "friend" },
  { label: "Relative", value: "relative" },
  { label: "Colleague", value: "colleague" },
  { label: "Other", value: "other" },
] as const;

export const RELATIONSHIPS: string[] = RELATIONSHIP_OPTIONS.map((r) => r.label);

export const relationshipToApi = (label: string) =>
  RELATIONSHIP_OPTIONS.find((r) => r.label === label)?.value ?? "other";

export const relationshipLabel = (value: string) =>
  RELATIONSHIP_OPTIONS.find((r) => r.value === value.toLowerCase())?.label ??
  (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

interface RelationshipPickerSheetProps {
  initialValue?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}

export default function RelationshipPickerSheet({
  initialValue = RELATIONSHIPS[2],
  onClose,
  onSelect,
}: RelationshipPickerSheetProps) {
  const [value, setValue] = useState<string>(initialValue);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[430px] rounded-t-[32px] bg-white px-6 pb-8 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />

        <h2 className="text-center text-xl sm:text-2xl font-bold text-[#2b2b2b]">
          Select relationship
        </h2>

        <WheelPicker
          items={RELATIONSHIPS}
          value={value}
          onChange={setValue}
          itemHeight={44}
          visibleCount={5}
          className="mt-2"
        />

        <button
          type="button"
          onClick={() => onSelect(value)}
          className="mt-4 h-14 w-full rounded-2xl bg-[#6E43A3] text-[15px] sm:text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
        >
          Select
        </button>
      </div>
    </div>
  );
}
