import Image from "next/image";
import {
  LOGO_ON_DARK,
  LOGO_ON_LIGHT,
  LOGO_ON_DARK_DIMENSIONS,
  LOGO_ON_LIGHT_DIMENSIONS,
} from "@/lib/brand";

// Central lockup styles: icon height + matching wordmark scale/gap.
// Tweak here to resize the whole lockup everywhere.
const LOGO_STYLES = {
  lg: { icon: "h-12", wordmark: "text-3xl", gap: "gap-3" }, // left auth panel (lg+)
  sm: { icon: "h-8", wordmark: "text-xl", gap: "gap-2" }, // mobile header (~32px)
} as const;

interface BrandLogoProps {
  variant: "onDark" | "onLight";
  size?: keyof typeof LOGO_STYLES;
  priority?: boolean;
  // Render only the eye icon (used by the collapsed sidebar).
  iconOnly?: boolean;
}

export function BrandLogo({
  variant,
  size = "lg",
  priority,
  iconOnly,
}: BrandLogoProps) {
  const onDark = variant === "onDark";
  const src = onDark ? LOGO_ON_DARK : LOGO_ON_LIGHT;
  const { width, height } = onDark
    ? LOGO_ON_DARK_DIMENSIONS
    : LOGO_ON_LIGHT_DIMENSIONS;
  const s = LOGO_STYLES[size];

  const icon = (
    // Decorative eye icon; the wordmark is the accessible text when shown.
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      className={`w-auto ${s.icon}`}
      priority={priority}
    />
  );

  if (iconOnly) return icon;

  return (
    <span className={`flex w-fit items-center self-start ${s.gap}`}>
      {icon}
      <span
        className={`${s.wordmark} font-extrabold leading-none tracking-tight ${
          onDark ? "text-white" : "text-ink"
        }`}
      >
        SUR-DRIVE
        <span className="relative top-[-1em] ml-[0.3em] text-[0.4em] font-bold text-accent">
          HT
        </span>
      </span>
    </span>
  );
}

