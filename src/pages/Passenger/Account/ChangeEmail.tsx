import {
  Mail,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import AccountHeader from "../../../components/passenger/account/AccountHeader";

import {
  usePassengerProfile,
} from "../../../context/PassengerProfileContext";

export default function ChangeEmail() {
  const navigate =
    useNavigate();

  const { profile } =
    usePassengerProfile();

  const [email, setEmail] =
    useState("");

  const valid =
    /\S+@\S+\.\S+/.test(email);

  const sendCode = () => {
    if (!valid) {
      return;
    }

    navigate(
      "/passenger/account/profile/verify",
      {
        state: {
          type: "email",
          value: email,
        },
      },
    );
  };

  return (
    <div className="min-h-[100dvh] bg-white">
      <AccountHeader />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-10 sm:px-7">
        <h1 className="text-[22px] font-semibold text-[#302B34]">
          Change Email
        </h1>

        <p className="mt-2 max-w-[540px] text-[14px] leading-6 text-[#99939D]">
          Your current email is{" "}
          <span className="font-medium text-[#625C66]">
            {profile.email}
          </span>
          . To verify your new address,
          we'll send you a 4-digit code.
          Please enter the code to complete
          verification.
        </p>

        <div className="mt-6 flex h-[54px] items-center gap-3 rounded-[12px] bg-[#F4F3F5] px-4">
          <Mail
            size={18}
            className="text-[#7442AD]"
          />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            placeholder="Enter Your New Email"
            className="w-full bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#B7B1BA]"
          />
        </div>

        <motion.button
          type="button"
          disabled={!valid}
          whileTap={
            valid
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={sendCode}
          className="mt-5 h-[56px] w-full rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send Code
        </motion.button>
      </main>
    </div>
  );
}