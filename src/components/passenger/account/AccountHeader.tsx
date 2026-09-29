import {
  ArrowLeft,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useNavigate,
} from "react-router-dom";

interface Props {
  title?: string;
  onBack?: () => void;
}

export default function AccountHeader({
  title,
  onBack,
}: Props) {
  const navigate =
    useNavigate();

  return (
    <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[680px] items-center gap-3 px-5 sm:px-7">
        <motion.button
          type="button"
          whileTap={{
            scale: 0.9,
          }}
          onClick={
            onBack ??
            (() => navigate(-1))
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAF9FB] text-[#302B34]"
        >
          <ArrowLeft
            size={20}
          />
        </motion.button>

        {title && (
          <h1 className="text-[20px] font-semibold text-[#302B34]">
            {title}
          </h1>
        )}
      </div>
    </header>
  );
}