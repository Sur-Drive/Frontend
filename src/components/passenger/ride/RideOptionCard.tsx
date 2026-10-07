import {
  Check,
  Clock3,
  Users,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  RideOption,
} from "../../../types/passengerRide";

interface RideOptionCardProps {
  option: RideOption;
  selected: boolean;
  onSelect: () => void;
}

export default function RideOptionCard({
  option,
  selected,
  onSelect,
}: RideOptionCardProps) {
  /**
   * Price is intentionally treated as optional.
   *
   * We should not crash when the backend has not
   * supplied an authoritative fare.
   */
  const hasPrice =
    typeof option.price ===
      "number" &&
    Number.isFinite(
      option.price,
    );

  return (
    <motion.button
      type="button"
      layout
      whileTap={{
        scale: 0.985,
      }}
      onClick={onSelect}
      className={`
        relative
        flex
        w-full
        items-center
        gap-4
        rounded-[18px]
        border
        p-4
        text-left
        transition-all
        ${
          selected
            ? `
              border-[#7442AD]
              bg-[#FBF8FE]
              shadow-[0_7px_25px_rgba(116,66,173,0.10)]
            `
            : `
              border-[#ECE8EF]
              bg-white
            `
        }
      `}
    >
      {/* VEHICLE IMAGE */}

      <div
        className="
          flex
          h-[64px]
          w-[82px]
          shrink-0
          items-center
          justify-center
          overflow-hidden
          rounded-[14px]
          bg-[#F4F1F6]
        "
      >
        {option.image ? (
          <img
            src={
              option.image
            }
            alt={
              option.name
            }
            className="
              h-[54px]
              w-[76px]
              object-contain
            "
          />
        ) : (
          <span
            className="
              px-2
              text-center
              text-[14px]
              font-bold
              text-[#7442AD]
            "
          >
            {
              option.name
            }
          </span>
        )}
      </div>

      {/* RIDE INFORMATION */}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className="
              truncate
              text-[17px]
              font-semibold
              text-[#302B34]
            "
          >
            {
              option.name
            }
          </h3>

          {selected && (
            <motion.span
              initial={{
                scale: 0,
              }}
              animate={{
                scale: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 24,
              }}
              className="
                flex
                h-5
                w-5
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#7442AD]
                text-white
              "
            >
              <Check
                size={12}
                strokeWidth={
                  3
                }
              />
            </motion.span>
          )}
        </div>

        {/* META */}

        {(option.eta ||
          option.seats) && (
          <div
            className="
              mt-1.5
              flex
              flex-wrap
              items-center
              gap-x-3
              gap-y-1
              text-[12px]
              text-[#918B95]
            "
          >
            {option.eta && (
              <span className="flex items-center gap-1">
                <Clock3
                  size={13}
                />

                {
                  option.eta
                }
              </span>
            )}

            {option.seats && (
              <span className="flex items-center gap-1">
                <Users
                  size={13}
                />

                {
                  option.seats
                }
              </span>
            )}
          </div>
        )}

        {/* DESCRIPTION */}

        {option.description && (
          <p
            className="
              mt-1.5
              line-clamp-1
              text-[12px]
              leading-5
              text-[#A29CA6]
            "
          >
            {
              option.description
            }
          </p>
        )}
      </div>

      {/* PRICE */}

      <div className="text-right shrink-0">
        {hasPrice ? (
          <>
            <p
              className="
                text-[17px]
                font-bold
                text-[#302B34]
              "
            >
              ₦
              {option.price!.toLocaleString(
                "en-NG",
              )}
            </p>

            <p className="mt-0.5 text-[11px] text-[#9C96A0]">
              estimated
            </p>
          </>
        ) : (
          <div>
            <p
              className="
                text-[13px]
                font-semibold
                text-[#7442AD]
              "
            >
              Select
            </p>

            <p
              className="
                mt-0.5
                whitespace-nowrap
                text-[10px]
                text-[#AAA4AE]
              "
            >
              to continue
            </p>
          </div>
        )}
      </div>
    </motion.button>
  );
}


// import {
//   Check,
//   Clock3,
//   Users,
// } from "lucide-react";
// import { motion } from "framer-motion";

// import type {
//   RideOption,
// } from "../../../types/passengerRide";

// interface RideOptionCardProps {
//   option: RideOption;
//   selected: boolean;
//   onSelect: () => void;
// }

// export default function RideOptionCard({
//   option,
//   selected,
//   onSelect,
// }: RideOptionCardProps) {
//   return (
//     <motion.button
//       type="button"
//       layout
//       whileTap={{
//         scale: 0.985,
//       }}
//       onClick={onSelect}
//       className={`
//         relative flex w-full items-center
//         gap-4 rounded-[18px] border
//         p-4 text-left transition-colors
//         ${
//           selected
//             ? `
//               border-[#7442AD]
//               bg-[#FBF8FE]
//               shadow-[0_7px_25px_rgba(116,66,173,0.10)]
//             `
//             : `
//               border-[#ECE8EF]
//               bg-white
//             `
//         }
//       `}
//     >
//       <div
//         className="
//           flex h-[64px] w-[82px]
//           shrink-0 items-center justify-center
//           rounded-[14px] bg-[#F4F1F6]
//         "
//       >
//         {option.image ? (
//           <img
//             src={option.image}
//             alt={option.name}
//             className="h-[54px] w-[76px] object-contain"
//           />
//         ) : (
//           <span className="text-[14px] font-bold text-[#7442AD]">
//             {option.name}
//           </span>
//         )}
//       </div>

//       <div className="flex-1 min-w-0">
//         <div className="flex items-center gap-2">
//           <h3 className="text-[17px] font-semibold text-[#302B34]">
//             {option.name}
//           </h3>

//           {selected && (
//             <motion.span
//               initial={{
//                 scale: 0,
//               }}
//               animate={{
//                 scale: 1,
//               }}
//               className="
//                 flex h-5 w-5 items-center
//                 justify-center rounded-full
//                 bg-[#7442AD] text-white
//               "
//             >
//               <Check
//                 size={12}
//                 strokeWidth={3}
//               />
//             </motion.span>
//           )}
//         </div>

//         <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#918B95]">
//           {option.eta && (
//             <span className="flex items-center gap-1">
//               <Clock3 size={13} />
//               {option.eta}
//             </span>
//           )}

//           {option.seats && (
//   <span className="flex items-center gap-1">
//     <Users size={13} />
//     {option.seats}
//   </span>
// )}
//         </div>

//         {option.description && (
//           <p className="mt-1.5 line-clamp-1 text-[12px] text-[#A29CA6]">
//             {option.description}
//           </p>
//         )}
//       </div>

//       <div className="text-right shrink-0">
//         <p className="text-[17px] font-bold text-[#302B34]">
//           ₦{option.price.toLocaleString()}
//         </p>
//       </div>
//     </motion.button>
//   );
// }