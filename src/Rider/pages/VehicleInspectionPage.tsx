import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import OnboardingProgress from "../components/OnboardingProgress";

interface OnboardingState {
  identifier?: string;
  role?: string;
  phone?: string;
  city?: string;
}

interface Slot {
  key: string;
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

  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const openSlot = (key: string) => {
    setActiveSlot(key);
    setError("");
  };

  const closeModal = () => setActiveSlot(null);

  const handleFile = (file: File | undefined) => {
    if (!file || !activeSlot) return;
    const url = URL.createObjectURL(file);
    setPhotos((prev) => ({ ...prev, [activeSlot]: url }));
    closeModal();
  };

  const submit = () => {
    const missing = SLOTS.filter((s) => !photos[s.key]);
    if (missing.length > 0) {
      setError(
        `Please add a photo for: ${missing.map((s) => s.label).join(", ")}.`,
      );
      return;
    }
    setError("");
    navigate("/register/face-verification", { state });
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

      <div className="mt-8 grid grid-cols-3 gap-3">
        {SLOTS.map((slot) => (
          <button
            key={slot.key}
            type="button"
            onClick={() => openSlot(slot.key)}
            className="flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#f4f4f3] px-2 text-center"
          >
            {photos[slot.key] ? (
              <img
                src={photos[slot.key]}
                alt={slot.label}
                className="h-full w-full object-cover"
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
        className="mt-8 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
      >
        Continue
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
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-md rounded-t-[28px] bg-white px-5 pb-8 pt-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-[#2b2b2b]">
                Update Photo
              </h2>
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
