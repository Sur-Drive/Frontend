import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SwitchCamera, UserCircle2, X, Zap, ZapOff } from "lucide-react";
import OnboardingProgress from "../components/OnboardingProgress";

interface OnboardingState {
  identifier?: string;
  role?: string;
  phone?: string;
  city?: string;
}

type Mode = "idle" | "camera" | "review";

export default function FaceVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as OnboardingState) || {};

  const [mode, setMode] = useState<Mode>("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "user",
  );
  const [flashOn, setFlashOn] = useState(false);
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const finish = () => {
    // Selfie captured — continue to password creation.
    navigate("/register/password", { state });
  };

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-6 pb-8 pt-4">
      <OnboardingProgress progress={80} />

      <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
        Face Verification
      </h1>
      <p className="mt-2 text-base text-gray-400">
        To complete your registration, snap a quick selfie. Make sure its
        clear and well-lit!
      </p>

      <div className="mt-10 flex justify-center">
        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-[#f4f4f3]">
          {photo ? (
            <img
              src={photo}
              alt="Selfie preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircle2 size={160} className="text-gray-300" />
          )}
        </div>
      </div>

      {error && (
        <p className="mt-6 text-sm text-center text-red-600">{error}</p>
      )}

      {mode !== "review" ? (
        <button
          onClick={openCamera}
          className="fixed inset-x-6 bottom-8 h-14 rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
        >
          Take a selfie
        </button>
      ) : (
        <div className="fixed inset-x-6 bottom-8 space-y-3">
          <button
            onClick={finish}
            className="h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
          >
            Upload Photo
          </button>
          <button
            onClick={retake}
            className="h-14 w-full rounded-2xl bg-[#f4f4f3] text-lg font-semibold text-red-500 transition active:scale-[0.99]"
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
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Dark mask with circular cutout around the face guide */}
          <div className="pointer-events-none absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5">
            <button
              onClick={closeCamera}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-800"
            >
              <X size={20} />
            </button>
            <div className="flex gap-3">
              <button
                onClick={toggleFacing}
                aria-label="Switch camera"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-800"
              >
                <SwitchCamera size={20} />
              </button>
              <button
                onClick={() => setFlashOn((f) => !f)}
                aria-label="Toggle flash"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-800"
              >
                {flashOn ? <Zap size={20} /> : <ZapOff size={20} />}
              </button>
            </div>
          </div>

          <p className="absolute left-1/2 top-[42%] w-full -translate-x-1/2 translate-y-[150px] text-center text-lg font-semibold text-white">
            Place your face in the frame
          </p>

          <div className="absolute inset-x-6 bottom-8">
            <button
              onClick={capture}
              className="h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
            >
              Capture
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
