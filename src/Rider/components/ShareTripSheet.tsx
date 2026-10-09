import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { backdropMotion, sheetMotion } from "./motion";
import { Check, Copy, Loader2, Share2, X } from "lucide-react";
import { useShareRide, useStopSharingRide } from "../hooks/useTripShare";
import type { TripShare } from "../api/tripShare";

const storeKey = (rideId: string) => `tripShares:${rideId}`;

function load(rideId: string): TripShare[] {
  try {
    return JSON.parse(localStorage.getItem(storeKey(rideId)) || "[]");
  } catch {
    return [];
  }
}
function save(rideId: string, list: TripShare[]) {
  try {
    localStorage.setItem(storeKey(rideId), JSON.stringify(list));
  } catch {
    /* storage unavailable: the list just won't survive a refresh */
  }
}

/**
 * Share this trip with someone: POST /rides/:rideId/share { sharedWith },
 * then show the link; "Stop sharing" calls DELETE /rides/shares/:shareId.
 */
export default function ShareTripSheet({
  rideId,
  onClose,
}: {
  rideId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [shares, setShares] = useState<TripShare[]>(() => load(rideId));
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const share = useShareRide();
  const stop = useStopSharingRide();

  useEffect(() => save(rideId, shares), [rideId, shares]);

  const onShare = async () => {
    const sharedWith = name.trim();
    if (!sharedWith) return setError("Enter who you're sharing with.");
    setError(null);
    try {
      const created = await share.mutateAsync({ rideId, sharedWith });
      setShares((prev) => [created, ...prev]);
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to share this trip");
    }
  };

  const onStop = async (s: TripShare) => {
    setError(null);
    try {
      await stop.mutateAsync(s.shareId);
      setShares((prev) => prev.filter((x) => x.shareId !== s.shareId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop sharing");
    }
  };

  const send = async (s: TripShare) => {
    if (!s.url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Follow my Sur-Drive trip",
          text: "Track my live trip.",
          url: s.url,
        });
        return;
      } catch {
        return; // dismissed
      }
    }
    copy(s);
  };

  const copy = async (s: TripShare) => {
    try {
      await navigator.clipboard.writeText(s.url);
      setCopiedId(s.shareId);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <motion.div
      {...backdropMotion}
      className="absolute inset-0 z-40 flex items-end bg-black/40"
      onClick={onClose}
    >
      <motion.div
        {...sheetMotion}
        className="max-h-[85%] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-bold text-[#1F2937]">Share your trip</p>
            <p className="mt-1 text-xs text-[#9AA5B8]">
              Let someone you trust follow this ride live.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[#9AA5B8]">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onShare()}
            placeholder="Name, e.g. Jane Doe"
            className="h-12 min-w-0 flex-1 rounded-2xl bg-[#f4f4f3] px-4 text-base text-[#1F2937] outline-none placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={onShare}
            disabled={share.isPending}
            className="flex h-12 items-center justify-center rounded-2xl bg-[#6E43A3] px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            {share.isPending ? <Loader2 size={18} className="animate-spin" /> : "Share"}
          </button>
        </div>

        {error && <p className="mt-2 text-xs font-semibold text-[#E53935]">{error}</p>}

        {shares.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9AA5B8]">
              Shared with
            </p>
            {shares.map((s) => (
              <div key={s.shareId || s.token} className="rounded-2xl border border-gray-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-[#1F2937]">{s.sharedWith}</p>
                  <button
                    type="button"
                    onClick={() => onStop(s)}
                    disabled={stop.isPending || !s.shareId}
                    className="shrink-0 text-xs font-semibold text-[#E53935] disabled:opacity-60"
                  >
                    Stop sharing
                  </button>
                </div>
                {s.url && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#F7F5F8] px-3 py-2">
                    <p className="min-w-0 flex-1 truncate text-xs text-[#625C66]">{s.url}</p>
                    <button type="button" onClick={() => copy(s)} aria-label="Copy link" className="text-[#6E43A3]">
                      {copiedId === s.shareId ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button type="button" onClick={() => send(s)} aria-label="Send link" className="text-[#6E43A3]">
                      <Share2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
