import {
  AlertTriangle,
  ChevronRight,
  MessageSquareWarning,
  Share2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

import RideModalSheet from "./RideModalSheet";

interface SafetySheetProps {
  open: boolean;
  onClose: () => void;
  onEmergency: () => void;
  onShareTrip: () => void;
  onReportIssue: () => void;
}

export default function SafetySheet({
  open,
  onClose,
  onEmergency,
  onShareTrip,
  onReportIssue,
}: SafetySheetProps) {
  const items = [
    {
      icon: ShieldAlert,
      title: "Emergency SOS",
      description:
        "Get emergency help and notify your safety contacts.",
      action: onEmergency,
      danger: true,
    },
    {
      icon: Share2,
      title: "Share Trip",
      description:
        "Share your live ride status with someone you trust.",
      action: onShareTrip,
    },
    {
      icon: MessageSquareWarning,
      title: "Report Issue",
      description:
        "Tell us about a safety or ride concern.",
      action: onReportIssue,
    },
  ];

  return (
    <RideModalSheet
      open={open}
      onClose={onClose}
      title="Safety options"
      description="We're here throughout your trip."
    >
      <div
        className="
          mb-5 flex gap-3
          rounded-[16px]
          bg-[#F0F7F2]
          p-4
        "
      >
        <ShieldCheck
          size={21}
          className="mt-0.5 shrink-0 text-[#3C8A60]"
        />

        <div>
          <p className="text-[14px] font-semibold text-[#397052]">
            Your trip is active
          </p>

          <p className="mt-1 text-[12px] leading-5 text-[#64806E]">
            Your ride details and route can be used to support safety assistance.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map(
          ({
            icon: Icon,
            title,
            description,
            action,
            danger,
          }) => (
            <motion.button
              key={title}
              type="button"
              whileTap={{
                scale: 0.985,
              }}
              onClick={action}
              className="
                flex w-full
                items-center gap-3
                rounded-[16px]
                border border-[#EEEAF1]
                bg-white p-4
                text-left
              "
            >
              <span
                className={`
                  flex h-11 w-11
                  shrink-0 items-center
                  justify-center
                  rounded-full
                  ${
                    danger
                      ? `
                        bg-[#FFEAE8]
                        text-[#E2534F]
                      `
                      : `
                        bg-[#F0E8F8]
                        text-[#7442AD]
                      `
                  }
                `}
              >
                <Icon size={20} />
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`
                    text-[15px] font-semibold
                    ${
                      danger
                        ? "text-[#D84D49]"
                        : "text-[#302B34]"
                    }
                  `}
                >
                  {title}
                </p>

                <p className="mt-1 text-[12px] leading-5 text-[#96909A]">
                  {description}
                </p>
              </div>

              <ChevronRight
                size={19}
                className="shrink-0 text-[#AAA4AD]"
              />
            </motion.button>
          ),
        )}
      </div>

      <div
        className="
          mt-5 flex gap-3
          rounded-[15px]
          bg-[#FFF6E7]
          p-4
        "
      >
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-[#B97A19]"
        />

        <p className="text-[12px] leading-5 text-[#765E37]">
          Use emergency assistance when you or someone else may be in immediate danger.
        </p>
      </div>
    </RideModalSheet>
  );
}