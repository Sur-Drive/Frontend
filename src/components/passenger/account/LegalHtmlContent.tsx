import {
  useMemo,
} from "react";

import {
  motion,
} from "framer-motion";

type LegalHtmlContentProps = {
  html: string;
  type: "privacy" | "terms";
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function prepareLegalHtml(
  html: string,
) {
  if (!html.trim()) {
    return "";
  }

  try {
    const parser =
      new DOMParser();

    const document =
      parser.parseFromString(
        html,
        "text/html",
      );

    const body =
      document.body;

    /*
     * Remove anything we don't need from
     * the backend document.
     *
     * We only render document content.
     */
    body
      .querySelectorAll(
        "script, style, iframe",
      )
      .forEach((element) =>
        element.remove(),
      );

    /*
     * External links should not replace
     * the passenger application.
     */
    body
      .querySelectorAll("a")
      .forEach((link) => {
        const href =
          link.getAttribute(
            "href",
          );

        if (
          href?.startsWith(
            "http",
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

    return body.innerHTML;
  } catch {
    return html;
  }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LegalHtmlContent({
  html,
  type,
}: LegalHtmlContentProps) {
  const content =
    useMemo(
      () =>
        prepareLegalHtml(
          html,
        ),
      [html],
    );

  if (!content) {
    return null;
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
    >
      {/* TOP LABEL */}

      <div className="flex items-center gap-2 px-1 mb-4">
        <span
          className="
            inline-flex
            items-center
            rounded-full
            bg-[#F1EAF8]
            px-3
            py-1.5
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.08em]
            text-[#7442AD]
          "
        >
          {type === "privacy"
            ? "Privacy"
            : "Legal"}
        </span>

        <span className="text-[12px] text-[#A19AA5]">
          SurDrive HT
        </span>
      </div>

      {/* DOCUMENT CARD */}

      <article
        className="
          legal-document
          overflow-hidden
          rounded-[24px]
          border
          border-[#ECE8EF]
          bg-white
          px-5
          py-6
          shadow-[0_12px_45px_rgba(44,30,58,0.055)]
          sm:px-8
          sm:py-8
        "
        dangerouslySetInnerHTML={{
          __html: content,
        }}
      />

      {/* FOOTER */}

      <div
        className="
          mt-5
          rounded-[18px]
          border
          border-[#EEEAF1]
          bg-white
          px-5
          py-4
          text-center
        "
      >
        <p className="text-[12px] leading-5 text-[#96909A]">
          This document is provided by{" "}
          <span className="font-semibold text-[#625B66]">
            SurDrive HT
          </span>
          . Please review it carefully.
        </p>
      </div>
    </motion.div>
  );
}