import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  Mail,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import LegalModal, {
  type LegalModalType,
} from "../../../components/passenger/auth/LegalModal";

import PassengerAuthShell from "../../../components/passenger/auth/PassengerAuthShell";
import { usePassengerGoogleAuth, useSendPassengerOtp } from "../../../hooks/passenger/usePassengerAuth";
import { passengerSession } from "../../../api/passenger/passengerSession";

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

function normalizeNigeriaPhone(
  value: string,
) {
  const digits =
    value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("234")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+234${digits.slice(1)}`;
  }

  return `+234${digits}`;
}

export default function PassengerSignup() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<SignupMode>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null);
  const [hasConsented, setHasConsented] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  
  const isPhoneValid =
    phoneDigits.length === 10 || phoneDigits.length === 11;

  const isEmailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const isValid = mode === "phone" ? isPhoneValid : isEmailValid;

const [error, setError] =
  useState("");

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

const {
  mutate: sendOtp,
  isPending: isSendingOtp,
} = useSendPassengerOtp();

const {
  mutate: googleAuth,
  isPending: isGoogleLoading,
} = usePassengerGoogleAuth();

const handleContinue = () => {
  if (isSendingOtp) {
    return;
  }

  if (!hasConsented) {
  setError("Please accept the Terms & Conditions to continue.");
  return;
}

  if (!isValid) {
    setError(
      mode === "phone"
        ? "Enter a valid phone number."
        : "Enter a valid email address.",
    );

    return;
  }

  const identifier =
    mode === "phone"
      ? normalizeNigeriaPhone(
          phone,
        )
      : email
          .trim()
          .toLowerCase();

  setError("");

  sendOtp(
    {
      identifier,
    },
    {
      onSuccess: () => {
        navigate(
          "/passenger/otp",
          {
            state: {
              identifier,
              identifierType:
                mode,
            },
          },
        );
      },

      onError: (
        error,
      ) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to send OTP. Please try again.",
        );
        setError(
          error instanceof Error
            ? error.message
            : "Unable to send OTP. Please try again.",
        );
      },
    },
  );
};

const handleGoogleCredential = (
  credentialResponse: CredentialResponse,
) => {
  if (!hasConsented) {
    toast.error(
      "Please accept the Terms & Conditions before continuing.",
    );
    return;
  }

  const idToken = credentialResponse.credential;

  if (!idToken) {
    toast.error(
      "Google authentication was unsuccessful. Please try again.",
    );
    return;
  }

  setError("");

  googleAuth(idToken, {
    onSuccess: (response) => {
      const { user, tokens, requiresPersonalInfo } = response;

      if (requiresPersonalInfo || !user.hasCompletedOnboarding) {
        // This route must support the onboarding credentials
        // returned for a new Google user.
        toast.success(
          "Google authentication successful. Complete your profile.",
        );

        navigate("/passenger/complete-profile", {
          replace: true,
        });

        return;
      }

      if (!tokens?.accessToken) {
        toast.error(
          "Google login succeeded, but no access token was returned.",
        );
        return;
      }

      toast.success("Welcome back to SUR-DRIVE!");

      navigate("/passenger/home", {
        replace: true,
      });
    },

    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to continue with Google.";

      setError(message);
      toast.error(message);
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
          <div className="relative">
          <SocialButton
            icon={<FcGoogle size={22} />}
            label={
              isGoogleLoading
                ? "Connecting..."
                : "Continue with Google"
            }
            onClick={() => {
              if (!hasConsented) {
                toast.error(
                  "Please accept the Terms & Conditions first.",
                );
              }
            }}
          />

          {hasConsented && !isGoogleLoading && (
            <div
              className="
                absolute
                inset-0
                z-10
                overflow-hidden
                opacity-[0.01]
              "
            >
              <GoogleLogin
                onSuccess={
                  handleGoogleCredential
                }
                onError={() => {
                  toast.error(
                    "Google sign-in was unsuccessful. Please try again.",
                  );
                }}
                useOneTap={false}
                width="480"
              />
            </div>
          )}
        </div>
        
          {/* <SocialButton
            icon={<Apple size={19} fill="currentColor" />}
            label="Continue with Apple"
            onClick={() => {}}
          /> */}

          {/* <SocialButton
  icon={<FacebookIcon />}
  label="Continue with Facebook"
  onClick={() => {}}
/> */}
        </motion.div>

        {/* OR */}

        <motion.div
          className="flex items-center gap-3 my-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[16px] font-medium uppercase text-gray-400">
            Or
          </span>
          <div className="flex-1 h-px bg-gray-200" />
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
                <div className="flex items-center gap-2 px-3 border-r border-white">
                  <span className="flex items-center justify-center w-6 h-6 overflow-hidden rounded-full">
                    🇳🇬
                  </span>

                  <span className="text-[14px] font-medium text-gray-700">
                    +234
                  </span>
                </div>

                <div className="relative flex items-center flex-1">
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
  onClick={handleContinue}
  disabled={
    !isValid || !hasConsented || 
    isSendingOtp
  }
  whileTap={
    isValid && hasConsented && !isSendingOtp
      ? { scale: 0.98 }
      : undefined
  }
  whileHover={
    isValid && hasConsented && !isSendingOtp
      ? { y: -1 }
      : undefined
  }
  className={`
    mt-4
    flex
    h-[54px]
    w-full
    items-center
    justify-center
    rounded-[8px]
    text-[16px]
    font-semibold
    text-white
    shadow-[0_8px_22px_rgba(116,66,173,0.22)]
    transition

    ${
      isValid && hasConsented &&
      !isSendingOtp
        ? "bg-[#7442AD]"
        : "cursor-not-allowed bg-[#BDA9D5]"
    }
  `}
>
  {isSendingOtp
    ? "Sending OTP..."
    : "Continue"}
</motion.button>

<AnimatePresence>
  {error && (
    <motion.p
      initial={{
        opacity: 0,
        y: -4,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -4,
      }}
      className="
        mt-3
        text-center
        text-[14px]
        font-medium
        text-red-500
      "
    >
      {error}
    </motion.p>
  )}
</AnimatePresence>

        <div className="flex-1" />

        <motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.45 }}
  className="mx-auto mt-4 flex w-full max-w-[380px] items-start gap-3 pb-2"
>
  <input
    id="passenger-consent"
    type="checkbox"
    checked={hasConsented}
    onChange={(event) => {
      setHasConsented(event.target.checked);
      setError("");
    }}
    className="
      mt-1 h-[19px] w-[19px] shrink-0
      cursor-pointer rounded-[5px]
      border-2 border-[#BDA9D5]
      accent-[#7442AD]
      focus:ring-2 focus:ring-[#7442AD]/30
    "
  />

  <div className="flex-1 text-left text-[13px] leading-[1.65] text-gray-500">
    <label htmlFor="passenger-consent" className="cursor-pointer">
      By continuing you agree to our{" "}
    </label>

    <button
      type="button"
      onClick={() => setLegalModal("terms")}
      className="font-semibold text-[#7442AD] underline-offset-2 hover:underline"
    >
      Terms & Conditions
    </button>

    <span>, acknowledge our </span>

    <button
      type="button"
      onClick={() => setLegalModal("privacy")}
      className="font-semibold text-[#7442AD] underline-offset-2 hover:underline"
    >
      Privacy Policy
    </button>

    <label htmlFor="passenger-consent" className="cursor-pointer">
      , and confirm that you're over 18. We may send promotions
      related to our services — you can unsubscribe anytime in
      notification settings under your profile.
    </label>
  </div>
</motion.div>

        </div>
      </div>

      <LegalModal
  open={
    legalModal !== null
  }
  type={
    legalModal ??
    "terms"
  }
  onClose={() =>
    setLegalModal(null)
  }
/>
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
        relative h-10 text-[14px] font-medium
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
        bg-white text-[14px] font-medium
        text-[#19151E]
      "
    >
      <span className="absolute flex items-center left-4">
        {icon}
      </span>

      {label}
    </motion.button>
  );
}

