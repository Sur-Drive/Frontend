
import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Siren,
} from "lucide-react";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected"
  | "unknown";

export type HomePromotion = {
  id: string;
  title: string;
  description: string;
  eligible: boolean;
  active: boolean;
  onClick: () => void;
};

type HomeStatusCarouselProps = {
  emergencyContactsCount: number;
  verificationStatus?: VerificationStatus;
  promotions?: HomePromotion[];
  onVerifyIdentity: () => void;
  onEmergencyContact: () => void;
  onSafetySettings: () => void;
};

type Slide = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  bg: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
};

export default function HomeStatusCarousel({
  emergencyContactsCount,
  verificationStatus = "unknown",
  promotions = [],
  onVerifyIdentity,
  onEmergencyContact,
  onSafetySettings,
}: HomeStatusCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const slides: Slide[] = [];

  if (
    verificationStatus === "unverified" ||
    verificationStatus === "rejected"
  ) {
    slides.push({
      id: "verification",
      title: "Verify your identity",
      description:
        verificationStatus === "rejected"
          ? "Your verification needs attention"
          : "This helps keep rides safe",
      icon: ShieldCheck,
      bg: "bg-[#E4F8EC]",
      iconBg: "bg-[#C8F1D8]",
      iconColor: "text-[#27B46A]",
      onClick: onVerifyIdentity,
    });
  }

  if (verificationStatus === "pending") {
    slides.push({
      id: "verification-pending",
      title: "Verification in progress",
      description:
        "We're reviewing your submitted details",
      icon: CheckCircle2,
      bg: "bg-[#E4F8EC]",
      iconBg: "bg-[#C8F1D8]",
      iconColor: "text-[#27B46A]",
      onClick: onVerifyIdentity,
    });
  }

  if (emergencyContactsCount === 0) {
    slides.push({
      id: "emergency",
      title: "Emergency Contact",
      description:
        "Set an emergency contact for your safety",
      icon: Siren,
      bg: "bg-[#FCE9E4]",
      iconBg: "bg-[#FFD9CF]",
      iconColor: "text-[#F76D54]",
      onClick: onEmergencyContact,
    });
  }

  for (const promotion of promotions) {
    if (!promotion.active || !promotion.eligible) continue;

    slides.push({
      id: `promotion-${promotion.id}`,
      title: promotion.title,
      description: promotion.description,
      icon: BadgePercent,
      bg: "bg-[#F0E7FA]",
      iconBg: "bg-[#E2D2F5]",
      iconColor: "text-[#7442AD]",
      onClick: promotion.onClick,
    });
  }

  // A useful safety slide when all required setup is complete.
  // This isn't a claim about a promotion or verification.
  if (slides.length === 0 && emergencyContactsCount > 0) {
    slides.push({
      id: "safety-ready",
      title: "Your safety settings",
      description:
        "View or update your emergency contacts",
      icon: ShieldCheck,
      bg: "bg-[#E4F8EC]",
      iconBg: "bg-[#C8F1D8]",
      iconColor: "text-[#27B46A]",
      onClick: onSafetySettings,
    });
  }

  const currentIndex = Math.min(
    activeIndex,
    Math.max(slides.length - 1, 0),
  );

  const current = slides[currentIndex];

  useEffect(() => {
    if (slides.length <= 1 || paused || reduceMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (index) => (index + 1) % slides.length,
      );
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides.length, paused, reduceMotion]);

  if (!current) return null;

  const Icon = current.icon;

  return (
    <section
      aria-label="Account updates"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget,
          )
        ) {
          setPaused(false);
        }
      }}
      className="w-full"
    >
      <div className="overflow-hidden rounded-xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{
              opacity: 0,
              x: reduceMotion ? 0 : 24,
            }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: reduceMotion ? 0 : -24,
            }}
            transition={{ duration: 0.25 }}
            drag={
              slides.length > 1 && !reduceMotion
                ? "x"
                : false
            }
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -45) {
                setActiveIndex(
                  (currentIndex + 1) % slides.length,
                );
              } else if (info.offset.x > 45) {
                setActiveIndex(
                  (currentIndex - 1 + slides.length) %
                    slides.length,
                );
              }
            }}
            className="touch-pan-y"
          >
            <button
              type="button"
              onClick={current.onClick}
              className={`flex min-h-[66px] w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left ${current.bg}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${current.iconBg} ${current.iconColor}`}
              >
                <Icon size={19} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-[#332B37]">
                  {current.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-[#746D78]">
                  {current.description}
                </span>
              </span>

              <ChevronRight
                size={16}
                className="shrink-0 text-[#8E7C9D]"
              />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show ${slide.title}`}
              aria-current={
                index === currentIndex ? "true" : undefined
              }
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 bg-[#7442AD]"
                  : "w-1.5 bg-[#DDD5E8]"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
