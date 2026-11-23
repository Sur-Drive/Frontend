import { Minus } from "lucide-react";
import { TONE_STYLES } from "@/types/overview";

interface InitialsAvatarProps {
  initials: string;
  tone: "brand" | "success" | "warning" | "info";
  // Renders the "no driver" tile instead of initials.
  empty?: boolean;
  // md = 36px rounded-xl (default, table rows), xl = 64px rounded-2xl (details banners).
  size?: "md" | "xl";
}

const SIZE_STYLES: Record<"md" | "xl", string> = {
  md: "size-9 rounded-xl text-xs",
  xl: "size-16 rounded-2xl text-xl",
};

export function InitialsAvatar({
  initials,
  tone,
  empty = false,
  size = "md",
}: InitialsAvatarProps) {
  const t = TONE_STYLES[tone];

  return (
    <span
      aria-hidden={empty ? "true" : undefined}
      className={`flex shrink-0 items-center justify-center font-bold text-white ${SIZE_STYLES[size]} ${
        empty ? t.soft : t.avatar
      }`}
    >
      {empty ? <Minus className="size-4 text-info" aria-hidden="true" /> : initials}
    </span>
  );
}
