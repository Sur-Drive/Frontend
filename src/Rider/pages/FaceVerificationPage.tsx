import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SwitchCamera, UserCircle2, X, Zap, ZapOff } from "lucide-react";
import OnboardingProgress from "../components/OnboardingProgress";
import { useUploadRideDriverProfilePicture } from "../hooks/useOnboarding";

interface OnboardingState {
  identifier?: string;
  role?: string;
  phone?: string;
  city?: string;
}

type Mode = "idle" | "camera" | "review";

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

export default function FaceVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as OnboardingState) || {};

  const [mode, setMode] = useState<Mode>("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [flashOn, setFlashOn] = useState(false);
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { mutateAsync: uploadProfilePicture, isPending: isSubmitting } =
    useUploadRideDriverProfilePicture();

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startStream = async () => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError(
        "Couldn't access your camera. Please check camera permissions and try again.",
      );
      setMode("idle");
    }
  };

  useEffect(() => {
    if (mode === "camera") {
      startStream();
    }
    return () => {
      if (mode !== "camera") stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, facingMode]);

  useEffect(() => stopStream, []);

  const openCamera = () => {
    setError("");
    setMode("camera");
  };

  const closeCamera = () => {
    stopStream();
    setMode("idle");
  };

  const toggleFacing = () => {
    setFacingMode((f) => (f === "user" ? "environment" : "user"));
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    setPhoto(canvas.toDataURL("image/jpeg", 0.9));
    stopStream();
    setMode("review");
  };

  const retake = () => {
    setPhoto("");
    setMode("camera");
  };

  const finish = async () => {
    if (isSubmitting || !photo) return;
    setError("");
    try {
      const facePhoto = dataUrlToFile(photo, "selfie.jpg");
      const res = await uploadProfilePicture(facePhoto);
      if (res.tempToken) {
        localStorage.setItem("driverOnboardingToken", res.tempToken);
      }
      navigate("/register/password", { state });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload selfie.");
    }
  };

  const primaryBtn =
    "h-[clamp(42px,9dvh,50px)] w-full rounded-xl bg-[#6E43A3] text-[clamp(13px,2.7dvh,16px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-60";
  const secondaryBtn =
    "h-[clamp(42px,9dvh,50px)] w-full rounded-xl bg-[#f4f4f3] text-[clamp(13px,2.7dvh,16px)] font-semibold text-red-500 transition active:scale-[0.99] disabled:opacity-60";
  const roundBtn =
    "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800";
  const bottomBar =
    "fixed inset-x-[clamp(16px,5vw,24px)] bottom-[clamp(16px,4dvh,28px)]";

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-[clamp(16px,5vw,24px)] pb-[clamp(16px,4dvh,28px)] pt-[clamp(10px,2.6dvh,16px)]">
      <OnboardingProgress progress={80} />

      <h1 className="mt-[clamp(12px,3dvh,18px)] text-[clamp(17px,3.6dvh,21px)] font-bold leading-tight text-[#2b2b2b]">
        Face Verification
      </h1>
      <p className="mt-[clamp(2px,0.6dvh,4px)] text-[clamp(10.5px,2.1dvh,12.5px)] text-gray-400">
        To complete your registration, snap a quick selfie. Make sure it's clear
        and well-lit!
      </p>

      {/* Bigger face circle */}
      <div className="mt-[clamp(20px,5dvh,40px)] flex justify-center">
        <div className="flex h-[min(86vw,44dvh,360px)] w-[min(86vw,44dvh,360px)] items-center justify-center overflow-hidden rounded-full bg-[#f4f4f3]">
          {photo ? (
            <img
              src={photo}
              alt="Selfie preview"
              className="object-cover w-full h-full"
            />
          ) : (
            <UserCircle2
              strokeWidth={1}
              className="w-full h-full text-gray-300"
            />
          )}
        </div>
      </div>

      {error && (
        <p className="mt-[clamp(8px,2.2dvh,14px)] text-center text-[clamp(10.5px,2.1dvh,12.5px)] text-red-600">
          {error}
        </p>
      )}

      {mode !== "review" ? (
        <div className={bottomBar}>
          <button onClick={openCamera} className={primaryBtn}>
            Take a selfie
          </button>
        </div>
      ) : (
        <div className={`${bottomBar} space-y-2.5`}>
          <button
            onClick={finish}
            disabled={isSubmitting}
            className={primaryBtn}
          >
            {isSubmitting ? "Uploading..." : "Upload Photo"}
          </button>
          <button
            onClick={retake}
            disabled={isSubmitting}
            className={secondaryBtn}
          >
            Retake
          </button>
        </div>
      )}

      {/* Full-screen camera capture overlay */}
      {mode === "camera" && (
        <div className="fixed inset-0 z-50 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 object-cover w-full h-full"
          />

          {/* Bigger face guide: dark mask with circular cutout + caption below it */}
          <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
            <div className="h-[min(94vw,52dvh,400px)] w-[min(94vw,52dvh,400px)] rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
            <p className="absolute left-1/2 top-full mt-4 w-max -translate-x-1/2 text-center text-[clamp(13px,2.6dvh,15px)] font-semibold text-white">
              Place your face in the frame
            </p>
          </div>

          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5">
            <button
              onClick={closeCamera}
              aria-label="Close"
              className={roundBtn}
            >
              <X size={18} />
            </button>
            <div className="flex gap-3">
              <button
                onClick={toggleFacing}
                aria-label="Switch camera"
                className={roundBtn}
              >
                <SwitchCamera size={18} />
              </button>
              <button
                onClick={() => setFlashOn((f) => !f)}
                aria-label="Toggle flash"
                className={roundBtn}
              >
                {flashOn ? <Zap size={18} /> : <ZapOff size={18} />}
              </button>
            </div>
          </div>

          <div className="absolute inset-x-[clamp(16px,5vw,24px)] bottom-[clamp(16px,4dvh,28px)]">
            <button onClick={capture} className={primaryBtn}>
              Capture
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
