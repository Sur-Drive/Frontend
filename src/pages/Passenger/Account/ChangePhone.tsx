import {
  LoaderCircle,
  Phone,
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

import {
  toast,
} from "sonner";

import AccountHeader from "../../../components/passenger/account/AccountHeader";

import {
  usePassengerProfileQuery,
  useRequestPassengerPhoneChange,
} from "../../../hooks/passenger/usePassengerProfileApi";

import {
  getPassengerApiError,
} from "../../../api/passenger/getPassengerApiError";

/**
 * Converts Nigerian numbers to:
 *
 * +2348031234567
 *
 * Accepted:
 * 08031234567
 * 8031234567
 * 2348031234567
 * +2348031234567
 */
function normalizeNigerianPhone(
  value: string,
): string | null {
  let digits =
    value.replace(/\D/g, "");

  if (
    digits.startsWith("234")
  ) {
    digits =
      digits.slice(3);
  }

  if (
    digits.startsWith("0")
  ) {
    digits =
      digits.slice(1);
  }

  /*
   * Nigerian mobile number after
   * removing country code / leading 0
   * should contain 10 digits.
   */
  if (
    !/^[789]\d{9}$/.test(
      digits,
    )
  ) {
    return null;
  }

  return `+234${digits}`;
}

export default function ChangePhone() {
  const navigate =
    useNavigate();

  const profileQuery =
    usePassengerProfileQuery();

  const requestChange =
    useRequestPassengerPhoneChange();

  const [phone, setPhone] =
    useState("");

  const [error, setError] =
    useState("");

  const backendProfile =
    profileQuery.data;

  const currentPhone =
    backendProfile
      ?.phoneNumber
      ?.trim() ?? "";

  const normalizedPhone =
    normalizeNigerianPhone(
      phone,
    );

  const valid =
    normalizedPhone !== null;

  const sendCode =
    async () => {
      if (
        !normalizedPhone ||
        requestChange.isPending
      ) {
        if (!normalizedPhone) {
          const message =
            "Enter a valid Nigerian phone number, for example 08031234567.";

          setError(message);

          toast.error(message);
        }

        return;
      }

      setError("");

      try {
        await requestChange.mutateAsync(
          normalizedPhone,
        );

        toast.success(
          "Verification code sent.",
        );

        navigate(
          "/passenger/account/profile/verify",
          {
            state: {
              type: "phone",
              value:
                normalizedPhone,
            },
          },
        );
      } catch (caughtError) {
        const message =
          getPassengerApiError(
            caughtError,
            "Unable to send the verification code.",
          );

        setError(message);

        toast.error(message);
      }
    };

  return (
    <div className="min-h-[100dvh] bg-white">
      <AccountHeader />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-10 sm:px-7">
        <h1 className="text-[22px] font-semibold text-[#302B34]">
          Change Phone Number
        </h1>

        <p className="mt-2 max-w-[540px] text-[14px] leading-6 text-[#99939D]">
          {currentPhone ? (
            <>
              Your current phone
              number is{" "}
              <span className="font-medium text-[#625C66]">
                {currentPhone}
              </span>
              . Enter your new
              number and we'll send
              you a verification
              code.
            </>
          ) : (
            <>
              You don't have a phone
              number connected to
              your account yet.
              Enter your number and
              we'll send you a
              verification code.
            </>
          )}
        </p>

        <div
          className={`
            mt-6 flex min-h-[56px]
            items-center gap-3
            rounded-[12px]
            border px-4
            ${
              error
                ? "border-red-300 bg-red-50/40"
                : "border-transparent bg-[#F4F3F5]"
            }
          `}
        >
          <Phone
            size={19}
            className="shrink-0 text-[#7442AD]"
          />

          <input
            type="tel"
            inputMode="tel"
            value={phone}
            disabled={
              requestChange.isPending
            }
            onChange={(event) => {
              setPhone(
                event.target.value,
              );

              if (error) {
                setError("");
              }
            }}
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                void sendCode();
              }
            }}
            placeholder="08031234567"
            autoComplete="tel"
            className="w-full bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#B7B1BA]"
          />
        </div>

        <p className="mt-2 text-[13px] text-[#99939D]">
          Example: 08031234567 or
          +2348031234567
        </p>

        {error && (
          <p
            role="alert"
            className="mt-2 text-[14px] leading-5 text-red-600"
          >
            {error}
          </p>
        )}

        <motion.button
          type="button"
          disabled={
            !valid ||
            requestChange.isPending
          }
          whileTap={
            valid &&
            !requestChange.isPending
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={
            sendCode
          }
          className="mt-5 flex h-[56px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {requestChange.isPending && (
            <LoaderCircle
              size={19}
              className="animate-spin"
            />
          )}

          {requestChange.isPending
            ? "Sending Code..."
            : "Send Code"}
        </motion.button>
      </main>
    </div>
  );
}



