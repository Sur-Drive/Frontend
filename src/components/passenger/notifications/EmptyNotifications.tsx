import {
  MessageSquareText,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

export default function EmptyNotifications() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        flex
        min-h-[calc(100dvh-190px)]
        flex-col
        items-center
        justify-center
        px-8
        pb-20
        text-center
      "
    >
      <div className="relative">
        <MessageSquareText
          size={52}
          strokeWidth={1.6}
          className="text-[#968AA1]"
        />

        <span
          className="
            absolute
            -right-1
            -top-1
            flex
            h-5
            w-5
            items-center
            justify-center
            rounded-full
            border-2
            border-[#968AA1]
            bg-white
            text-[13px]
            font-bold
            text-[#968AA1]
          "
        >
          !
        </span>
      </div>

      <h2
        className="
          mt-5
          text-[18px]
          font-semibold
          text-[#302B34]
        "
      >
        No Notifications
      </h2>

      <p
        className="
          mt-2
          max-w-[290px]
          text-[14px]
          leading-6
          text-[#756C7B]
        "
      >
        We'll let you know when
        there will be something to
        update you.
      </p>
    </motion.div>
  );
}