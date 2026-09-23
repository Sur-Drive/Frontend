import {
  AlertTriangle,
  MapPin,
  MessageSquareWarning,
  PhoneCall,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import RideHeader from "../../../components/passenger/ride/RideHeader";

export default function RideSafety() {
  const navigate = useNavigate();

 const options = [
  {
    icon: PhoneCall,
    title: "Emergency SOS",
    description:
      "Get emergency help and alert your safety contacts.",
    danger: true,
    onClick: () =>
      navigate(
        "/passenger/ride/emergency",
      ),
  },

  {
    icon: Share2,
    title: "Share Trip",
    description:
      "Share your live trip status with someone you trust.",
    onClick: () => {
      // Open ShareRideSheet
    },
  },

  {
    icon: MessageSquareWarning,
    title: "Report Issue",
    description:
      "Report a safety or ride-related concern.",
    onClick: () => {
      // Open report sheet
    },
  },

  {
    icon: MapPin,
    title: "Live Location",
    description:
      "Your current trip location is being tracked.",
    onClick: undefined,
  },
];

  return (
    <div className="min-h-[100dvh] bg-[#F8F8FA]">
      <RideHeader
        title="Your Safety Matters"
        onBack={() => navigate("/passenger/ride/trip")}
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] bg-[#F0E8F8] p-5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#7442AD]">
            <ShieldCheck size={24} />
          </span>

          <h2 className="mt-4 text-[21px] font-semibold text-[#302B34]">
            We're here throughout your trip
          </h2>

          <p className="mt-2 text-[14px] leading-6 text-[#776E7D]">
            Use these tools if you need help or want to share your ride.
          </p>
        </motion.div>

        <div className="mt-5 space-y-3">
          {options.map(
            ({
              icon: Icon,
              title,
              description,
              danger,
              onClick,
            }) => (
              <motion.button
                key={title}
                type="button"
                onClick={onClick}
                whileTap={{ scale: 0.985 }}
                className="flex w-full items-center gap-4 rounded-[17px] bg-white p-4 text-left shadow-[0_5px_25px_rgba(30,20,38,0.04)]"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    danger
                      ? "bg-[#FFE9E7] text-[#E8534F]"
                      : "bg-[#F0E8F8] text-[#7442AD]"
                  }`}
                >
                  <Icon size={21} />
                </span>

                <span>
                  <span className="block text-[16px] font-semibold text-[#302B34]">
                    {title}
                  </span>

                  <span className="mt-1 block text-[13px] leading-5 text-[#96909A]">
                    {description}
                  </span>
                </span>
              </motion.button>
            ),
          )}
        </div>

        <div className="mt-6 flex gap-3 rounded-[16px] bg-[#FFF5E5] p-4">
          <AlertTriangle
            size={20}
            className="shrink-0 text-[#C78620]"
          />

          <p className="text-[13px] leading-5 text-[#715D3A]">
            Use emergency services only when you or someone else is in immediate danger.
          </p>
        </div>
      </main>
    </div>
  );
}