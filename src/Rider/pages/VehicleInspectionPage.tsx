import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import OnboardingProgress from "../components/OnboardingProgress";
import { useSubmitRideDriverInspection } from "../hooks/useOnboarding";
import { getRideDriverStatus } from "../api/onboarding";
import type { RideDriverInspectionPayload } from "../api/onboarding";

interface OnboardingState {
  identifier?: string;
  role?: string;
  phone?: string;
  city?: string;
}

interface Slot {
  key: keyof RideDriverInspectionPayload;
  label: string;
}

const SLOTS: Slot[] = [
  { key: "rightRear", label: "Right Rear View" },
  { key: "leftRear", label: "Left Rear view" },
  { key: "front", label: "Front view" },
  { key: "back", label: "Back View" },
  { key: "driverSide", label: "Driver Side" },
  { key: "passengerSide", label: "Passenger Side" },
  { key: "frontInterior", label: "Front Interior" },
  { key: "backInterior", label: "Back Interior" },
  { key: "dashboard", label: "Dashboard" },
];

export default function VehicleInspectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as OnboardingState) || {};

  const [files, setFiles] = useState<Partial<Record<string, File>>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const { mutateAsync: submitInspection, isPending: isSubmitting } =
    useSubmitRideDriverInspection();

  const openSlot = (key: string) => {
    setActiveSlot(key);
    setError("");
  };

  const closeModal = () => setActiveSlot(null);

  const handleFile = (file: File | undefined) => {
    if (!file || !activeSlot) return;
    const url = URL.createObjectURL(file);
    setFiles((prev) => ({ ...prev, [activeSlot]: file }));
    setPreviews((prev) => ({ ...prev, [activeSlot]: url }));
    closeModal();
  };

  const submit = async () => {
    if (isSubmitting) return;

    const missing = SLOTS.filter((s) => !files[s.key]);
    if (missing.length > 0) {
      setError(
        `Please add a photo for: ${missing.map((s) => s.label).join(", ")}.`,
      );
      return;
    }
    setError("");

    // ADDED FOR DEBUGGING — log exactly what we're about to send
    console.log("INSPECTION SUBMIT — files being sent:", files);
    console.log(
      "INSPECTION SUBMIT — token in use:",
      localStorage.getItem("driverOnboardingToken"),
    );

    // ADDED FOR DEBUGGING — ask the backend directly what step it
    // currently thinks we're on, right before we try to submit.
    try {
      const status = await getRideDriverStatus();
      console.log("INSPECTION SUBMIT — backend status right now:", status);
    } catch (statusErr) {
      console.log("INSPECTION SUBMIT — couldn't fetch status:", statusErr);
    }

    try {
      const res = await submitInspection(
        files as unknown as RideDriverInspectionPayload,
      );
      if (res.tempToken) {
        localStorage.setItem("driverOnboardingToken", res.tempToken);
      }
      navigate("/register/face-verification", { state });
    } catch (err) {
      // ADDED FOR DEBUGGING — remove once we've found the issue
      console.error("INSPECTION SUBMIT FAILED — full error object:", err);
      if (err instanceof Error) {
        console.error("INSPECTION SUBMIT FAILED — message:", err.message);
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit vehicle inspection.",
      );
    }
  };

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-6 pb-8 pt-4">
      <OnboardingProgress progress={60} />

      <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
        Vehicle Inspection
      </h1>
      <p className="mt-2 text-base text-gray-400">
        Upload clear photos of your vehicle to verify its condition
      </p>

      <div className="grid grid-cols-3 gap-3 mt-8">
        {SLOTS.map((slot) => (
          <button
            key={slot.key}
            type="button"
            onClick={() => openSlot(slot.key)}
            className="flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#f4f4f3] px-2 text-center"
          >
            {previews[slot.key] ? (
              <img
                src={previews[slot.key]}
                alt={slot.label}
                className="object-cover w-full h-full"
              />
            ) : (
              <>
                <ImagePlus size={26} className="text-gray-400" />
                <span className="text-xs text-gray-500 sm:text-sm">
                  {slot.label}
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-6 text-sm text-center text-red-600">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={isSubmitting}
        className="mt-8 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-60"
      >
        {isSubmitting ? "Uploading..." : "Continue"}
      </button>

      {/* Hidden inputs shared across slots */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Update Photo bottom sheet */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-t-[28px] bg-white px-5 pb-8 pt-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#2b2b2b]">Update Photo</h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f3] text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="h-14 w-full rounded-2xl bg-[#6E43A3] text-base font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
              >
                Take a Photo
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="h-14 w-full rounded-2xl bg-[#f4f4f3] text-base font-semibold text-[#6E43A3] transition active:scale-[0.99]"
              >
                Choose from Gallery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
