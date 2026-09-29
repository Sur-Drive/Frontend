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

/**
 * Phone cameras produce 3-10 MB photos. Nine of them in one multipart
 * request is 30-90 MB, which most servers/proxies (multer, nginx, Railway)
 * reject or time out on. Downscale + re-encode to JPEG before upload.
 */
async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.8,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

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

  const handleFile = async (file: File | undefined) => {
    if (!file || !activeSlot) return;
    const slot = activeSlot;
    closeModal();
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);
    setFiles((prev) => ({ ...prev, [slot]: compressed }));
    setPreviews((prev) => {
      if (prev[slot]) URL.revokeObjectURL(prev[slot]);
      return { ...prev, [slot]: url };
    });
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
      "INSPECTION SUBMIT — total upload size (MB):",
      (
        Object.values(files).reduce((n, f) => n + (f?.size ?? 0), 0) /
        1024 /
        1024
      ).toFixed(2),
    );
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
    <div className="font-outfit min-h-[100dvh] bg-white px-[clamp(16px,5vw,24px)] pb-[clamp(16px,4dvh,28px)] pt-[clamp(10px,2.6dvh,16px)]">
      <OnboardingProgress progress={60} />

      <h1 className="mt-[clamp(12px,3dvh,18px)] text-[clamp(17px,3.6dvh,21px)] font-bold leading-tight text-[#2b2b2b]">
        Vehicle Inspection
      </h1>
      <p className="mt-[clamp(2px,0.6dvh,4px)] text-[clamp(10.5px,2.1dvh,12.5px)] text-gray-400">
        Upload clear photos of your vehicle to verify its condition
      </p>

      <div className="mt-[clamp(12px,3dvh,20px)] grid grid-cols-3 gap-[clamp(6px,1.6dvh,10px)]">
        {SLOTS.map((slot) => (
          <button
            key={slot.key}
            type="button"
            onClick={() => openSlot(slot.key)}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-[#f4f4f3] px-1.5 text-center"
          >
            {previews[slot.key] ? (
              <img
                src={previews[slot.key]}
                alt={slot.label}
                className="object-cover w-full h-full"
              />
            ) : (
              <>
                <ImagePlus className="h-[clamp(18px,3.6dvh,22px)] w-[clamp(18px,3.6dvh,22px)] text-gray-400" />
                <span className="text-[clamp(9.5px,1.9dvh,11px)] leading-tight text-gray-500">
                  {slot.label}
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-[clamp(8px,2.2dvh,14px)] text-center text-[clamp(10.5px,2.1dvh,12.5px)] text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={isSubmitting}
        className="mt-[clamp(12px,3dvh,18px)] h-[clamp(42px,9dvh,50px)] w-full rounded-xl bg-[#6E43A3] text-[clamp(13px,2.7dvh,16px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-60"
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
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {/* Update Photo bottom sheet */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-md px-5 pt-4 pb-6 bg-white shadow-2xl rounded-t-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-[clamp(14px,2.9dvh,17px)] font-bold text-[#2b2b2b]">
                Update Photo
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f4f3] text-gray-600"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="h-[clamp(40px,8.6dvh,48px)] w-full rounded-xl bg-[#6E43A3] text-[clamp(12.5px,2.5dvh,15px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
              >
                Take a Photo
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="h-[clamp(40px,8.6dvh,48px)] w-full rounded-xl bg-[#f4f4f3] text-[clamp(12.5px,2.5dvh,15px)] font-semibold text-[#6E43A3] transition active:scale-[0.99]"
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
