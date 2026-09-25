import { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Pencil,
  User,
  Phone,
  Mail,
  Cake,
  Check,
  X,
  CircleUserRound,
} from "lucide-react";
import DriverOtpEntry from "../../components/DriverOtpEntry";

type Step =
  | "profile"
  | "change-email"
  | "change-email-otp"
  | "change-phone"
  | "change-phone-otp";

const GENDERS = ["Male", "Female", "Prefer not to say"] as const;

export default function ProfileFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>("profile");
  const [name] = useState("Adeniji Abiodun");
  const [phone, setPhone] = useState("+234 803 660 0027");
  const [email, setEmail] = useState("Adenjiabiodun@gmail.com");
  const [gender, setGender] = useState<(typeof GENDERS)[number]>("Male");
  const [dob] = useState("December, 29");
  const [genderOpen, setGenderOpen] = useState(false);

  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [toast, setToast] = useState(false);

  const showSavedToast = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 3000);
  };

  /* ---------------- Change Email ---------------- */
  if (step === "change-email") {
    return (
      <ChangeContactStep
        title="Change Email"
        description={
          <>
            Your current email is {email}. To verify your new address, we'll
            send you a 4-digit code. Please enter the code to complete
            verification
          </>
        }
        icon={<Mail size={16} className="text-[#6E43A3]" />}
        placeholder="Enter Your New Email"
        inputType="email"
        onBack={() => setStep("profile")}
        onSend={(value) => {
          setPendingEmail(value);
          setStep("change-email-otp");
        }}
      />
    );
  }

  if (step === "change-email-otp") {
    return (
      <DriverOtpEntry
        destination={pendingEmail || email}
        onBack={() => setStep("change-email")}
        onVerified={() => {
          setEmail(pendingEmail || email);
          setStep("profile");
          showSavedToast();
        }}
      />
    );
  }

  /* ---------------- Change Phone ---------------- */
  if (step === "change-phone") {
    return (
      <ChangeContactStep
        title="Change Phone Number"
        description={
          <>
            Your current Phone number is {phone}. To verify your new
            address, we'll send you a 4-digit code. Please enter the code to
            complete verification
          </>
        }
        icon={<Phone size={16} className="text-[#6E43A3]" />}
        placeholder="Enter Your New Number"
        inputType="tel"
        onBack={() => setStep("profile")}
        onSend={(value) => {
          setPendingPhone(value);
          setStep("change-phone-otp");
        }}
      />
    );
  }

  if (step === "change-phone-otp") {
    return (
      <DriverOtpEntry
        destination={pendingPhone || phone}
        onBack={() => setStep("change-phone")}
        onVerified={() => {
          setPhone(pendingPhone || phone);
          setStep("profile");
          showSavedToast();
        }}
      />
    );
  }

  /* ---------------- Profile (root) ---------------- */
  return (
    <div className="font-outfit relative flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            Profile
          </h1>
          <p className="mt-1.5 text-[15px] text-[#9AA5B8]">
            Help our drivers identify you easily
          </p>

          {/* avatar */}
          <div className="mt-8 flex justify-center">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#EFE6F7]">
                <CircleUserRound size={72} className="text-[#D8C3EC]" />
              </div>
              <button
                type="button"
                className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#6E43A3] text-white shadow-md"
                aria-label="Edit photo"
              >
                <Pencil size={16} />
              </button>
            </div>
          </div>

          {/* name (read-only display) */}
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#F1F2F5] px-4 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6DAF3]">
              <User size={16} className="text-[#6E43A3]" />
            </span>
            <span className="text-[15px] font-medium text-[#1F2937]">
              {name}
            </span>
          </div>

          {/* phone */}
          <div className="mb-2 mt-5 flex items-center justify-between">
            <span className="text-sm text-[#1F2937]">Phone Number</span>
            <button
              type="button"
              onClick={() => setStep("change-phone")}
              className="text-sm font-semibold text-[#6E43A3]"
            >
              Change Number
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[#F1F2F5] px-4 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6DAF3]">
              <Phone size={15} className="text-[#6E43A3]" />
            </span>
            <span className="text-[15px] font-medium text-[#1F2937]">
              {phone}
            </span>
          </div>

          {/* email */}
          <div className="mb-2 mt-5 flex items-center justify-between">
            <span className="text-sm text-[#1F2937]">Email</span>
            <button
              type="button"
              onClick={() => setStep("change-email")}
              className="text-sm font-semibold text-[#6E43A3]"
            >
              Change Email
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[#F1F2F5] px-4 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6DAF3]">
              <Mail size={15} className="text-[#6E43A3]" />
            </span>
            <span className="truncate text-[15px] font-medium text-[#1F2937]">
              {email}
            </span>
          </div>

          {/* gender */}
          <div className="relative mt-5">
            <button
              type="button"
              onClick={() => setGenderOpen((v) => !v)}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#F1F2F5] px-4 py-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6DAF3]">
                <User size={15} className="text-[#6E43A3]" />
              </span>
              <span className="flex-1 text-left text-[15px] font-medium text-[#1F2937]">
                {gender}
              </span>
              <ChevronDown
                size={18}
                className={`text-[#4B5768] transition ${genderOpen ? "rotate-180" : ""}`}
              />
            </button>
            {genderOpen && (
              <div className="absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGender(g);
                      setGenderOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] text-[#1F2937] hover:bg-gray-50"
                  >
                    {g}
                    {gender === g && (
                      <Check size={16} className="text-[#6E43A3]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* dob */}
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#F1F2F5] px-4 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6DAF3]">
              <Cake size={15} className="text-[#6E43A3]" />
            </span>
            <span className="text-[15px] font-medium text-[#1F2937]">
              {dob}
            </span>
          </div>

          <button
            type="button"
            onClick={showSavedToast}
            className="mt-8 w-full rounded-full bg-[#6E43A3] py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.99]"
          >
            Save Changes
          </button>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] flex justify-center px-6">
          <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DCF5E4]">
              <Check size={13} className="text-[#1E9E56]" strokeWidth={3} />
            </span>
            <span className="flex-1 text-[14px] font-medium text-[#1F2937]">
              Changes successfully saved
            </span>
            <button
              type="button"
              onClick={() => setToast(false)}
              className="shrink-0 text-[#9AA5B8]"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared "enter new value, send code" step for email/phone changes   */
/* ------------------------------------------------------------------ */

function ChangeContactStep({
  title,
  description,
  icon,
  placeholder,
  inputType,
  onBack,
  onSend,
}: {
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  placeholder: string;
  inputType: "email" | "tel";
  onBack: () => void;
  onSend: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            {title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#9AA5B8]">
            {description}
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#F1F2F5] px-4 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6DAF3]">
              {icon}
            </span>
            <input
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full flex-1 bg-transparent text-[15px] font-medium text-[#1F2937] placeholder:text-[#9AA5B8] focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={!value.trim()}
            onClick={() => onSend(value.trim())}
            className={`mt-5 w-full rounded-full py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.99] ${
              value.trim() ? "bg-[#6E43A3]" : "bg-[#C9B6DE]"
            }`}
          >
            Send Code
          </button>
        </div>
      </div>
    </div>
  );
}
