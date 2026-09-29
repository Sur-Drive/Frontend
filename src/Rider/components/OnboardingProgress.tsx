import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingProgressProps {
  /** 0–100 */
  progress: number;
  onBack?: () => void;
}

export default function OnboardingProgress({
  progress,
  onBack,
}: OnboardingProgressProps) {
  const navigate = useNavigate();
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onBack ?? (() => navigate(-1))}
        aria-label="Back"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
      >
        <ChevronLeft size={22} />
      </button>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ececec]">
        <div
          className="h-full rounded-full bg-[#6E43A3] transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
