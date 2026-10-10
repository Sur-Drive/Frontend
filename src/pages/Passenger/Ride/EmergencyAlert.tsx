import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import RideHeader from "../../../components/passenger/ride/RideHeader";

import { usePassengerSOS } from "../../../hooks/passenger/usePassengerSafetyArticles";
import type { SOSResponse } from "../../../api/passenger/passengerSafetyArticles.api";

type SOSStatus = "idle" | "locating" | "sending" | "submitted";

export default function EmergencyAlert() {
  const navigate = useNavigate();

  // Hooks must be inside the component.
  const sosMutation = usePassengerSOS();

  const [status, setStatus] = useState<SOSStatus>("idle");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [sosResult, setSosResult] =
  useState<SOSResponse | null>(null);

  const isBusy = status === "locating" || status === "sending";
  const isSubmitted = status === "submitted";

  const sendSOS = () => {
    if (isBusy || isSubmitted) return;

    if (!navigator.geolocation) {
      toast.error(
        "Location is unavailable on this device. Contact emergency services directly.",
      );
      return;
    }

    setStatus("locating");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(coordinates);
        setStatus("sending");

        try {
          const response = await sosMutation.mutateAsync({
            latitude: String(coordinates.latitude),
            longitude: String(coordinates.longitude),
          });

          if (!response.success) {
            throw new Error(
              response.message || "Unable to submit SOS.",
            );
          }

          setSosResult(response);
          setStatus("submitted");

          toast.success(response.message);
        } catch (error) {
          setStatus("idle");

          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to submit your SOS request.",
          );
        }
      },
      (error) => {
        setStatus("idle");

        const message =
          error.code === 1
            ? "Location permission was denied. Enable location access or contact emergency services directly."
            : "Unable to determine your location. Please try again or contact emergency services directly.";

        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF9FB]">
      <RideHeader
        title="Emergency SOS"
        onBack={() => navigate("/passenger/ride/safety")}
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-7 sm:px-7">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative mx-auto flex h-[104px] w-[104px] items-center justify-center">
            <motion.span
              animate={{
                scale: [0.9, 1.25, 0.9],
                opacity: [0.45, 0, 0.45],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className={`absolute inset-0 rounded-full ${
                isSubmitted
                  ? "bg-[#41A66B]/20"
                  : "bg-[#FF5A4F]/20"
              }`}
            />

            <div
              className={`relative flex h-[76px] w-[76px] items-center justify-center rounded-full ${
                isSubmitted
                  ? "bg-[#E6F7EB] text-[#31945A]"
                  : "bg-[#FFE8E5] text-[#F4544B]"
              }`}
            >
              {isSubmitted ? (
                <CheckCircle2 size={36} />
              ) : (
                <ShieldAlert size={36} />
              )}
            </div>
          </div>

          <h1 className="mt-5 text-[24px] font-semibold text-[#302B34]">
            {isSubmitted
              ? "SOS Request Submitted"
              : "Emergency Assistance"}
          </h1>

          <p className="mx-auto mt-3 max-w-[370px] text-[14px] leading-6 text-[#827985]">
            {isSubmitted
              ? "The emergency request was accepted by the API. Contact emergency services directly if you need immediate assistance."
              : "If you feel unsafe during your ride, you can submit an emergency alert with your current location."}
          </p>
        </motion.section>

        {/* STATUS */}

        <section className="mt-8 rounded-[18px] bg-white p-5 shadow-[0_5px_25px_rgba(30,20,38,0.04)]">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                isSubmitted
                  ? "bg-[#EAF7EC] text-[#3A955B]"
                  : "bg-[#FFF0EF] text-[#E9514B]"
              }`}
            >
              {isSubmitted ? (
                <ShieldCheck size={22} />
              ) : (
                <AlertCircle size={22} />
              )}
            </span>

            <div>
              <h2 className="text-[16px] font-semibold text-[#302B34]">
                {status === "locating"
                  ? "Getting your location"
                  : status === "sending"
                    ? "Submitting emergency alert"
                    : isSubmitted
                      ? "Request submitted"
                      : "Ready to send an alert"}
              </h2>

              <p className="mt-2 text-[13px] leading-6 text-[#918B95]">
                {status === "locating"
                  ? "Please allow location access so your current coordinates can be included."
                  : status === "sending"
                    ? "Your emergency request is being sent to Sur-Drive."
                    : isSubmitted
                      ? "The server accepted the request. Delivery to individual contacts or emergency responders has not been independently confirmed."
                      : "Your alert has not been sent. Tap the button below to confirm and submit it."}
              </p>
            </div>
          </div>
        </section>

                {/* LOCATION */}

        <section className="mt-4 rounded-[18px] bg-white p-5 shadow-[0_5px_25px_rgba(30,20,38,0.04)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]">
              <MapPin size={21} />
            </span>

            <div>
              <h2 className="text-[15px] font-semibold text-[#302B34]">
                Your Location
              </h2>

              <p className="mt-1 text-[13px] text-[#918B95]">
                {location
                  ? "Coordinates obtained from your device"
                  : "Location will be requested when you send SOS"}
              </p>
            </div>
          </div>

          {location && (
            <div className="mt-4 rounded-[13px] bg-[#F8F6FA] p-4">
              <p className="text-[13px] leading-6 text-[#625C66]">
                Latitude: {location.latitude.toFixed(6)}
              </p>
              <p className="text-[13px] leading-6 text-[#625C66]">
                Longitude: {location.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </section>

        {/* SOS SUCCESS DETAILS — NEW SECTION */}

        {isSubmitted && sosResult && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            {/* NOTIFIED CONTACTS */}

            <div className="rounded-[18px] bg-white p-5">
              <div className="flex items-center gap-2 text-[#32945A]">
                <ShieldCheck size={21} />
                <h2 className="text-[16px] font-semibold">
                  Emergency Alert Sent
                </h2>
              </div>

              <p className="mt-3 text-[14px] text-[#776E7D]">
                {sosResult.message}
              </p>

              <p className="mt-2 text-[14px] font-medium text-[#302B34]">
                {sosResult.contactsNotified} emergency{" "}
                {sosResult.contactsNotified === 1
                  ? "contact"
                  : "contacts"}{" "}
                notified
              </p>

              {sosResult.contacts.length > 0 && (
                <div className="mt-4 space-y-2">
                  {sosResult.contacts.map((phone, index) => (
                    <div
                      key={`${phone}-${index}`}
                      className="rounded-xl bg-[#F0F8F1] p-3"
                    >
                      <p className="text-[14px] font-medium text-[#302B34]">
                        {phone}
                      </p>
                      <p className="mt-1 text-[12px] text-[#32945A]">
                        Notified
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ALERT LOCATION */}

            <div className="rounded-[18px] bg-white p-5">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-[#7442AD]" />
                <h2 className="text-[16px] font-semibold text-[#302B34]">
                  Alert Location
                </h2>
              </div>

              <p className="mt-3 text-[14px] leading-6 text-[#776E7D]">
                {sosResult.location.address}
              </p>
            </div>

            {/* SOS REFERENCE */}

            {/* <div className="rounded-[14px] bg-[#F8F6FA] p-4">
              <p className="text-[12px] text-[#918B95]">
                SOS Reference
              </p>

              <p className="mt-1 break-all text-[13px] font-medium text-[#302B34]">
                {sosResult.sosAlertId}
              </p>
            </div> */}
          </motion.section>
        )}

        {/* EMERGENCY ACTION */}

        {!isSubmitted && (
          <motion.button
            type="button"
            whileTap={!isBusy ? { scale: 0.985 } : undefined}
            onClick={sendSOS}
            disabled={isBusy}
            className="mt-6 flex h-[58px] w-full items-center justify-center gap-3 rounded-[14px] bg-[#F4544B] px-5 text-[16px] font-semibold text-white shadow-[0_10px_25px_rgba(244,84,75,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isBusy ? (
              <>
                <LoaderCircle size={21} className="animate-spin" />
                {status === "locating"
                  ? "Getting location..."
                  : "Sending SOS..."}
              </>
            ) : (
              <>
                <ShieldAlert size={21} />
                Confirm & Send SOS
              </>
            )}
          </motion.button>
        )}

        {/* EMERGENCY CALL */}

        <a
          href="tel:112"
          className={`flex h-[56px] w-full items-center justify-center gap-3 rounded-[14px] px-5 text-[16px] font-semibold ${
            isSubmitted
              ? "mt-6 bg-[#F4544B] text-white"
              : "mt-3 bg-[#FFF0EF] text-[#D94D46]"
          }`}
        >
          <PhoneCall size={20} />
          Call Emergency Services (112)
        </a>

        <p className="mt-3 text-center text-[12px] leading-5 text-[#918B95]">
          This opens your device's phone dialer. The call must be
          completed through your phone network.
        </p>

        {/* BACK ACTION */}

        <button
          type="button"
          onClick={() => navigate("/passenger/ride/safety")}
          disabled={isBusy}
          className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#EFE8F5] text-[15px] font-semibold text-[#65566F] disabled:opacity-50"
        >
          <ArrowLeft size={18} />
          Return to Ride Safety
        </button>

        <div className="mt-6 rounded-[14px] bg-[#FFF5E5] p-4">
          <p className="text-[13px] leading-6 text-[#715D3A]">
            <strong>Important:</strong> Do not assume that returning
            to the ride screen cancels a submitted SOS. The current
            API documentation does not provide an SOS cancellation
            endpoint. If this was a false alarm, contact the
            appropriate support or emergency service directly.
          </p>
        </div>
      </main>
    </div>
  );
}

// import {
//   BellRing,
//   CheckCircle2,
//   ChevronRight,
//   MapPin,
//   ShieldAlert,
//   ShieldCheck,
//   UsersRound,
// } from "lucide-react";

// import {
//   motion,
// } from "framer-motion";



// import {
//   useState,
// } from "react";

// import RideHeader from "../../../components/passenger/ride/RideHeader";

// import {
//   usePassengerRide,
// } from "../../../context/PassengerRideContext";
// import { useNavigate } from "react-router-dom";

// // import { usePassengerSOS } from "../../../hooks/passenger/usePassengerSafetyArticles";
// // import { toast } from "sonner";

// // // Inside EmergencyAlert:
// // const sosMutation = usePassengerSOS();

// // const handleSendSOS = async () => {
// //   if (sosMutation.isPending) return;

// //   if (!navigator.geolocation) {
// //     toast.error(
// //       "Location is unavailable on this device. Please contact emergency services directly.",
// //     );
// //     return;
// //   }

// //   navigator.geolocation.getCurrentPosition(
// //     async (position) => {
// //       try {
// //         await sosMutation.mutateAsync({
// //           latitude: String(position.coords.latitude),
// //           longitude: String(position.coords.longitude),
// //         });

// //         toast.success("Your SOS request was submitted.");
// //       } catch (error) {
// //         toast.error(
// //           error instanceof Error
// //             ? error.message
// //             : "Unable to send SOS. Please try again.",
// //         );
// //       }
// //     },
// //     () => {
// //       toast.error(
// //         "We couldn't access your location. Enable location permission or contact emergency services directly.",
// //       );
// //     },
// //     {
// //       enableHighAccuracy: true,
// //       timeout: 12000,
// //       maximumAge: 0,
// //     },
// //   );
// // };

// export default function EmergencyAlert() {
//   const navigate = useNavigate();

//   const {
//     ride,
//   } = usePassengerRide();

//   const [
//     cancelled,
//     setCancelled,
//   ] = useState(false);

//   const cancelAlert = () => {
//     setCancelled(true);

//     window.setTimeout(() => {
//       navigate(
//         "/passenger/ride/safety",
//         {
//           replace: true,
//         },
//       );
//     }, 700);
//   };

//   return (
//     <div
//       className="
//         min-h-[100dvh]
//         bg-[#FAF9FB]
//       "
//     >
//       <RideHeader
//         title="Emergency Alert"
//         onBack={() =>
//           navigate(
//             "/passenger/ride/safety",
//           )
//         }
//       />

//       <main
//         className="
//           mx-auto
//           w-full
//           max-w-[680px]
//           px-5
//           pb-10
//           pt-5
//           sm:px-7
//         "
//       >
//         {/* ===================================
//             ALERT STATUS
//         =================================== */}

//         <section className="text-center">
//           <div
//             className="
//               relative
//               mx-auto
//               flex
//               h-[88px]
//               w-[88px]
//               items-center
//               justify-center
//             "
//           >
//             <motion.span
//               animate={{
//                 scale: [
//                   0.9,
//                   1.35,
//                 ],
//                 opacity: [
//                   0.45,
//                   0,
//                 ],
//               }}
//               transition={{
//                 duration: 1.6,
//                 repeat:
//                   Infinity,
//                 ease: "easeOut",
//               }}
//               className="
//                 absolute
//                 inset-0
//                 rounded-full
//                 bg-[#FF5A4F]/15
//               "
//             />

//             <motion.span
//               animate={{
//                 scale: [
//                   0.9,
//                   1.18,
//                   0.9,
//                 ],
//               }}
//               transition={{
//                 duration: 1.4,
//                 repeat:
//                   Infinity,
//               }}
//               className="
//                 absolute
//                 inset-[12px]
//                 rounded-full
//                 bg-[#FFE1DE]
//               "
//             />

//             <div
//               className="
//                 relative
//                 flex
//                 h-[48px]
//                 w-[48px]
//                 items-center
//                 justify-center
//                 rounded-full
//                 bg-[#FFEEE9]
//                 text-[#F4544B]
//               "
//             >
//               <ShieldAlert
//                 size={23}
//               />
//             </div>
//           </div>

//           <motion.p
//             animate={{
//               opacity: [
//                 1,
//                 0.65,
//                 1,
//               ],
//             }}
//             transition={{
//               duration: 1.4,
//               repeat:
//                 Infinity,
//             }}
//             className="
//               mt-2
//               text-[14px]
//               font-bold
//               uppercase
//               tracking-[0.04em]
//               text-[#E84943]
//             "
//           >
//             Alert Active
//           </motion.p>
//         </section>

//         {/* ===================================
//             CONTACTS
//         =================================== */}

//         <section
//           className="
//             mt-6
//             rounded-[18px]
//             bg-white
//             p-4
//             shadow-[0_5px_25px_rgba(30,20,38,0.04)]
//           "
//         >
//           <div
//             className="
//               flex
//               items-center
//               gap-2
//               border-b
//               border-[#EEEAF1]
//               pb-3
//             "
//           >
//             <UsersRound
//               size={19}
//               className="text-[#E9514B]"
//             />

//             <h2
//               className="
//                 text-[15px]
//                 font-semibold
//                 text-[#302B34]
//               "
//             >
//               Notified Contacts
//             </h2>
//           </div>

//           <EmergencyContact
//             name="Pumpkin 🎃"
//             phone="+234 812 456 8901"
//             relation="Spouse or partner"
//           />

//           <div className="h-px bg-[#F0EDF2]" />

//           <EmergencyContact
//             name="Adeniji Junior"
//             phone="+234 812 456 8901"
//             relation="Sibling"
//           />
//         </section>

//         {/* ===================================
//             SAFETY DESK
//         =================================== */}

//         <section
//           className="
//             mt-4
//             rounded-[18px]
//             bg-white
//             p-4
//             shadow-[0_5px_25px_rgba(30,20,38,0.04)]
//           "
//         >
//           <div
//             className="flex items-center justify-between gap-3 "
//           >
//             <div
//               className="flex items-center gap-2 "
//             >
//               <ShieldCheck
//                 size={19}
//                 className="text-[#7442AD]"
//               />

//               <h2
//                 className="
//                   text-[15px]
//                   font-semibold
//                   text-[#302B34]
//                 "
//               >
//                 Safety Desk
//                 Active
//               </h2>
//             </div>

//             <span
//               className="
//                 text-[13px]
//                 font-medium
//                 text-[#928B96]
//               "
//             >
//               Just now
//             </span>
//           </div>

//           <p
//             className="
//               mt-3
//               text-[14px]
//               leading-6
//               text-[#7D7681]
//             "
//           >
//             Our 24/7 dedicated
//             support team has
//             received your
//             distress signal and
//             is tracking your
//             vehicle's live
//             coordinates.
//           </p>
//         </section>

//         {/* ===================================
//             LOCATION
//         =================================== */}

//         <section
//           className="
//             mt-4
//             flex
//             items-start
//             gap-3
//             rounded-[18px]
//             bg-white
//             p-4
//             shadow-[0_5px_25px_rgba(30,20,38,0.04)]
//           "
//         >
//           <span
//             className="
//               flex
//               h-11
//               w-11
//               shrink-0
//               items-center
//               justify-center
//               rounded-full
//               bg-[#FFF5DD]
//               text-[#D99B17]
//             "
//           >
//             <MapPin
//               size={20}
//             />
//           </span>

//           <div>
//             <h2
//               className="
//                 text-[15px]
//                 font-semibold
//                 text-[#302B34]
//               "
//             >
//               Live Location
//               Shared
//             </h2>

//             <p
//               className="
//                 mt-1
//                 text-[13px]
//                 leading-5
//                 text-[#96909A]
//               "
//             >
//               Your current trip
//               location is being
//               shared with your
//               emergency contacts
//               and Sur-Drive
//               safety team.
//             </p>
//           </div>
//         </section>

//         {/* ===================================
//             EMERGENCY CALL
//         =================================== */}

//         <motion.button
//           type="button"
//           whileTap={{
//             scale: 0.985,
//           }}
//           className="
//             mt-5
//             flex
//             h-[58px]
//             w-full
//             items-center
//             rounded-[13px]
//             bg-[#FF5A42]
//             px-2
//             text-white
//             shadow-[0_10px_25px_rgba(255,90,66,0.24)]
//           "
//         >
//           <motion.span
//             animate={{
//               x: [
//                 0,
//                 7,
//                 0,
//               ],
//             }}
//             transition={{
//               duration: 1.2,
//               repeat:
//                 Infinity,
//             }}
//             className="
//               flex
//               h-11
//               w-11
//               shrink-0
//               items-center
//               justify-center
//               rounded-[10px]
//               bg-white
//               text-[#FF5A42]
//             "
//           >
//             <ChevronRight
//               size={24}
//             />
//           </motion.span>

//           <span
//             className="
//               flex-1
//               pr-8
//               text-center
//               text-[15px]
//               font-semibold
//             "
//           >
//             Call Emergency
//             Services
//           </span>
//         </motion.button>

//         <motion.button
//           type="button"
//           whileTap={{
//             scale: 0.985,
//           }}
//           onClick={
//             cancelAlert
//           }
//           disabled={
//             cancelled
//           }
//           className="
//             mt-3
//             flex
//             h-[54px]
//             w-full
//             items-center
//             justify-center
//             gap-2
//             rounded-[13px]
//             bg-[#EFE8F5]
//             text-[15px]
//             font-semibold
//             text-[#65566F]
//           "
//         >
//           {cancelled ? (
//             <>
//               <CheckCircle2
//                 size={19}
//               />
//               Alert Cancelled
//             </>
//           ) : (
//             "Cancel Alert (False Alarm)"
//           )}
//         </motion.button>

//         <div
//           className="
//             mt-5
//             flex
//             items-start
//             gap-3
//             rounded-[14px]
//             bg-[#FFF1EF]
//             p-4
//           "
//         >
//           <BellRing
//             size={19}
//             className="
//               mt-0.5
//               shrink-0
//               text-[#E9514B]
//             "
//           />

//           <p
//             className="
//               text-[13px]
//               leading-5
//               text-[#80514E]
//             "
//           >
//             Keep this screen
//             open while help is
//             being coordinated.
//           </p>
//         </div>
//       </main>
//     </div>
//   );
// }

// function EmergencyContact({
//   name,
//   phone,
//   relation,
// }: {
//   name: string;
//   phone: string;
//   relation: string;
// }) {
//   return (
//     <div
//       className="flex items-center gap-3 py-4 "
//     >
//       <div className="flex-1 min-w-0">
//         <p
//           className="
//             text-[15px]
//             font-semibold
//             text-[#302B34]
//           "
//         >
//           {name}
//         </p>

//         <div
//           className="
//             mt-1
//             flex
//             flex-wrap
//             items-center
//             gap-x-2
//             gap-y-1
//             text-[13px]
//             text-[#918B95]
//           "
//         >
//           <span>
//             {phone}
//           </span>

//           <span>
//             •
//           </span>

//           <span>
//             {relation}
//           </span>
//         </div>
//       </div>

//       <span
//         className="
//           rounded-full
//           bg-[#EAF7EC]
//           px-3
//           py-1.5
//           text-[13px]
//           font-semibold
//           text-[#3A955B]
//         "
//       >
//         Notified
//       </span>
//     </div>
//   );
// }