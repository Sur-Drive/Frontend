import {
  ContactRound,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import EmergencyContactRow from "../../../../components/passenger/safety/EmergencyContactRow";

import {
  usePassengerEmergencyContacts,
} from "../../../../hooks/passenger/usePassengerSafetyApi";

import {
  getPassengerApiError,
} from "../../../../api/passenger/getPassengerApiError";

export default function EmergencyContacts() {
  const navigate =
    useNavigate();

  const contactsQuery =
    usePassengerEmergencyContacts();

  const emergencyContacts =
    contactsQuery.data ??
    [];

  const addContact = () => {
    navigate(
      "/passenger/account/safety/emergency-contacts/add",
    );
  };

  const retry =
    async () => {
      try {
        const result =
          await contactsQuery.refetch();

        if (result.error) {
          throw result.error;
        }
      } catch (caughtError) {
        toast.error(
          getPassengerApiError(
            caughtError,
            "Unable to load emergency contacts.",
          ),
        );
      }
    };

  if (
    contactsQuery.isPending
  ) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-white">
        <RideHeader
          title="Emergency contact"
          onBack={() =>
            navigate(
              "/passenger/account/safety",
            )
          }
        />

        <main className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <LoaderCircle
              size={32}
              className="animate-spin text-[#7442AD]"
            />

            <p className="text-[14px] text-[#918B95]">
              Loading contacts...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (
    contactsQuery.isError
  ) {
    const message =
      getPassengerApiError(
        contactsQuery.error,
        "Unable to load emergency contacts.",
      );

    return (
      <div className="flex min-h-[100dvh] flex-col bg-white">
        <RideHeader
          title="Emergency contact"
          onBack={() =>
            navigate(
              "/passenger/account/safety",
            )
          }
        />

        <main className="mx-auto flex w-full max-w-[680px] flex-1 items-center justify-center px-5">
          <div className="text-center">
            <p className="text-[15px] text-red-600">
              {message}
            </p>

            <button
              type="button"
              onClick={retry}
              className="mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-[#7442AD]"
            >
              <RefreshCw
                size={17}
              />

              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <RideHeader
        title="Emergency contact"
        onBack={() =>
          navigate(
            "/passenger/account/safety",
          )
        }
      />

      <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col px-5 pb-[calc(90px+env(safe-area-inset-bottom))] pt-5 sm:px-7">
        <AnimatePresence mode="wait">
          {emergencyContacts.length ===
          0 ? (
            <motion.div
              key="empty"
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="flex flex-col items-center justify-center flex-1 pb-24 text-center"
            >
              <motion.div
                initial={{
                  scale: 0.85,
                }}
                animate={{
                  scale: 1,
                }}
                className="relative text-[#A092AD]"
              >
                <ContactRound
                  size={74}
                  strokeWidth={
                    1.6
                  }
                />

                <span className="absolute -right-2 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-[#F1EAF7] text-[18px] font-semibold text-[#7442AD]">
                  +
                </span>
              </motion.div>

              <h2 className="mt-7 text-[18px] font-semibold text-[#302B34]">
                No contacts added
              </h2>

              <p className="mt-2 max-w-[330px] text-[14px] leading-6 text-[#918B95]">
                For your security add
                at least one person
                that we can call in an
                emergency.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="contacts"
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >
              <p className="mb-5 max-w-[500px] text-[14px] leading-6 text-[#918B95]">
                In an emergency, Sur
                Drive may contact your
                emergency contact if
                we're unable to reach
                you.
              </p>

              <div className="overflow-hidden rounded-[17px] bg-white shadow-[0_5px_28px_rgba(30,20,38,0.055)]">
                {emergencyContacts.map(
                  (contact) => (
                    <EmergencyContactRow
                      key={
                        contact.id
                      }
                      contact={
                        contact
                      }
                    />
                  ),
                )}

                <motion.button
                  type="button"
                  whileTap={{
                    scale: 0.99,
                  }}
                  onClick={
                    addContact
                  }
                  className="flex min-h-[64px] w-full items-center gap-3 px-4 text-left"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#F6F4F7] text-[#77717B]">
                    <Plus
                      size={19}
                    />
                  </span>

                  <span className="text-[15px] font-medium text-[#302B34]">
                    Add contact
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {emergencyContacts.length ===
        0 && (
        <div className="fixed inset-x-0 bottom-0 z-[100] bg-white px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
          <motion.button
            type="button"
            whileTap={{
              scale: 0.98,
            }}
            onClick={
              addContact
            }
            className="mx-auto flex h-[56px] w-full max-w-[640px] items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white"
          >
            <Plus
              size={20}
            />

            Add contact
          </motion.button>
        </div>
      )}
    </div>
  );
}

// import {
//   ContactRound,
//   Plus,
// } from "lucide-react";
// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";
// import { useNavigate } from "react-router-dom";

// import RideHeader from "../../../../components/passenger/ride/RideHeader";
// import EmergencyContactRow from "../../../../components/passenger/safety/EmergencyContactRow";

// import { usePassengerSafety } from "../../../../context/PassengerSafetyContext";

// export default function EmergencyContacts() {
//   const navigate = useNavigate();

//   const {
//     emergencyContacts,
//   } = usePassengerSafety();

//   const addContact = () => {
//     navigate(
//       "/passenger/account/safety/emergency-contacts/add",
//     );
//   };

//   return (
//     <div className="flex min-h-[100dvh] flex-col bg-white">
//       <RideHeader
//         title="Emergency contact"
//         onBack={() =>
//           navigate(
//             "/passenger/account/safety",
//           )
//         }
//       />

//       <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col px-5 pb-[calc(90px+env(safe-area-inset-bottom))] pt-5 sm:px-7">
//         <AnimatePresence mode="wait">
//           {emergencyContacts.length ===
//           0 ? (
//             <motion.div
//               key="empty"
//               initial={{
//                 opacity: 0,
//                 y: 15,
//               }}
//               animate={{
//                 opacity: 1,
//                 y: 0,
//               }}
//               exit={{
//                 opacity: 0,
//               }}
//               className="flex flex-col items-center justify-center flex-1 pb-24 text-center"
//             >
//               <motion.div
//                 initial={{
//                   scale: 0.85,
//                 }}
//                 animate={{
//                   scale: 1,
//                 }}
//                 className="relative text-[#A092AD]"
//               >
//                 <ContactRound
//                   size={74}
//                   strokeWidth={1.6}
//                 />

//                 <span className="absolute -right-2 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-[#F1EAF7] text-[18px] font-semibold text-[#7442AD]">
//                   +
//                 </span>
//               </motion.div>

//               <h2 className="mt-7 text-[18px] font-semibold text-[#302B34]">
//                 No contacts added
//               </h2>

//               <p className="mt-2 max-w-[330px] text-[14px] leading-6 text-[#918B95]">
//                 For your security add at least one
//                 person that we can call in an
//                 emergency.
//               </p>
//             </motion.div>
//           ) : (
//             <motion.div
//               key="contacts"
//               initial={{
//                 opacity: 0,
//                 y: 12,
//               }}
//               animate={{
//                 opacity: 1,
//                 y: 0,
//               }}
//             >
//               <p className="mb-5 max-w-[500px] text-[14px] leading-6 text-[#918B95]">
//                 In an emergency, Sur Drive may
//                 contact your emergency contact if
//                 we're unable to reach you.
//               </p>

//               <div className="overflow-hidden rounded-[17px] bg-white shadow-[0_5px_28px_rgba(30,20,38,0.055)]">
//                 {emergencyContacts.map(
//                   (contact) => (
//                     <EmergencyContactRow
//                       key={
//                         contact.id
//                       }
//                       contact={
//                         contact
//                       }
//                     />
//                   ),
//                 )}

//                 <motion.button
//                   type="button"
//                   whileTap={{
//                     scale: 0.99,
//                   }}
//                   onClick={
//                     addContact
//                   }
//                   className="flex min-h-[64px] w-full items-center gap-3 px-4 text-left"
//                 >
//                   <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#F6F4F7] text-[#77717B]">
//                     <Plus
//                       size={19}
//                     />
//                   </span>

//                   <span className="text-[15px] font-medium text-[#302B34]">
//                     Add contact
//                   </span>
//                 </motion.button>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </main>

//       {emergencyContacts.length ===
//         0 && (
//         <div className="fixed inset-x-0 bottom-0 z-[100] bg-white px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
//           <motion.button
//             type="button"
//             whileTap={{
//               scale: 0.98,
//             }}
//             onClick={
//               addContact
//             }
//             className="mx-auto flex h-[56px] w-full max-w-[640px] items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_25px_rgba(116,66,173,0.22)]"
//           >
//             <Plus size={20} />
//             Add contact
//           </motion.button>
//         </div>
//       )}
//     </div>
//   );
// }