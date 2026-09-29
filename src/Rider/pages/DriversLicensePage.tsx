import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, HelpCircle } from "lucide-react";
import OnboardingProgress from "../components/OnboardingProgress";
import { useSubmitRideDriverDriversLicense } from "../hooks/useVehicle";

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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const countryRef = useRef<HTMLDivElement | null>(null);

  const { mutateAsync: submitDriversLicense, isPending: isSubmitting } =
    useSubmitRideDriverDriversLicense();

  useEffect(() => {
    if (!countryOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        countryRef.current &&
        !countryRef.current.contains(e.target as Node)
      ) {
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

  const submit = async () => {
    if (isSubmitting) return;

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
    if (!file) {
      setError("Upload a copy of your driver's license.");
      return;
    }
    setError("");

    try {
      const res = await submitDriversLicense({
        expiryDate: expiry,
        licenseNumber: licenseNumber.trim(),
        issuingCountry: country,
        file,
      });
      if (res.tempToken) {
        localStorage.setItem("driverOnboardingToken", res.tempToken);
      }
      navigate("/register/vehicle-inspection", { state });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save driver's license.",
      );
    }
  };

  const labelClass =
    "flex items-center gap-1.5 text-[clamp(11.5px,2.5dvh,14px)] font-medium text-gray-800";
  const fieldClass =
    "mt-[clamp(4px,1.2dvh,8px)] h-[clamp(42px,9.5dvh,52px)] w-full rounded-2xl bg-[#f4f4f3] px-[clamp(10px,2.6dvh,14px)] text-[clamp(12.5px,2.8dvh,15px)] text-gray-800 outline-none placeholder:text-gray-400";

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-[clamp(16px,5vw,24px)] pb-[clamp(16px,4dvh,28px)] pt-[clamp(10px,2.6dvh,16px)]">
      <OnboardingProgress progress={60} />

      <h1 className="mt-[clamp(14px,3.6dvh,22px)] text-[clamp(19px,4.4dvh,25px)] font-bold leading-tight text-[#2b2b2b]">
        Driver's License
      </h1>
      <p className="mt-[clamp(2px,0.8dvh,6px)] text-[clamp(11.5px,2.5dvh,14px)] text-gray-400">
        Provide your license details for verification
      </p>

      <div className="mt-[clamp(10px,2.6dvh,18px)] space-y-[clamp(10px,2.6dvh,18px)]">
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
              className={`h-[clamp(14px,3.2dvh,18px)] w-[clamp(14px,3.2dvh,18px)] text-gray-500 transition-transform ${
                countryOpen ? "rotate-180" : ""
              }`}
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
                  className={`block w-full rounded-xl px-[clamp(10px,2.6dvh,16px)] py-[clamp(8px,2dvh,12px)] text-left text-[clamp(12.5px,2.8dvh,15px)] transition ${
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
          <label className={labelClass}>
            Upload Driver's License <span className="text-red-500">*</span>
            <HelpCircle className="h-[clamp(13px,2.9dvh,16px)] w-[clamp(13px,2.9dvh,16px)] text-[#3b7ec2]" />
          </label>
          <label className="mt-[clamp(4px,1.2dvh,8px)] flex h-[clamp(42px,9.5dvh,52px)] w-full cursor-pointer overflow-hidden rounded-2xl bg-[#f4f4f3]">
            <span className="flex items-center justify-center border-r border-gray-300 px-[clamp(10px,2.6dvh,20px)] text-[clamp(10.5px,2.3dvh,13px)] text-gray-600">
              Choose files
            </span>
            <span className="flex flex-1 items-center truncate px-[clamp(8px,2dvh,16px)] text-[clamp(10.5px,2.3dvh,13px)] text-gray-400">
              {file ? file.name : "No file chosen"}
            </span>
            <input
              type="file"
              accept=".doc,.docx,.png,.jpg,.jpeg,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                setError("");
              }}
            />
          </label>
          <p className="mt-[clamp(4px,1.2dvh,8px)] text-[clamp(9.5px,2dvh,12px)] text-gray-400">
            DOC, PNG, JPG or PDF (MAX. 8MB).
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-[clamp(10px,2.6dvh,18px)] text-center text-[clamp(11.5px,2.5dvh,14px)] text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={isSubmitting}
        className="mt-[clamp(14px,3.6dvh,22px)] h-[clamp(44px,10dvh,56px)] w-full rounded-2xl bg-[#6E43A3] text-[clamp(14px,3.2dvh,18px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-60"
      >
        {isSubmitting ? "Please wait..." : "Continue"}
      </button>
    </div>
  );
}
