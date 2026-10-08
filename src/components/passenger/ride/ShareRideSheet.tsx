import {
  Check,
  Clock3,
  Copy,
  Link2,
  LoaderCircle,
  MapPin,
  Share2,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import RideModalSheet from "./RideModalSheet";

import type {
  RideDriver,
  RideLocation,
} from "../../../types/passengerRide";

import {
  usePassengerShareTrip,
  usePassengerRevokeShare,
} from "../../../hooks/passenger/usePassengerSafetyArticles";

interface ShareRideSheetProps {
  open: boolean;
  onClose: () => void;
  rideId: string;
  driver?: RideDriver | null;
  pickup?: RideLocation | null;
  destination?: RideLocation | null;
  eta?: string;
}

type ShareDetails = {
  url: string | null;
  shareId: string | null;
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(
  object: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function parseShareResponse(response: unknown): ShareDetails {
  if (!isRecord(response)) {
    return { url: null, shareId: null };
  }

  const payload = isRecord(response.data)
    ? response.data
    : response;

  const rawUrl = getString(payload, [
    "shareUrl",
    "trackingUrl",
    "liveTripUrl",
    "url",
    "link",
  ]);

  let url: string | null = null;

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);

      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        url = parsed.toString();
      }
    } catch {
      // Do not manufacture a tracking URL.
    }
  }

  return {
    url,
    shareId: getString(payload, ["shareId", "id"]),
  };
}

export default function ShareRideSheet({
  open,
  onClose,
  rideId,
  driver,
  pickup,
  destination,
  eta,
}: ShareRideSheetProps) {
  const shareMutation = usePassengerShareTrip();
  const revokeMutation = usePassengerRevokeShare();

  const [recipient, setRecipient] = useState("");
  const [shareDetails, setShareDetails] =
    useState<ShareDetails | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  const createShare = async () => {
    const sharedWith = recipient.trim();

    if (!sharedWith) {
      toast.error("Enter the name of the person you're sharing with.");
      return;
    }

    if (shareMutation.isPending) return;

    try {
      const response = await shareMutation.mutateAsync({
        rideId,
        sharedWith,
      });

      const details = parseShareResponse(response);
      setShareDetails(details);

      if (details.url) {
        toast.success("Trip-sharing link created.");
      } else {
        toast.success(
          "Share request completed. No tracking URL was returned.",
        );
      }
    } catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "Unable to share this trip.";

  const isCompletedRide =
    /completed or cancelled ride/i.test(message);

  if (isCompletedRide) {
    toast.error(
      "This ride has ended. Only active rides can be shared.",
    );
  } else {
    toast.error(message);
  }
}
  };

  const copyLink = async () => {
    if (!shareDetails?.url) return;

    try {
      await navigator.clipboard.writeText(shareDetails.url);
      setCopied(true);
      toast.success("Tracking link copied.");
    } catch {
      toast.error("Unable to copy the tracking link.");
    }
  };

  const nativeShare = async () => {
    if (!shareDetails?.url) return;

    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: "Follow my Sur-Drive trip",
        text: "Here's my trip-tracking link.",
        url: shareDetails.url,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        return;
      }

      toast.error("Unable to open the sharing options.");
    }
  };

  const stopSharing = async () => {
    if (!shareDetails?.shareId || revokeMutation.isPending) {
      return;
    }

    try {
      await revokeMutation.mutateAsync(shareDetails.shareId);

      setShareDetails(null);
      setRecipient("");
      toast.success("Trip share revoked.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to stop sharing.",
      );
    }
  };

  const hasShare = shareDetails !== null;

  return (
    <RideModalSheet
      open={open}
      onClose={onClose}
      title="Share your trip"
      description="Create a tracking link for someone you trust."
    >
      {driver && (
        <div className="flex items-center gap-3 rounded-[16px] bg-[#F8F6F9] p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEE7F5] text-[18px] font-bold text-[#7442AD]">
            {driver.photo ? (
              <img
                src={driver.photo}
                alt={driver.firstName}
                className="object-cover w-full h-full"
              />
            ) : (
              driver.firstName.charAt(0)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#302B34]">
              {driver.firstName}
            </p>
            <p className="mt-1 truncate text-[12px] text-[#918B95]">
              {driver.vehicle.make} {driver.vehicle.model} •{" "}
              {driver.vehicle.plateNumber}
            </p>
          </div>

          {eta && (
            <div className="flex shrink-0 items-center gap-1 text-[#7442AD]">
              <Clock3 size={15} />
              <span className="text-[13px] font-semibold">{eta}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 rounded-[16px] border border-[#EEEAF1] p-4">
        {pickup && (
          <div className="flex gap-3">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-[3px] border-[#7442AD]" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#AAA4AD]">
                Pickup
              </p>
              <p className="mt-1 text-[14px] font-medium text-[#302B34]">
                {pickup.label}
              </p>
            </div>
          </div>
        )}

        {pickup && destination && (
          <div className="my-2 ml-[5px] h-7 border-l-2 border-dotted border-[#D4CED8]" />
        )}

        {destination && (
          <div className="flex gap-3">
            <MapPin size={17} className="mt-0.5 shrink-0 text-[#302B34]" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#AAA4AD]">
                Destination
              </p>
              <p className="mt-1 text-[14px] font-medium text-[#302B34]">
                {destination.label}
              </p>
            </div>
          </div>
        )}
      </div>

      {!hasShare ? (
        <div className="mt-5">
          <label
            htmlFor="share-recipient"
            className="mb-2 block text-[14px] font-semibold text-[#302B34]"
          >
            Who are you sharing with?
          </label>

          <div className="flex h-[54px] items-center gap-3 rounded-[13px] bg-[#F7F5F8] px-4 focus-within:ring-2 focus-within:ring-[#7442AD]/20">
            <UserRound size={19} className="text-[#7442AD]" />

            <input
              id="share-recipient"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Enter their name"
              maxLength={100}
              className="min-w-0 flex-1 bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#AAA4AE]"
            />
          </div>

          <p className="mt-2 text-[12px] leading-5 text-[#918B95]">
            Enter a name to create a share. This does not automatically
            send a message to the recipient.
          </p>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => void createShare()}
            disabled={shareMutation.isPending || !recipient.trim()}
            className="mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {shareMutation.isPending ? (
              <>
                <LoaderCircle size={19} className="animate-spin" />
                Creating share...
              </>
            ) : (
              <>
                <Link2 size={19} />
                Create Trip Share
              </>
            )}
          </motion.button>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-start gap-3 rounded-[14px] bg-[#F0F8F1] p-4">
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-[#3D965C]"
            />
            <div>
              <p className="text-[14px] font-semibold text-[#2F7546]">
                Share request completed
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[#5F8069]">
                Share created for {recipient.trim()}.
                {shareDetails.url
                  ? " Copy the tracking link or share it using your device."
                  : " The server did not provide a tracking URL."}
              </p>
            </div>
          </div>

          {shareDetails.url && (
            <>
              <div className="mt-4 flex min-h-[56px] items-center gap-3 rounded-[14px] bg-[#F7F5F8] px-4">
                <p className="min-w-0 flex-1 truncate text-[13px] text-[#625C66]">
                  {shareDetails.url}
                </p>

                <button
                  type="button"
                  onClick={() => void copyLink()}
                  aria-label="Copy tracking link"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#7442AD]"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => void nativeShare()}
                className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
              >
                <Share2 size={18} />
                Share Live Trip
              </motion.button>
            </>
          )}

          {shareDetails.shareId ? (
            <button
              type="button"
              onClick={() => void stopSharing()}
              disabled={revokeMutation.isPending}
              className="mt-3 flex h-[50px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#FFF0EF] text-[14px] font-semibold text-[#C94B45] disabled:opacity-60"
            >
              {revokeMutation.isPending ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <XCircle size={18} />
              )}
              Stop Sharing
            </button>
          ) : (
            <p className="mt-3 text-[12px] leading-5 text-[#918B95]">
              This response did not contain a share ID, so this screen
              cannot revoke the share yet.
            </p>
          )}
        </div>
      )}
    </RideModalSheet>
  );
}

// import {
//   Check,
//   Clock3,
//   Copy,
//   MapPin,
//   Share2,
// } from "lucide-react";
// import {
//   motion,
// } from "framer-motion";
// import {
//   useState,
// } from "react";

// import RideModalSheet from "./RideModalSheet";

// import type {
//   RideDriver,
//   RideLocation,
// } from "../../../types/passengerRide";

// interface ShareRideSheetProps {
//   open: boolean;
//   onClose: () => void;
//   driver?: RideDriver | null;
//   pickup?: RideLocation | null;
//   destination?: RideLocation | null;
//   eta?: string;
//   liveTripUrl?: string;
// }

// export default function ShareRideSheet({
//   open,
//   onClose,
//   driver,
//   pickup,
//   destination,
//   eta = "18 min",
//   liveTripUrl = "",
// }: ShareRideSheetProps) {
//   const [copied, setCopied] =
//     useState(false);

//   const copyLink = async () => {
//     if (!liveTripUrl) {
//       return;
//     }

//     try {
//       await navigator.clipboard.writeText(
//         liveTripUrl,
//       );

//       setCopied(true);

//       window.setTimeout(
//         () => setCopied(false),
//         1800,
//       );
//     } catch {
//       setCopied(false);
//     }
//   };

//   const nativeShare = async () => {
//     if (!liveTripUrl) {
//       return;
//     }

//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title:
//             "Follow my Sur-Drive trip",
//           text:
//             "Track my live trip status.",
//           url: liveTripUrl,
//         });
//       } catch {
//         // User dismissed share sheet.
//       }

//       return;
//     }

//     await copyLink();
//   };

//   return (
//     <RideModalSheet
//       open={open}
//       onClose={onClose}
//       title="Share your trip"
//       description="Let someone follow your ride and arrival status."
//     >
//       {driver && (
//         <div
//           className="
//             flex items-center gap-3
//             rounded-[16px]
//             bg-[#F8F6F9]
//             p-4
//           "
//         >
//           <div
//             className="
//               flex h-12 w-12
//               items-center justify-center
//               rounded-full
//               bg-[#EEE7F5]
//               text-[18px] font-bold
//               text-[#7442AD]
//             "
//           >
//             {driver.photo ? (
//               <img
//                 src={driver.photo}
//                 alt={driver.firstName}
//                 className="object-cover w-full h-full rounded-full"
//               />
//             ) : (
//               driver.firstName.charAt(0)
//             )}
//           </div>

//           <div className="flex-1 min-w-0">
//             <p className="text-[15px] font-semibold text-[#302B34]">
//               {driver.firstName}
//             </p>

//             <p className="mt-1 truncate text-[12px] text-[#918B95]">
//               {driver.vehicle.make}{" "}
//               {driver.vehicle.model} •{" "}
//               {driver.vehicle.plateNumber}
//             </p>
//           </div>

//           <div className="flex items-center gap-1 text-[#7442AD]">
//             <Clock3 size={15} />

//             <span className="text-[13px] font-semibold">
//               {eta}
//             </span>
//           </div>
//         </div>
//       )}

//       <div
//         className="
//           mt-4 rounded-[16px]
//           border border-[#EEEAF1]
//           p-4
//         "
//       >
//         {pickup && (
//           <div className="flex gap-3">
//             <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-[3px] border-[#7442AD]" />

//             <div>
//               <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#AAA4AD]">
//                 Pickup
//               </p>

//               <p className="mt-1 text-[14px] font-medium text-[#302B34]">
//                 {pickup.label}
//               </p>
//             </div>
//           </div>
//         )}

//         {pickup && destination && (
//           <div className="ml-[5px] my-2 h-7 border-l-2 border-dotted border-[#D4CED8]" />
//         )}

//         {destination && (
//           <div className="flex gap-3">
//             <MapPin
//               size={17}
//               className="mt-0.5 shrink-0 text-[#302B34]"
//             />

//             <div>
//               <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#AAA4AD]">
//                 Destination
//               </p>

//               <p className="mt-1 text-[14px] font-medium text-[#302B34]">
//                 {destination.label}
//               </p>
//             </div>
//           </div>
//         )}
//       </div>

//       {liveTripUrl ? (
//         <>
//           <div
//             className="
//               mt-4 flex min-h-[56px]
//               items-center gap-3
//               rounded-[14px]
//               bg-[#F7F5F8]
//               px-4
//             "
//           >
//             <p className="min-w-0 flex-1 truncate text-[13px] text-[#625C66]">
//               {liveTripUrl}
//             </p>

//             <button
//               type="button"
//               onClick={copyLink}
//               className="
//                 flex h-9 w-9
//                 shrink-0 items-center
//                 justify-center
//                 rounded-full bg-white
//                 text-[#7442AD]
//               "
//             >
//               {copied ? (
//                 <Check size={18} />
//               ) : (
//                 <Copy size={18} />
//               )}
//             </button>
//           </div>

//           <motion.button
//             type="button"
//             whileTap={{
//               scale: 0.98,
//             }}
//             onClick={nativeShare}
//             className="
//               mt-5 flex h-[54px]
//               w-full items-center
//               justify-center gap-2
//               rounded-[14px]
//               bg-[#7442AD]
//               text-[16px] font-semibold
//               text-white
//             "
//           >
//             <Share2 size={18} />
//             Share Live Trip
//           </motion.button>
//         </>
//       ) : (
//         <div
//           className="
//             mt-4 rounded-[14px]
//             bg-[#FFF6E7]
//             p-4 text-[13px]
//             leading-5 text-[#765E37]
//           "
//         >
//           A live tracking link will appear here when the backend provides the trip-sharing URL.
//         </div>
//       )}
//     </RideModalSheet>
//   );
// }