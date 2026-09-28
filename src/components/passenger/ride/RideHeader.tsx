import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface RideHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  transparent?: boolean;
}

export default function RideHeader({
  title,
  subtitle,
  onBack,
  transparent = false,
}: RideHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={`
        sticky top-0 z-[800]
        flex min-h-[72px]
        items-center gap-3
        px-4 sm:px-5
        ${
          transparent
            ? "bg-transparent"
            : `
              border-b border-black/[0.04]
              bg-white/95 backdrop-blur-xl
            `
        }
      `}
    >
      <motion.button
        type="button"
        whileHover={{
          x: -2,
        }}
        whileTap={{
          scale: 0.9,
        }}
        onClick={() =>
          onBack
            ? onBack()
            : navigate(-1)
        }
        className="
          flex h-11 w-11 shrink-0
          items-center justify-center
          rounded-full
          text-[#2D2931]
          transition-colors
          hover:bg-[#F5F2F8]
        "
      >
        <ArrowLeft
          size={22}
          strokeWidth={2}
        />
      </motion.button>

      <div className="min-w-0">
        <h1
          className="
            truncate text-[20px]
            font-semibold tracking-[-0.02em]
            text-[#302B34]
          "
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="
              mt-0.5 truncate
              text-[13px]
              text-[#96909A]
            "
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}