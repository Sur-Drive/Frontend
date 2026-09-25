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
    setError("");

    submitPersonalInfo(
      {
        userId: state.userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dateOfBirth: dobIso,
        nin: ninNumber.trim(),
      },
      {
        onSuccess: () => {
          navigate("/register/license", {
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

  const labelClass = "text-sm font-medium text-gray-800";
  const fieldClass =
    "mt-2 h-14 w-full rounded-2xl bg-[#f4f4f3] px-4 text-base text-gray-800 outline-none placeholder:text-gray-400";

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-6 pb-8 pt-4">
      <OnboardingProgress progress={40} />

      <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
        Personal Information
      </h1>
      <p className="mt-2 text-base text-gray-400">Fill in the details below</p>

      <div className="mt-6 space-y-5">
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
            <ChevronDown size={18} className="text-gray-400" />
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
            <Calendar size={18} className="text-gray-400" />
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

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <button
        onClick={submit}
        disabled={!isValid || isSubmitting}
        className="mt-8 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-50"
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
