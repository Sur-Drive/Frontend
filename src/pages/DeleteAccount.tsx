import React from "react";
import {
  ChevronLeft,
  LogIn,
  Settings,
  Trash2,
  KeyRound,
  MailCheck,
  ShieldAlert,
} from "lucide-react";

const steps = [
  {
    icon: LogIn,
    title: "Log in to your account",
    description:
      "You must be signed in before we can process a deletion request — this confirms it's really you asking.",
  },
  {
    icon: Settings,
    title: "Open Account Settings",
    description:
      "From your profile, tap the menu icon and select \u201cAccount Settings\u201d from the list.",
  },
  {
    icon: Trash2,
    title: "Select \u201cDelete Account\u201d",
    description:
      "Scroll to the bottom of the settings page and tap \u201cDelete Account\u201d in red.",
  },
  {
    icon: KeyRound,
    title: "Confirm with your password",
    description:
      "You'll be asked to confirm you understand this is permanent, then enter your password to proceed.",
  },
  {
    icon: MailCheck,
    title: "Check your email",
    description:
      "We'll send a final confirmation link to your registered email — click it to permanently delete your account.",
  },
];

const DeleteAccountStepsPage: React.FC = () => {
  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-28">
      <div className="max-w-xl mx-auto lg:max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          <button
            type="button"
            aria-label="Go back"
            className="flex items-center justify-center text-gray-500 bg-white rounded-full shadow-sm h-9 w-9 shrink-0 sm:h-10 sm:w-10"
          >
            <ChevronLeft size={18} className="sm:hidden" />
            <ChevronLeft size={20} className="hidden sm:block" />
          </button>
          <h1 className="text-lg font-extrabold text-gray-900 sm:text-xl lg:text-2xl">
            Delete account
          </h1>
        </div>

        {/* Hero card */}
        <div className="mx-4 mt-5 rounded-3xl bg-[#6E43A3] p-5 sm:mx-6 sm:mt-6 sm:p-7 lg:mx-8 lg:p-8">
          <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-white/15 sm:h-12 sm:w-12">
            <ShieldAlert size={20} className="text-white sm:h-6 sm:w-6" />
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-white sm:text-xl lg:text-2xl">
            Before you go
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-white/75 sm:text-sm lg:text-base">
            Deleting your account is permanent and can't be undone. Your
            profile, saved preferences, and activity history will all be removed
            from our systems.
          </p>
        </div>

        {/* Steps */}
        <div className="px-4 mt-7 sm:px-6 sm:mt-9 lg:px-8">
          <p className="mb-4 text-xs font-semibold tracking-wide text-gray-400 sm:mb-5 sm:text-sm">
            HOW IT WORKS
          </p>

          <div className="flex flex-col gap-3 sm:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;
              return (
                <div key={step.title} className="relative flex gap-4">
                  {/* Connector line */}
                  {!isLast && (
                    <span className="absolute left-[19px] top-11 h-[calc(100%-1.75rem)] w-px bg-gray-200 sm:left-[23px] sm:top-12" />
                  )}

                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6E43A3]/10 sm:h-12 sm:w-12">
                    <Icon size={17} className="text-[#6E43A3] sm:h-5 sm:w-5" />
                  </div>

                  <div className="flex-1 min-w-0 pb-1 pt-1.5 sm:pt-2">
                    <p className="text-[13px] font-semibold text-gray-400 sm:text-sm">
                      Step {index + 1}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-gray-900 sm:text-base lg:text-lg">
                      {step.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-gray-500 sm:text-sm lg:text-base">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Login required notice */}
        <div className="flex items-start gap-3 p-4 mx-4 mt-7 rounded-2xl bg-amber-50 sm:mx-6 sm:mt-9 sm:p-5 lg:mx-8">
          <ShieldAlert
            size={16}
            className="mt-0.5 shrink-0 text-amber-600 sm:h-[18px] sm:w-[18px]"
          />
          <p className="text-[13px] leading-relaxed text-amber-800 sm:text-sm lg:text-base">
            You must be logged in before we can delete your account — this keeps
            anyone else from requesting it on your behalf.
          </p>
        </div>

        {/* CTA */}
        <div
          className="px-4 mt-7 sm:px-6 sm:mt-8 lg:px-8"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <button
            type="button"
            className="w-full rounded-2xl bg-[#6E43A3] py-3.5 text-sm font-semibold text-white transition hover:bg-[#5f3a8c] active:scale-[0.98] sm:py-4 sm:text-base lg:text-lg"
          >
            Log in to continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountStepsPage;
