import { motion } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Video,
  Mic,
} from "lucide-react";

import { useRideCall } from "../../../hooks/passenger/useRideCall";

export default function IncomingCall() {
  const {
    call,
    phase,
    answerCall,
    declineCall,
  } = useRideCall();

  if (!call || phase !== "incoming") {
    return null;
  }

  const isVideo = call.type === "video";

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-[100dvh] flex-col items-center justify-between bg-gradient-to-b from-[#301747] via-[#512678] to-[#7442AD] px-6 pb-[max(48px,env(safe-area-inset-bottom))] pt-20 text-white">
      <div className="text-center">
        <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-white/65">
          SurDrive
        </p>

        <p className="mt-4 text-[15px] text-white/75">
          Incoming {isVideo ? "video" : "voice"} call
        </p>
      </div>

      <div className="flex flex-col items-center text-center">
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(255,255,255,0.18)",
              "0 0 0 30px rgba(255,255,255,0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/20 text-[54px] font-semibold"
        >
          {call.counterpartPhoto ? (
            <img
              src={call.counterpartPhoto}
              alt={call.counterpartName}
              className="object-cover w-full h-full"
            />
          ) : (
            call.counterpartName.charAt(0).toUpperCase()
          )}
        </motion.div>

        <h1 className="mt-8 text-[30px] font-semibold">
          {call.counterpartName}
        </h1>

        <p className="mt-3 text-[15px] text-white/70">
          {isVideo
            ? "Wants to start a video call"
            : "Is calling you"}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={declineCall}
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#EF4444] shadow-xl"
              aria-label="Decline call"
            >
              <PhoneOff size={30} />
            </button>

            <span className="text-[13px]">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => void answerCall()}
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#22C55E] shadow-xl"
              aria-label="Answer call"
            >
              {isVideo ? (
                <Video size={30} />
              ) : (
                <Phone size={30} />
              )}
            </button>

            <span className="text-[13px]">Answer</span>
          </div>
        </div>

        {isVideo && (
          <button
            type="button"
            onClick={() => void answerCall(true)}
            className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-[14px] font-medium"
          >
            <Mic size={18} />
            Answer without camera
          </button>
        )}
      </div>
    </div>
  );
}