import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import LegalDocument from "../../../components/passenger/account/LegalDocument";
import LegalHtmlContent from "../../../components/passenger/account/LegalHtmlContent";

import {
  passengerLegalApi,
} from "../../../api/passenger/legal";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getErrorMessage(
  error: unknown,
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "We couldn't load the privacy policy. Please try again.";
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function PrivacyPolicy() {
  const [
    html,
    setHtml,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const loadPrivacyPolicy =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await passengerLegalApi.getPrivacyPolicy();

        if (
          typeof response !==
          "string"
        ) {
          throw new Error(
            "The privacy policy returned an invalid response.",
          );
        }

        setHtml(response);
      } catch (err) {
        console.error(
          "Failed to load privacy policy:",
          err,
        );

        setError(
          getErrorMessage(err),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadPrivacyPolicy();
  }, [loadPrivacyPolicy]);

  return (
    <LegalDocument title="Privacy Policy">
      {/* LOADING */}

      {loading && (
        <LegalLoading
          label="Loading privacy policy"
        />
      )}

      {/* ERROR */}

      {!loading &&
        error && (
          <LegalError
            message={error}
            onRetry={
              loadPrivacyPolicy
            }
          />
        )}

      {/* EMPTY */}

      {!loading &&
        !error &&
        !html && (
          <LegalEmpty
            message="The privacy policy is currently unavailable."
          />
        )}

      {/* CONTENT */}

      {!loading &&
        !error &&
        html && (
          <>
            <motion.div
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                mb-5
                flex
                items-start
                gap-3
                rounded-[18px]
                border
                border-[#E9E0F3]
                bg-[#F8F4FC]
                px-4
                py-4
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-[12px]
                  bg-white
                  text-[#7442AD]
                  shadow-sm
                "
              >
                <ShieldCheck
                  size={20}
                  strokeWidth={1.9}
                />
              </div>

              <div>
                <h2 className="text-[14px] font-semibold text-[#302B34]">
                  Your privacy matters
                </h2>

                <p className="mt-1 text-[12px] leading-5 text-[#7E7782]">
                  Learn how SurDrive
                  collects, uses,
                  protects and manages
                  your information.
                </p>
              </div>
            </motion.div>

            <LegalHtmlContent
              html={html}
              type="privacy"
            />
          </>
        )}
    </LegalDocument>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

function LegalLoading({
  label,
}: {
  label: string;
}) {
  return (
    <div
      className="
        flex
        min-h-[60vh]
        flex-col
        items-center
        justify-center
        text-center
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[#F1EAF8]
          text-[#7442AD]
        "
      >
        <LoaderCircle
          size={25}
          className="animate-spin"
        />
      </div>

      <p className="mt-4 text-[14px] font-medium text-[#625B66]">
        {label}
      </p>

      <p className="mt-1 text-[12px] text-[#A19AA5]">
        Just a moment...
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Error                                                                      */
/* -------------------------------------------------------------------------- */

function LegalError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => Promise<void>;
}) {
  return (
    <div
      className="
        flex
        min-h-[60vh]
        flex-col
        items-center
        justify-center
        px-4
        text-center
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[#FFF1F1]
          text-[#C62828]
        "
      >
        <AlertCircle
          size={25}
        />
      </div>

      <h2 className="mt-4 text-[17px] font-semibold text-[#302B34]">
        Unable to load document
      </h2>

      <p className="mt-2 max-w-[330px] text-[13px] leading-6 text-[#96909A]">
        {message}
      </p>

      <button
        type="button"
        onClick={() =>
          void onRetry()
        }
        className="
          mt-5
          inline-flex
          h-11
          items-center
          justify-center
          gap-2
          rounded-full
          bg-[#7442AD]
          px-5
          text-[14px]
          font-semibold
          text-white
          transition
          hover:bg-[#65379A]
          active:scale-[0.98]
        "
      >
        <RefreshCw
          size={16}
        />

        Try again
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty                                                                      */
/* -------------------------------------------------------------------------- */

function LegalEmpty({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 text-center">
      <p className="max-w-[320px] text-[14px] leading-6 text-[#96909A]">
        {message}
      </p>
    </div>
  );
}

