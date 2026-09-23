import {
  motion,
} from "framer-motion";

type Props = {
  status?:
    | "completed"
    | "cancelled";

  className?: string;
};

export default function TripRoutePreview({
  status,
  className = "",
}: Props) {
  return (
    <div
      className={`
        relative
        h-[150px]
        w-full
        overflow-hidden
        rounded-[18px]
        bg-[#F3F2F4]
        ${className}
      `}
    >
      {/* MAP GRID */}

      <div
        className="
          absolute
          inset-0
          opacity-80
        "
        style={{
          backgroundImage: `
            linear-gradient(
              to right,
              rgba(255,255,255,.92) 2px,
              transparent 2px
            ),
            linear-gradient(
              to bottom,
              rgba(255,255,255,.92) 2px,
              transparent 2px
            )
          `,
          backgroundSize:
            "38px 38px",
        }}
      />

      {/* SECONDARY STREETS */}

      <div className="absolute left-[20%] top-0 h-full w-[5px] rotate-[8deg] bg-white/80" />

      <div className="absolute right-[22%] top-0 h-full w-[5px] -rotate-[7deg] bg-white/80" />

      <div className="absolute left-0 top-[34%] h-[5px] w-full -rotate-[4deg] bg-white/80" />

      <div className="absolute left-0 top-[69%] h-[5px] w-full rotate-[3deg] bg-white/80" />

      {/* ROUTE */}

      <svg
        viewBox="0 0 300 150"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <motion.path
          d="
            M 78 103
            L 125 103
            Q 143 103 143 88
            L 143 62
            Q 143 49 157 49
            L 216 49
          "
          fill="none"
          stroke="#7442AD"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{
            pathLength: 0,
          }}
          animate={{
            pathLength: 1,
          }}
          transition={{
            duration: 1,
            ease: "easeInOut",
          }}
        />

        <circle
          cx="78"
          cy="103"
          r="5"
          fill="#F4B72D"
          stroke="white"
          strokeWidth="3"
        />

        <circle
          cx="216"
          cy="49"
          r="5"
          fill="#7442AD"
          stroke="white"
          strokeWidth="3"
        />
      </svg>

      {status && (
        <div className="absolute left-3 top-3">
          <span
            className={`
              inline-flex
              rounded-full
              px-4
              py-2
              text-[13px]
              font-semibold
              text-white

              ${
                status ===
                "completed"
                  ? "bg-[#3FC76A]"
                  : "bg-[#FF624B]"
              }
            `}
          >
            {status ===
            "completed"
              ? "Completed"
              : "Cancelled"}
          </span>
        </div>
      )}
    </div>
  );
}