import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type Props = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showMore?: boolean;
};

export default function RideMapHeader({
  title,
  subtitle,
  onBack,
  showMore = false,
}: Props) {
  const navigate = useNavigate();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[900] px-4 pt-[max(16px,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full items-start justify-between">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#302B34] shadow-[0_5px_22px_rgba(30,20,38,0.15)]"
        >
          <ArrowLeft size={21} />
        </motion.button>

        {(title || subtitle) && (
          <div className="pointer-events-auto mx-3 max-w-[70%] rounded-[16px] bg-white/95 px-5 py-3 text-center shadow-[0_5px_22px_rgba(30,20,38,0.12)] backdrop-blur-xl">
            {title && (
              <h1 className="text-[16px] font-semibold text-[#302B34]">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="mt-0.5 text-[12px] text-[#8F8994]">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {showMore ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#302B34] shadow-[0_5px_22px_rgba(30,20,38,0.15)]"
          >
            <MoreHorizontal size={21} />
          </motion.button>
        ) : (
          <div className="h-11 w-11" />
        )}
      </div>
    </header>
  );
}