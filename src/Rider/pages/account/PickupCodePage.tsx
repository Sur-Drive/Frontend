import { ChevronLeft } from "lucide-react";
import ToggleSwitch from "../../components/ToggleSwitch";

interface PickupCodePageProps {
  onBack: () => void;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function PickupCodePage({
  onBack,
  enabled,
  onChange,
}: PickupCodePageProps) {
  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            Pick-up code
          </h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#9AA5B8]">
            Verify your ride with a unique code. Match the code with your
            driver before getting in to make sure you're in the right
            vehicle with the right driver.
          </p>

          <div className="mt-6 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm">
            <span className="text-[15.5px] font-medium text-[#1F2937]">
              Enable Pick-up code
            </span>
            <ToggleSwitch
              checked={enabled}
              onChange={onChange}
              ariaLabel="Enable Pick-up code"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
