import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Phone,
  Video,
  Wifi,
} from "lucide-react";

import { useRideCall } from "../../../hooks/passenger/useRideCall";
import CallControls from "./CallControls";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining,
  ).padStart(2, "0")}`;
}

export default function CallScreen() {
  const {
    call,
    phase,
    localStream,
    remoteStream,
    muted,
    cameraEnabled,
    startedAt,
    toggleMute,
    toggleCamera,
    endCall,
    error,
  } = useRideCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [duration, setDuration] = useState(0);

  const isVideo = call?.type === "video";

  useEffect(() => {
    if (!localVideoRef.current) return;

    localVideoRef.current.srcObject = localStream;

    if (localStream) {
      void localVideoRef.current.play().catch(() => undefined);
    }
  }, [localStream, call?.type]);

  useEffect(() => {
    if (!remoteVideoRef.current) return;

    remoteVideoRef.current.srcObject = remoteStream;

    if (remoteStream) {
      void remoteVideoRef.current.play().catch(() => undefined);
    }
  }, [remoteStream, call?.type]);

  useEffect(() => {
    if (!remoteAudioRef.current) return;

    remoteAudioRef.current.srcObject = remoteStream;

    if (remoteStream) {
      void remoteAudioRef.current.play().catch(() => undefined);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (phase !== "active" || !startedAt) {
      setDuration(0);
      return;
    }

    const update = () => {
      const start = new Date(startedAt).getTime();

      setDuration(
        Math.max(
          0,
          Math.floor((Date.now() - start) / 1000),
        ),
      );
    };

    update();

    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, [phase, startedAt]);

  if (
    !call ||
    phase === "idle" ||
    phase === "incoming"
  ) {
    return null;
  }

  const status =
    phase === "outgoing"
      ? "Calling..."
      : phase === "connecting"
        ? "Connecting..."
        : phase === "ending"
          ? "Ending call..."
          : formatDuration(duration);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#1B1125] text-white">
      {/* Remote audio: separate element for voice calls */}
      {!isVideo && (
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
        />
      )}

      {isVideo && (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 object-cover w-full h-full bg-black"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

          {localStream?.getVideoTracks().length ? (
            <div className="absolute right-5 top-[max(90px,env(safe-area-inset-top))] z-20 h-44 w-32 overflow-hidden rounded-[20px] border-2 border-white/30 bg-black shadow-xl">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full scale-x-[-1] object-cover"
              />

              {!cameraEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#261731] text-[12px]">
                  Camera off
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-[max(55px,env(safe-area-inset-bottom))] pt-[max(60px,env(safe-area-inset-top))]">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-white/60">
            SurDrive
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-white/75">
            {isVideo ? (
              <Video size={16} />
            ) : (
              <Phone size={16} />
            )}

            <span>
              {isVideo ? "Video call" : "Voice call"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          {!isVideo && (
            <div className="mb-7 flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-[#7442AD] text-[55px] font-semibold shadow-[0_0_70px_rgba(116,66,173,0.4)]">
              {call.counterpartPhoto ? (
                <img
                  src={call.counterpartPhoto}
                  alt={call.counterpartName}
                  className="object-cover w-full h-full"
                />
              ) : (
                call.counterpartName.charAt(0).toUpperCase()
              )}
            </div>
          )}

          <h1 className="text-[28px] font-semibold">
            {call.counterpartName}
          </h1>

          <p className="mt-3 flex items-center gap-2 text-[15px] text-white/70">
            {phase === "active" && (
              <Wifi size={16} className="text-green-400" />
            )}

            {status}
          </p>

          {error && (
            <p className="mt-5 max-w-xs rounded-xl bg-red-500/20 px-4 py-3 text-[12px] text-red-100">
              {error}
            </p>
          )}
        </div>

        <div className="w-full max-w-sm mx-auto">
          <CallControls
            muted={muted}
            cameraEnabled={cameraEnabled}
            isVideo={isVideo}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onEnd={endCall}
          />

          <p className="mt-7 text-center text-[12px] text-white/40">
            {phase === "active"
              ? "Your call is connected"
              : "Waiting for the other person"}
          </p>
        </div>
      </div>
    </div>
  );
}