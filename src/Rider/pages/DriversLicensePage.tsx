import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, HelpCircle } from "lucide-react";
import OnboardingProgress from "../components/OnboardingProgress";

const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Egypt",
  "United Kingdom",
  "United States",
];

interface OnboardingState {
  identifier?: string;
  role?: string;
  phone?: string;
  city?: string;
}

export default function DriversLicensePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as OnboardingState) || {};

  const [licenseNumber, setLicenseNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [country, setCountry] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const countryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!countryOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [countryOpen]);

  const formatExpiry = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const expiryValid = /^(0[1-9]|1[0-2])\/\d{4}$/.test(expiry);

  const submit = () => {
    if (!licenseNumber.trim()) {
      setError("Enter your license number.");
      return;
    }
    if (!expiryValid) {
      setError("Enter a valid expiry date (MM/YYYY).");
      return;
    }
    if (!country) {
      setError("Select the issuing country.");
      return;
    }
    if (!fileName) {
      setError("Upload a copy of your driver's license.");
      return;
    }
    setError("");
    navigate("/register/vehicle-inspection", { state });
  };

  const labelClass = "text-sm font-medium text-gray-800";
  const fieldClass =
    "mt-2 h-14 w-full rounded-2xl bg-[#f4f4f3] px-4 text-base text-gray-800 outline-none placeholder:text-gray-400";

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-6 pb-8 pt-4">
      <OnboardingProgress progress={60} />

      <h1 className="mt-8 text-[28px] font-bold text-[#2b2b2b]">
        Driver's License
      </h1>
      <p className="mt-2 text-base text-gray-400">
        Provide your license details for verification
      </p>

      <div className="mt-8 space-y-6">
        {/* License number */}
        <div>
          <label className={labelClass}>
            License Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter lincense number"
            value={licenseNumber}
            onChange={(e) => {
              setLicenseNumber(e.target.value);
              setError("");
            }}
            className={fieldClass}
          />
        </div>

        {/* Expiry date */}
        <div>
          <label className={labelClass}>
            Expiry Date <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/YYYY"
            value={expiry}
            onChange={(e) => {
              setExpiry(formatExpiry(e.target.value));
              setError("");
            }}
            maxLength={7}
            className={fieldClass}
          />
        </div>

        {/* Issuing country */}
        <div className="relative" ref={countryRef}>
          <label className={labelClass}>
            Issuing Country <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setCountryOpen((o) => !o)}
            className={`${fieldClass} flex items-center justify-between text-left`}
          >
            <span className={country ? "text-gray-800" : "text-gray-400"}>
              {country || "Select"}
            </span>
            <ChevronDown
              size={18}
              className={`text-gray-500 transition-transform ${countryOpen ? "rotate-180" : ""}`}
            />
          </button>

          {countryOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl">
              {COUNTRIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCountry(c);
                    setCountryOpen(false);
                    setError("");
                  }}
                  className={`block w-full rounded-xl px-4 py-3 text-left text-base transition ${
                    country === c
                      ? "bg-[#ece4f5] font-semibold text-[#6E43A3]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload */}
        <div>
          <label className={`${labelClass} flex items-center gap-1.5`}>
            Upload Driver's License <span className="text-red-500">*</span>
            <HelpCircle size={16} className="text-[#3b7ec2]" />
          </label>
          <label className="mt-2 flex h-14 w-full cursor-pointer overflow-hidden rounded-2xl bg-[#f4f4f3]">
            <span className="flex items-center justify-center border-r border-gray-300 px-5 text-sm text-gray-600">
              Choose files
            </span>
            <span className="flex flex-1 items-center truncate px-4 text-sm text-gray-400">
              {fileName || "No file chosen"}
            </span>
            <input
              type="file"
              accept=".doc,.docx,.png,.jpg,.jpeg,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setFileName(file ? file.name : "");
                setError("");
              }}
            />
          </label>
          <p className="mt-2 text-xs text-gray-400">
            DOC, PNG, JPG or PDF (MAX. 8MB).
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-6 text-sm text-center text-red-600">{error}</p>
      )}

      <button
        onClick={submit}
        className="mt-8 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
      >
        Continue
      </button>
    </div>
  );
}
