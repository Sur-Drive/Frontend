import {
  Copy,
  FileText,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import SupportRow from "../../../../components/passenger/support/SupportRow";

export default function PassengerSupport() {
  const navigate =
    useNavigate();

  const [
    copied,
    setCopied,
  ] = useState<
    "phone" | "email" | null
  >(null);

  /*
   * Replace these with the real
   * Sur-Drive support contacts
   * when provided by the backend/team.
   */
  const phone =
    "+234800SURDRIVE";

  const callablePhone =
    "+23480078737483";

  const email =
    "support@surdrive.com";

  const copyToClipboard =
    async (
      value: string,
      type:
        | "phone"
        | "email",
    ) => {
      try {
        await navigator.clipboard.writeText(
          value,
        );

        setCopied(type);

        window.setTimeout(
          () => {
            setCopied(
              null,
            );
          },
          1800,
        );
      } catch {
        // Clipboard can be unavailable
        // depending on browser permissions.
      }
    };

  return (
    <div className="min-h-[100dvh] bg-[#F8F7F9]">
      <RideHeader
        title="Support"
        onBack={() =>
          navigate(
            "/passenger/account",
          )
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-3 sm:px-7">
        <p className="mt-1 text-[14px] text-[#918B95]">
          How can we help you?
        </p>

        <div className="mt-6 overflow-hidden rounded-[18px] bg-white shadow-[0_8px_30px_rgba(35,25,44,0.04)]">
          <SupportRow
            icon={
              FileText
            }
            title="Articles"
            description="Browse through our support articles"
            onClick={() =>
              navigate(
                "/passenger/account/support/articles",
              )
            }
          />

          <SupportRow
            icon={
              MessageCircle
            }
            title="Live Chat"
            description="Chat with our support team"
            onClick={() =>
              navigate(
                "/passenger/account/support/live-chat",
              )
            }
          />

          <SupportRow
            icon={
              Headphones
            }
            title="Tickets"
            description="See the status of every ticket raised here"
            onClick={() =>
              navigate(
                "/passenger/account/support/tickets",
              )
            }
          />

          <SupportRow
            icon={
              Phone
            }
            title="Call Us"
            description={
              copied ===
              "phone"
                ? "Copied"
                : phone
            }
            showChevron={
              false
            }
            trailing={
              <button
                type="button"
                aria-label="Copy support phone number"
                onClick={(
                  event,
                ) => {
                  event.stopPropagation();

                  copyToClipboard(
                    phone,
                    "phone",
                  );
                }}
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-[#817A85]
                  transition
                  hover:bg-[#F5F2F7]
                "
              >
                <Copy
                  size={17}
                />
              </button>
            }
            onClick={() => {
              window.location.href =
                `tel:${callablePhone}`;
            }}
          />

          <SupportRow
            icon={
              Mail
            }
            title="Email"
            description={
              copied ===
              "email"
                ? "Copied"
                : email
            }
            showChevron={
              false
            }
            trailing={
              <button
                type="button"
                aria-label="Copy support email"
                onClick={(
                  event,
                ) => {
                  event.stopPropagation();

                  copyToClipboard(
                    email,
                    "email",
                  );
                }}
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-[#817A85]
                  transition
                  hover:bg-[#F5F2F7]
                "
              >
                <Copy
                  size={17}
                />
              </button>
            }
            onClick={() => {
              window.location.href =
                `mailto:${email}`;
            }}
          />
        </div>
      </main>
    </div>
  );
}