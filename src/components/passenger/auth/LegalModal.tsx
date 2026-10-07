import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { passengerLegalApi } from "../../../api/passenger/legal";



export type LegalModalType =
  | "terms"
  | "privacy";

type Props = {
  open: boolean;
  type: LegalModalType;
  onClose: () => void;
};

/* =========================================================
   DOCUMENT META
========================================================= */

function getDocumentMeta(
  type: LegalModalType,
) {
  if (type === "privacy") {
    return {
      title: "Privacy Policy",
      description:
        "How SurDrive collects, uses and protects your information.",
      icon: ShieldCheck,
    };
  }

  return {
    title: "Terms & Conditions",
    description:
      "Please review the terms governing your use of SurDrive.",
    icon: FileText,
  };
}

/* =========================================================
   EXTRACT SAFE DOCUMENT BODY
========================================================= */

function extractDocumentBody(
  html: string,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return html;
  }

  try {
    const parser =
      new DOMParser();

    const document =
      parser.parseFromString(
        html,
        "text/html",
      );

    /*
     * Remove elements that should never
     * be rendered inside the application.
     */
    document
      .querySelectorAll(
        "script, style, iframe, object, embed",
      )
      .forEach(
        (element) => {
          element.remove();
        },
      );

    /*
     * Remove inline event handlers and
     * unsafe javascript: links.
     */
    document
      .querySelectorAll("*")
      .forEach(
        (element) => {
          Array.from(
            element.attributes,
          ).forEach(
            (attribute) => {
              if (
                attribute.name
                  .toLowerCase()
                  .startsWith(
                    "on",
                  )
              ) {
                element.removeAttribute(
                  attribute.name,
                );
              }
            },
          );
        },
      );

    document
      .querySelectorAll("a")
      .forEach((link) => {
        const href =
          link.getAttribute(
            "href",
          );

        if (
          href
            ?.trim()
            .toLowerCase()
            .startsWith(
              "javascript:",
            )
        ) {
          link.removeAttribute(
            "href",
          );
          return;
        }

        if (
          href?.startsWith(
            "http://",
          ) ||
          href?.startsWith(
            "https://",
          )
        ) {
          link.setAttribute(
            "target",
            "_blank",
          );

          link.setAttribute(
            "rel",
            "noopener noreferrer",
          );
        }
      });

    return (
      document.body
        .innerHTML || html
    );
  } catch {
    return html;
  }
}

/* =========================================================
   MODAL
========================================================= */

export default function LegalModal({
  open,
  type,
  onClose,
}: Props) {
  const [html, setHtml] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const meta =
    getDocumentMeta(type);

  const Icon = meta.icon;

  /* =======================================================
     LOAD DOCUMENT
  ======================================================= */

  const loadDocument =
    async () => {
      setIsLoading(true);
      setError("");

      try {
        const response =
          type === "terms"
            ? await passengerLegalApi.getTermsAndConditions()
            : await passengerLegalApi.getPrivacyPolicy();

        if (
          typeof response !==
            "string" ||
          !response.trim()
        ) {
          throw new Error(
            "The document is currently unavailable.",
          );
        }

        setHtml(response);
      } catch (error) {
        console.error(
          "Unable to load legal document:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load this document. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

  /* =======================================================
     FETCH WHEN OPENED
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    setHtml("");

    void loadDocument();
  }, [open, type]);

  /* =======================================================
     LOCK BACKGROUND
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  /* =======================================================
     DOCUMENT HTML
  ======================================================= */

  const documentHtml =
    useMemo(
      () =>
        extractDocumentBody(
          html,
        ),
      [html],
    );

  return (
    <AnimatePresence>
      {open && (
        <div
          className="
            fixed
            inset-0
            z-[5000]
            flex
            items-end
            justify-center
            sm:items-center
            sm:p-5
          "
        >
          {/* BACKDROP */}

          <motion.button
            type="button"
            aria-label="Close legal document"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            onClick={onClose}
            className="
              absolute
              inset-0
              bg-black/45
              backdrop-blur-[2px]
            "
          />

          {/* MODAL */}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            initial={{
              opacity: 0,
              y: 40,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 30,
              scale: 0.98,
            }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 30,
            }}
            className="
              relative
              flex
              h-[92dvh]
              w-full
              flex-col
              overflow-hidden
              rounded-t-[26px]
              bg-white
              shadow-2xl

              sm:h-[88dvh]
              sm:max-w-[720px]
              sm:rounded-[24px]
            "
          >
            {/* MOBILE HANDLE */}

            <div
              className="
                flex
                justify-center
                pb-1
                pt-2.5
                sm:hidden
              "
            >
              <span
                className="
                  h-1
                  w-10
                  rounded-full
                  bg-[#DDD8E0]
                "
              />
            </div>

            {/* HEADER */}

            <div
              className="
                shrink-0
                border-b
                border-[#EEEAF0]
                bg-white
                px-5
                pb-4
                pt-3

                sm:px-7
                sm:py-5
              "
            >
              <div
                className="flex items-start justify-between gap-4 "
              >
                <div
                  className="flex items-start min-w-0 gap-3 "
                >
                  <span
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-[12px]
                      bg-[#F3EDF8]
                      text-[#7442AD]
                    "
                  >
                    <Icon
                      size={20}
                    />
                  </span>

                  <div className="min-w-0">
                    <h2
                      id="legal-modal-title"
                      className="
                        text-[18px]
                        font-bold
                        tracking-[-0.02em]
                        text-[#211C25]

                        sm:text-[20px]
                      "
                    >
                      {meta.title}
                    </h2>

                    <p
                      className="
                        mt-1
                        text-[12px]
                        leading-5
                        text-[#8D8691]

                        sm:text-[13px]
                      "
                    >
                      {
                        meta.description
                      }
                    </p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileTap={{
                    scale: 0.9,
                  }}
                  onClick={
                    onClose
                  }
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[#F5F3F6]
                    text-[#665F69]
                    transition
                    hover:bg-[#ECE8EE]
                  "
                  aria-label="Close"
                >
                  <X
                    size={18}
                  />
                </motion.button>
              </div>
            </div>

            {/* BODY */}

            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
            >
              {/* LOADING */}

              {isLoading && (
                <div
                  className="
                    flex
                    min-h-[360px]
                    flex-col
                    items-center
                    justify-center
                    px-6
                    text-center
                  "
                >
                  <LoaderCircle
                    size={28}
                    className="
                      animate-spin
                      text-[#7442AD]
                    "
                  />

                  <p
                    className="
                      mt-4
                      text-[14px]
                      font-medium
                      text-[#736D77]
                    "
                  >
                    Loading{" "}
                    {meta.title.toLowerCase()}
                    ...
                  </p>
                </div>
              )}

              {/* ERROR */}

              {!isLoading &&
                error && (
                  <div
                    className="
                      flex
                      min-h-[360px]
                      flex-col
                      items-center
                      justify-center
                      px-6
                      text-center
                    "
                  >
                    <span
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-full
                        bg-[#FFF0F0]
                        text-[#D54C4C]
                      "
                    >
                      <AlertCircle
                        size={22}
                      />
                    </span>

                    <h3
                      className="
                        mt-4
                        text-[16px]
                        font-semibold
                        text-[#29232D]
                      "
                    >
                      Unable to load document
                    </h3>

                    <p
                      className="
                        mt-2
                        max-w-[330px]
                        text-[13px]
                        leading-5
                        text-[#8C8590]
                      "
                    >
                      {error}
                    </p>

                    <motion.button
                      type="button"
                      whileTap={{
                        scale: 0.96,
                      }}
                      onClick={() =>
                        void loadDocument()
                      }
                      className="
                        mt-5
                        flex
                        h-11
                        items-center
                        justify-center
                        gap-2
                        rounded-[10px]
                        bg-[#7442AD]
                        px-5
                        text-[14px]
                        font-semibold
                        text-white
                      "
                    >
                      <RefreshCw
                        size={16}
                      />

                      Try again
                    </motion.button>
                  </div>
                )}

              {/* DOCUMENT */}

              {!isLoading &&
                !error &&
                documentHtml && (
                  <div
                    className="px-5 py-6 legal-document sm:px-8 sm:py-8"
                    dangerouslySetInnerHTML={{
                      __html:
                        documentHtml,
                    }}
                  />
                )}
            </div>

            {/* FOOTER */}

            {!isLoading &&
              !error &&
              documentHtml && (
                <div
                  className="
                    shrink-0
                    border-t
                    border-[#EEEAF0]
                    bg-white
                    px-5
                    py-3
                    pb-[calc(12px+env(safe-area-inset-bottom))]

                    sm:px-7
                    sm:py-4
                  "
                >
                  <motion.button
                    type="button"
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={
                      onClose
                    }
                    className="
                      flex
                      h-12
                      w-full
                      items-center
                      justify-center
                      rounded-[10px]
                      bg-[#7442AD]
                      text-[15px]
                      font-semibold
                      text-white
                      shadow-[0_8px_20px_rgba(116,66,173,0.2)]
                    "
                  >
                    Done
                  </motion.button>
                </div>
              )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}