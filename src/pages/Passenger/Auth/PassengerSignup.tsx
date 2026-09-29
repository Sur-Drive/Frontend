import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  Mail,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import PassengerAuthShell from "../../../components/passenger/auth/PassengerAuthShell";

type SignupMode = "phone" | "email";

const spring = {
  type: "spring" as const,
  stiffness: 340,
  damping: 28,
};

function FacebookIcon() {
  return (
    <div
      className="
        flex h-[18px] w-[18px]
        items-center justify-center
        rounded-full bg-[#1877F2]
        text-[14px] font-bold leading-none text-white
      "
    >
      f
    </div>
  );
}

export default function PassengerSignup() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<SignupMode>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const phoneDigits = phone.replace(/\D/g, "");

  const isPhoneValid =
    phoneDigits.length === 10 || phoneDigits.length === 11;

  const isEmailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const isValid = mode === "phone" ? isPhoneValid : isEmailValid;

  const switchMode = (nextMode: SignupMode) => {
    setMode(nextMode);
  };

  const handlePhoneChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const digits = event.target.value
      .replace(/\D/g, "")
      .slice(0, 11);

    setPhone(digits);
  };

  const handleContinue = () => {
    if (!isValid) return;

    const identifier =
      mode === "phone"
        ? `+234${phoneDigits}`
        : email.trim().toLowerCase();

    /*
      NEXT STEP:
      connect this to useSendOtp() once passenger backend role
      has been confirmed.

      For UI flow testing:
    */

    navigate("/passenger/otp", {
      state: {
        identifier,
        identifierType: mode,
      },
    });
  };

  return (
    <PassengerAuthShell>
  <div className="flex min-h-[100dvh] w-full flex-col">
    <div
      className="
        mx-auto flex w-full max-w-[480px] flex-1
        flex-col px-5 pb-6 pt-12
        sm:px-8
        lg:max-w-[520px]
        lg:justify-center
        lg:py-14
      "
    >
        {/* Social login */}

        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          <SocialButton
            icon={<GoogleMark />}
            label="Continue with Google"
            onClick={() => {}}
          />

          <SocialButton
            icon={<Apple size={19} fill="currentColor" />}
            label="Continue with Apple"
            onClick={() => {}}
          />

          <SocialButton
  icon={<FacebookIcon />}
  label="Continue with Facebook"
  onClick={() => {}}
/>
        </motion.div>

        {/* OR */}

        <motion.div
          className="my-5 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[16px] font-medium uppercase text-gray-400">
            Or
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </motion.div>

        {/* Tabs */}

        <div className="relative grid grid-cols-2 border-b border-gray-100">
          <AuthTab
            active={mode === "phone"}
            onClick={() => switchMode("phone")}
          >
            Phone Number
          </AuthTab>

          <AuthTab
            active={mode === "email"}
            onClick={() => switchMode("email")}
          >
            Email Address
          </AuthTab>

          <motion.div
            className="absolute bottom-[-1px] h-[2px] w-1/2 bg-[#7442AD]"
            animate={{
              x: mode === "phone" ? "0%" : "100%",
            }}
            transition={spring}
          />
        </div>

        {/* Dynamic form */}

        <AnimatePresence mode="wait">
          {mode === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              transition={{ duration: 0.22 }}
              className="pt-5"
            >
              <h1 className="text-[18px] font-bold tracking-[-0.02em] text-[#19151E]">
                Enter your phone number
              </h1>

              <div className="mt-4 flex h-[52px] overflow-hidden rounded-[10px] bg-[#F6F6F7]">
                <div className="flex items-center gap-2 border-r border-white px-3">
                  <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full">
                    🇳🇬
                  </span>

                  <span className="text-[12px] font-medium text-gray-700">
                    +234
                  </span>
                </div>

                <div className="relative flex flex-1 items-center">
                  <Phone
                    size={15}
                    className="ml-3 text-[#7442AD]/60"
                  />

                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="803 660 0027"
                    className="
                      h-full min-w-0 flex-1 bg-transparent
                      px-3 text-base text-[#19151E]
                      outline-none
                      placeholder:text-gray-300
                    "
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22 }}
              className="pt-5"
            >
              <h1 className="text-[18px] font-bold tracking-[-0.02em] text-[#19151E]">
                Enter your email address
              </h1>

              <div className="mt-4 flex h-[52px] items-center rounded-[10px] bg-[#F6F6F7] px-4">
                <Mail
                  size={16}
                  className="mr-3 text-[#7442AD]"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email Address"
                  className="
                    h-full min-w-0 flex-1 bg-transparent
                    text-base text-[#19151E]
                    outline-none
                    placeholder:text-gray-300
                  "
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          disabled={!isValid}
          onClick={handleContinue}
          whileTap={isValid ? { scale: 0.975 } : undefined}
          whileHover={isValid ? { y: -1 } : undefined}
          className={`
            mt-4 flex h-[52px] w-full
            items-center justify-center rounded-[9px]
            text-[14px] font-semibold text-white
            shadow-[0_7px_18px_rgba(116,66,173,0.20)]
            transition-colors
            ${
              isValid
                ? "bg-[#7442AD]"
                : "cursor-not-allowed bg-[#BDA9D5]"
            }
          `}
        >
          Continue
        </motion.button>

        <div className="flex-1" />

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="
            mx-auto max-w-[330px] pb-1
            text-center text-[12px] leading-[1.55] mt-3
            text-gray-400
          "
        >
          By continuing you agree to our{" "}
          <button className="font-semibold text-[#7442AD]">
            Terms & Conditions
          </button>
          , acknowledge our{" "}
          <button className="font-semibold text-[#7442AD]">
            privacy policy
          </button>
          , and confirm that you're over 18. We may send promotions
          related to our services — you can unsubscribe anytime in
          notification setting under your profile.
        </motion.p>
        </div>
      </div>
    </PassengerAuthShell>
  );
}

function AuthTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative h-10 text-[11px] font-medium
        transition-colors
        ${
          active
            ? "text-[#7442AD]"
            : "text-gray-400"
        }
      `}
    >
      {children}
    </button>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      variants={{
        hidden: {
          opacity: 0,
          y: 15,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      whileTap={{ scale: 0.98 }}
      whileHover={{
        y: -1,
        boxShadow: "0 8px 24px rgba(30, 20, 40, 0.06)",
      }}
      type="button"
      onClick={onClick}
      className="
        relative flex h-[48px] w-full
        items-center justify-center
        rounded-[9px] border border-gray-200
        bg-white text-[11px] font-medium
        text-[#19151E]
      "
    >
      <span className="absolute left-4 flex items-center">
        {icon}
      </span>

      {label}
    </motion.button>
  );
}

function GoogleMark() {
  return (
    <span className="text-[17px] font-black text-[#4285F4]">
      G
    </span>
  );
}