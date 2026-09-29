import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock, Mail, Smartphone } from "lucide-react";
import ToggleSwitch from "../../components/ToggleSwitch";
import ChangePasswordPage from "./ChangePasswordPage";

type View = "home" | "change-password";

export default function PrivacySecurityPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const [view, setView] = useState<View>("home");
  const [emailNotification, setEmailNotification] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);

  if (view === "change-password") {
    return (
      <ChangePasswordPage
        onBack={() => setView("home")}
        onDone={() => setView("home")}
      />
    );
  }

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[26px] font-extrabold text-[#1F2937]">
            Privacy &amp; security
          </h1>

          <div className="mt-5 divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            <div className="flex w-full items-center gap-3.5 py-4 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <Mail size={18} className="text-[#1F2937]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#1F2937]">
                  Email Notification
                </p>
                <p className="text-[13.5px] text-[#9AA5B8]">
                  Get updates via email
                </p>
              </div>
              <ToggleSwitch
                checked={emailNotification}
                onChange={setEmailNotification}
                ariaLabel="Email Notification"
              />
            </div>

            <div className="flex w-full items-center gap-3.5 py-4 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <Smartphone size={18} className="text-[#1F2937]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#1F2937]">
                  Push Notifications
                </p>
                <p className="text-[13.5px] text-[#9AA5B8]">Receive update</p>
              </div>
              <ToggleSwitch
                checked={pushNotifications}
                onChange={setPushNotifications}
                ariaLabel="Push Notifications"
              />
            </div>

            <button
              type="button"
              onClick={() => setView("change-password")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <Lock size={18} className="text-[#1F2937]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#1F2937]">
                  Security Settings
                </p>
                <p className="text-[13.5px] text-[#9AA5B8]">
                  Change account password
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
