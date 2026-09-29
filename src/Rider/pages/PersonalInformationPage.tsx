import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, ChevronDown } from "lucide-react";
import OnboardingProgress from "../components/OnboardingProgress";
import GenderPickerSheet, {
  type Gender,
} from "../components/GenderPickerSheet";
import DateOfBirthPickerSheet, {
  type DateOfBirthValue,
} from "../components/DateOfBirthPickerSheet";
import { useSubmitRideDriverPersonalInfo } from "../hooks/useAuth";

interface OnboardingState {
  identifier?: string;
  role?: string;
  phone?: string;
  city?: string;
  userId?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function PersonalInformationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as OnboardingState) || {};

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [dob, setDob] = useState<DateOfBirthValue | null>(null);
  const [ninNumber, setNinNumber] = useState("");
  const [error, setError] = useState("");

  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [showDobSheet, setShowDobSheet] = useState(false);

  const { mutate: submitPersonalInfo, isPending: isSubmitting } =
    useSubmitRideDriverPersonalInfo();

  const dobLabel = dob ? `${dob.year}/${pad(dob.month)}/${pad(dob.day)}` : "";
  const dobIso = dob ? `${dob.year}-${pad(dob.month)}-${pad(dob.day)}` : "";

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    gender.length > 0 &&
    dob !== null &&
    ninNumber.trim().length === 11;

  const submit = () => {
    if (isSubmitting) return;

    if (!firstName.trim() || !lastName.trim()) {
      setError("Enter your first and last name.");
      return;
    }
    if (!gender) {
      setError("Select your gender.");
      return;
    }
    if (!dob) {
      setError("Select your date of birth.");
      return;
    }
    if (ninNumber.trim().length !== 11) {
      setError("Enter your 11-digit NIN number.");
      return;
    }
    if (!state.userId) {
      setError("Your session has expired. Please register again.");
      return;
    }
    if (!localStorage.getItem("driverOnboardingToken")) {
      setError("Your session has expired. Please verify your OTP again.");
      return;
    }
    setError("");

    submitPersonalInfo(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dateOfBirth: dobIso,
        nin: ninNumber.trim(),
      },
      {
        onSuccess: (data) => {
          if (data.tempToken) {
            localStorage.setItem("driverOnboardingToken", data.tempToken);
          }
          navigate("/register/vehicle-information", {
            state: {
              ...state,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              gender,
              dateOfBirth: dobLabel,
              ninNumber: ninNumber.trim(),
            },
          });
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to save personal information.",
          );
        },
      },
    );
  };

  const labelClass =
    "text-[clamp(11.5px,2.5dvh,14px)] font-medium text-gray-800";
  const fieldClass =
    "mt-[clamp(4px,1.2dvh,8px)] h-[clamp(42px,9.5dvh,52px)] w-full rounded-2xl bg-[#f4f4f3] px-[clamp(10px,2.6dvh,14px)] text-[clamp(12.5px,2.8dvh,15px)] text-gray-800 outline-none placeholder:text-gray-400";

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-[clamp(16px,5vw,24px)] pb-[clamp(16px,4dvh,28px)] pt-[clamp(10px,2.6dvh,16px)]">
      <OnboardingProgress progress={40} />

      <h1 className="mt-[clamp(14px,3.6dvh,22px)] text-[clamp(19px,4.4dvh,25px)] font-bold leading-tight text-[#2b2b2b]">
        Personal Information
      </h1>
      <p className="mt-[clamp(2px,0.8dvh,6px)] text-[clamp(11.5px,2.5dvh,14px)] text-gray-400">
        Fill in the details below
      </p>

      <div className="mt-[clamp(10px,2.6dvh,18px)] space-y-[clamp(10px,2.6dvh,18px)]">
        {/* First Name */}
        <div>
          <label className={labelClass}>
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setError("");
            }}
            className={fieldClass}
          />
        </div>

        {/* Last Name */}
        <div>
          <label className={labelClass}>
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setError("");
            }}
            className={fieldClass}
          />
        </div>

        {/* Gender */}
        <div>
          <label className={labelClass}>
            Gender <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowGenderSheet(true)}
            className={`${fieldClass} flex items-center justify-between text-left`}
          >
            <span className={gender ? "text-gray-800" : "text-gray-400"}>
              {gender || "Select Gender"}
            </span>
            <ChevronDown className="h-[clamp(14px,3.2dvh,18px)] w-[clamp(14px,3.2dvh,18px)] text-gray-400" />
          </button>
        </div>

        {/* Date of birth */}
        <div>
          <label className={labelClass}>
            Date of birth <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowDobSheet(true)}
            className={`${fieldClass} flex items-center justify-between text-left`}
          >
            <span className={dobLabel ? "text-gray-800" : "text-gray-400"}>
              {dobLabel || "YYYY/MM/DD"}
            </span>
            <Calendar className="h-[clamp(14px,3.2dvh,18px)] w-[clamp(14px,3.2dvh,18px)] text-gray-400" />
          </button>
        </div>

        {/* NIN Number */}
        <div>
          <label className={labelClass}>
            Nin Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter your 11 NIN Digit here"
            value={ninNumber}
            onChange={(e) => {
              setNinNumber(e.target.value.replace(/\D/g, "").slice(0, 11));
              setError("");
            }}
            className={fieldClass}
          />
        </div>

        {error && (
          <p className="text-[clamp(11.5px,2.5dvh,14px)] text-red-500">
            {error}
          </p>
        )}
      </div>

      <button
        onClick={submit}
        disabled={!isValid || isSubmitting}
        className="mt-[clamp(14px,3.6dvh,22px)] h-[clamp(44px,10dvh,56px)] w-full rounded-2xl bg-[#6E43A3] text-[clamp(14px,3.2dvh,18px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? "Please wait..." : "Continue"}
      </button>

      {showGenderSheet && (
        <GenderPickerSheet
          initialValue={(gender as Gender) || "Female"}
          onClose={() => setShowGenderSheet(false)}
          onSelect={(value) => {
            setGender(value);
            setShowGenderSheet(false);
            setError("");
          }}
        />
      )}

      {showDobSheet && (
        <DateOfBirthPickerSheet
          initialValue={dob ?? undefined}
          onClose={() => setShowDobSheet(false)}
          onSelect={(value) => {
            setDob(value);
            setShowDobSheet(false);
            setError("");
          }}
        />
      )}
    </div>
  );
}
