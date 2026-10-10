import {
  LoaderCircle,
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

import {
  toast,
} from "sonner";

import AccountHeader from "../../../components/passenger/account/AccountHeader";

import {
  usePassengerProfileQuery,
  useRequestPassengerEmailChange,
} from "../../../hooks/passenger/usePassengerProfileApi";

import {
  getPassengerApiError,
} from "../../../api/passenger/getPassengerApiError";

function normalizeEmail(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function isValidEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

export default function ChangeEmail() {
  const navigate =
    useNavigate();

  /*
   * --------------------------------------------
   * BACKEND PROFILE
   * --------------------------------------------
   */

  const profileQuery =
    usePassengerProfileQuery();

  const requestChange =
    useRequestPassengerEmailChange();

  /*
   * --------------------------------------------
   * LOCAL FORM STATE
   * --------------------------------------------
   */

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  /*
   * --------------------------------------------
   * CURRENT BACKEND EMAIL
   * --------------------------------------------
   */

  const currentEmail =
    profileQuery.data?.email
      ?.trim() ?? "";

  const normalizedEmail =
    normalizeEmail(email);

  const currentNormalizedEmail =
    normalizeEmail(
      currentEmail,
    );

  const valid =
    isValidEmail(
      normalizedEmail,
    );

  const sameAsCurrent =
    Boolean(
      currentNormalizedEmail &&
        normalizedEmail ===
          currentNormalizedEmail,
    );

  const canSubmit =
    valid &&
    !sameAsCurrent &&
    !requestChange.isPending;

  /*
   * --------------------------------------------
   * SEND CODE
   * --------------------------------------------
   */

  const sendCode =
    async () => {
      if (
        requestChange.isPending
      ) {
        return;
      }

      if (
        !normalizedEmail
      ) {
        const message =
          "Enter your new email address.";

        setError(message);

        toast.error(message);

        return;
      }

      if (!valid) {
        const message =
          "Enter a valid email address.";

        setError(message);

        toast.error(message);

        return;
      }

      if (sameAsCurrent) {
        const message =
          "Your new email must be different from your current email.";

        setError(message);

        toast.error(message);

        return;
      }

      setError("");

      try {
        await requestChange.mutateAsync(
          normalizedEmail,
        );

        toast.success(
          "Verification code sent.",
        );

        navigate(
          "/passenger/account/profile/verify",
          {
            state: {
              type: "email",
              value:
                normalizedEmail,
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

  /*
   * --------------------------------------------
   * QUERY ERROR
   * --------------------------------------------
   */

  const profileError =
    profileQuery.error
      ? getPassengerApiError(
          profileQuery.error,
          "Unable to load your current email.",
        )
      : "";

  const visibleError =
    error ||
    profileError;

  return (
    <div className="min-h-[100dvh] bg-white">
      <AccountHeader />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-10 sm:px-7">
        <h1 className="text-[22px] font-semibold text-[#302B34]">
          Change Email
        </h1>

        {/* DESCRIPTION */}

        <p className="mt-2 max-w-[540px] text-[14px] leading-6 text-[#99939D]">
          {profileQuery.isPending ? (
            "Loading your current email..."
          ) : currentEmail ? (
            <>
              Your current email is{" "}

              <span className="font-medium text-[#625C66]">
                {currentEmail}
              </span>

              . Enter your new email
              address and we'll send
              you a verification
              code.
            </>
          ) : (
            <>
              You don't currently
              have an email address
              connected to your
              account. Enter an
              email address and
              we'll send you a
              verification code.
            </>
          )}
        </p>

        {/* EMAIL INPUT */}

        <div
          className={`
            mt-6 flex min-h-[56px]
            items-center gap-3
            rounded-[12px]
            border px-4
            ${
              visibleError
                ? "border-red-300 bg-red-50/40"
                : "border-transparent bg-[#F4F3F5]"
            }
          `}
        >
          <Mail
            size={19}
            className="shrink-0 text-[#7442AD]"
          />

          <input
            type="email"
            value={email}
            disabled={
              requestChange.isPending
            }
            onChange={(event) => {
              setEmail(
                event.target.value,
              );

              if (error) {
                setError("");
              }
            }}
            onKeyDown={(event) => {
              if (
                event.key ===
                  "Enter" &&
                canSubmit
              ) {
                void sendCode();
              }
            }}
            placeholder="Enter your new email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#B7B1BA]"
          />
        </div>

        {/* FIELD FEEDBACK */}

        {sameAsCurrent &&
          !error && (
            <p className="mt-2 text-[14px] leading-5 text-amber-600">
              Enter an email
              different from your
              current email.
            </p>
          )}

        {visibleError && (
          <p
            role="alert"
            className="mt-2 text-[14px] leading-5 text-red-600"
          >
            {visibleError}
          </p>
        )}

        {/* SEND CODE */}

        <motion.button
          type="button"
          disabled={
            !canSubmit
          }
          whileTap={
            canSubmit
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



