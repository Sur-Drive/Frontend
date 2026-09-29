import {
  AnimatePresence,
  motion,
} from "framer-motion";

import type {
  EmergencyRelationship,
} from "../../../context/PassengerSafetyContext";

interface Props {
  open: boolean;
  selected:
    | EmergencyRelationship
    | null;

  onClose: () => void;

  onSelect: (
    relationship: EmergencyRelationship,
  ) => void;
}

const relationships: EmergencyRelationship[] =
  [
    "Parent",
    "Sibling",
    "Spouse or partner",
    "Family member",
    "Friend or colleague",
  ];

export default function RelationshipSheet({
  open,
  selected,
  onClose,
  onSelect,
}: Props) {
  const choose = (
    relationship: EmergencyRelationship,
  ) => {
    onSelect(relationship);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close relationship selector"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={
              onClose
            }
            className="fixed inset-0 z-[1100] bg-[#211927]/45 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{
              y: "100%",
            }}
            animate={{
              y: 0,
            }}
            exit={{
              y: "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 28,
            }}
            className="fixed inset-x-0 bottom-0 z-[1200] rounded-t-[28px] bg-white px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-15px_60px_rgba(31,19,42,0.18)]"
          >
            <div className="mx-auto h-1 w-12 rounded-full bg-[#D5D0D9]" />

            <h2 className="mt-5 text-center text-[18px] font-semibold text-[#6C5C8D]">
              Select relationship
            </h2>

            <div className="mt-3">
              {relationships.map(
                (
                  relationship,
                ) => {
                  const active =
                    selected ===
                    relationship;

                  return (
                    <motion.button
                      key={
                        relationship
                      }
                      type="button"
                      whileTap={{
                        scale: 0.98,
                      }}
                      onClick={() =>
                        choose(
                          relationship,
                        )
                      }
                      className={`block w-full py-2 text-center transition ${
                        active
                          ? "text-[18px] font-bold text-[#302B72]"
                          : "text-[14px] font-medium text-[#9B91A8]"
                      }`}
                    >
                      {
                        relationship
                      }
                    </motion.button>
                  );
                },
              )}
            </div>

            <motion.button
              type="button"
              whileTap={{
                scale: 0.98,
              }}
              disabled={
                !selected
              }
              onClick={
                onClose
              }
              className="mt-5 h-[56px] w-full rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:opacity-40"
            >
              Select
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}