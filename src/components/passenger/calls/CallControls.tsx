import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";

interface CallControlsProps {
  muted: boolean;
  cameraEnabled: boolean;
  isVideo: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEnd: () => void;
}

export default function CallControls({
  muted,
  cameraEnabled,
  isVideo,
  onToggleMute,
  onToggleCamera,
  onEnd,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
          muted
            ? "bg-white text-[#7442AD]"
            : "bg-white/15 text-white"
        }`}
      >
        {muted ? <MicOff size={23} /> : <Mic size={23} />}
      </button>

      {isVideo && (
        <button
          type="button"
          onClick={onToggleCamera}
          aria-label={
            cameraEnabled ? "Turn camera off" : "Turn camera on"
          }
          className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
            cameraEnabled
              ? "bg-white/15 text-white"
              : "bg-white text-[#7442AD]"
          }`}
        >
          {cameraEnabled ? (
            <Video size={23} />
          ) : (
            <VideoOff size={23} />
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onEnd}
        aria-label="End call"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-lg shadow-red-500/25"
      >
        <PhoneOff size={27} />
      </button>
    </div>
  );
}