import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, HelpCircle } from "lucide-react";

import OnboardingProgress from "../components/OnboardingProgress";
import VehicleCategoryPickerSheet, {
  type VehicleCategory,
} from "../components/VehicleCategoryPickerSheet";

import { useUpdateRideDriverVehicleCombined } from "../hooks/useVehicle";

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  Economy: "Economy — No air conditioning",
  Comfort: "Comfort — Air conditioning",
  SUV: "SUV — Air conditioning + larger luggage/storage space",
};

interface OnboardingState {
  identifier?: string;
  role?: string;
  phone?: string;
  city?: string;
  userId?: string;
}

export default function VehicleInformationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as OnboardingState) || {};

  // -----------------------------
  // Vehicle information
  // -----------------------------
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [capacity, setCapacity] = useState("");
  const [category, setCategory] = useState<VehicleCategory | "">("");

  // -----------------------------
  // Documents
  // -----------------------------
  const [ownershipFile, setOwnershipFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [roadWorthinessFile, setRoadWorthinessFile] = useState<File | null>(
    null,
  );

  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [error, setError] = useState("");
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  const updateVehicle = useUpdateRideDriverVehicleCombined();

  const isSubmitting = updateVehicle.isPending || isUploadingDocuments;

  // ============================================================
  // SUBMIT
  // ============================================================

  const submit = async () => {
    if (isSubmitting) return;

    setError("");

    // -----------------------------
    // Validate plate number
    // -----------------------------
    const cleanPlateNumber = plateNumber.trim();

    if (!cleanPlateNumber) {
      setError("Enter the vehicle's plate number.");
      return;
    }

    // -----------------------------
    // Validate vehicle model
    // -----------------------------
    const cleanVehicleModel = vehicleModel.trim();

    if (!cleanVehicleModel) {
      setError("Enter the vehicle model.");
      return;
    }

    // -----------------------------
    // Validate vehicle capacity
    // -----------------------------
    const vehicleCapacity = Number(capacity);

    if (
      !capacity.trim() ||
      !Number.isInteger(vehicleCapacity) ||
      vehicleCapacity < 1
    ) {
      setError("Vehicle capacity must be a whole number greater than 0.");
      return;
    }

    // -----------------------------
    // Validate category
    // -----------------------------
    if (!category) {
      setError("Select a vehicle category.");
      return;
    }

    // -----------------------------
    // Validate documents
    // -----------------------------
    if (!ownershipFile) {
      setError("Upload the vehicle ownership document.");
      return;
    }

    if (!licenseFile) {
      setError("Upload the vehicle license.");
      return;
    }

    if (!roadWorthinessFile) {
      setError("Upload the vehicle road worthiness document.");
      return;
    }

    try {
      // ========================================================
      // Save vehicle details + all 3 documents in ONE combined
      // multipart request.
      //
      // Confirmed required: the backend rejects PATCH /ride-drivers/vehicle
      // with "Ownership document, vehicle license, and roadworthiness
      // certificate are required" unless the files are attached to THIS
      // request — even immediately after uploading them separately to
      // their own endpoints, where they're already saved on the driver
      // record. So this combined call is the only shape that gets past
      // that check.
      //
      // KNOWN BACKEND ISSUE, not fixable here: vehicleCapacity is forced
      // to travel as a string inside this multipart body (FormData can't
      // carry a typed number). If the backend PATCH DTO doesn't coerce it
      // with something like @Type(() => Number), this call will still
      // fail with "vehicleCapacity must be an integer number" / min / max
      // messages even though the value is valid. That part needs a
      // backend fix.
      // ========================================================

      setIsUploadingDocuments(true);

      // TEMP DEBUG LOGGING — confirm what's about to be submitted.
      console.log("[VehicleInformationPage] submitting vehicleCapacity:", {
        rawInput: capacity,
        parsedValue: vehicleCapacity,
        type: typeof vehicleCapacity,
      });

      const detailsRes = await updateVehicle.mutateAsync({
        plateNumber: cleanPlateNumber,
        vehicleModel: cleanVehicleModel,
        vehicleCapacity,
        vehicleCategory: category.toLowerCase(),
        ownershipDocument: ownershipFile,
        vehicleLicense: licenseFile,
        roadworthinessCertificate: roadWorthinessFile,
      });

      if (detailsRes.tempToken) {
        localStorage.setItem("driverOnboardingToken", detailsRes.tempToken);
      }

      // ========================================================
      // Go to driver's license page
      // ========================================================

      navigate("/register/license", {
        state: {
          ...state,
          plateNumber: cleanPlateNumber,
          vehicleModel: cleanVehicleModel,
          vehicleCapacity,
          vehicleCategory: category,
        },
      });
    } catch (err) {
      console.error("[VehicleInformationPage] submission failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save vehicle information.",
      );
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  // ============================================================
  // STYLES
  // ============================================================

  const labelClass =
    "flex items-center gap-1.5 text-[clamp(10.5px,2.1dvh,12.5px)] font-medium text-gray-800";

  const fieldClass =
    "mt-[clamp(3px,1dvh,6px)] h-[clamp(38px,8.2dvh,46px)] w-full rounded-xl bg-[#f4f4f3] px-[clamp(10px,2.4dvh,13px)] text-[clamp(11.5px,2.3dvh,13.5px)] text-gray-800 outline-none placeholder:text-gray-400";

  const iconClass =
    "h-[clamp(13px,2.7dvh,16px)] w-[clamp(13px,2.7dvh,16px)] shrink-0 text-gray-400";

  // ============================================================
  // UPLOAD FIELD
  // ============================================================

  const UploadField = ({
    label,
    file,
    onChange,
  }: {
    label: string;
    file: File | null;
    onChange: (file: File | null) => void;
  }) => (
    <div>
      <label className={labelClass}>
        {label}
        <span className="text-red-500">*</span>

        <HelpCircle className="h-[clamp(12px,2.5dvh,14px)] w-[clamp(12px,2.5dvh,14px)] text-[#3b7ec2]" />
      </label>

      <label className="mt-[clamp(3px,1dvh,6px)] flex h-[clamp(38px,8.2dvh,46px)] w-full cursor-pointer overflow-hidden rounded-xl bg-[#f4f4f3]">
        <span className="flex items-center justify-center border-r border-gray-300 px-[clamp(9px,2.2dvh,16px)] text-[clamp(9.5px,2dvh,11.5px)] text-gray-600">
          Choose file
        </span>

        <span className="flex flex-1 items-center truncate px-[clamp(8px,1.8dvh,14px)] text-[clamp(9.5px,2dvh,11.5px)] text-gray-400">
          {file ? file.name : "No file chosen"}
        </span>

        <input
          type="file"
          accept=".doc,.docx,.png,.jpg,.jpeg,.pdf"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] ?? null;

            onChange(selectedFile);
            setError("");

            // Allows selecting the same file again.
            e.target.value = "";
          }}
        />
      </label>

      <p className="mt-[clamp(3px,1dvh,6px)] text-[clamp(9px,1.8dvh,11px)] text-gray-400">
        DOC, PNG, JPG or PDF (MAX. 8MB).
      </p>
    </div>
  );

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="font-outfit min-h-[100dvh] bg-white px-[clamp(16px,5vw,24px)] pb-[clamp(16px,4dvh,28px)] pt-[clamp(10px,2.6dvh,16px)]">
      <OnboardingProgress progress={50} />

      <h1 className="mt-[clamp(12px,3dvh,18px)] text-[clamp(17px,3.6dvh,21px)] font-bold leading-tight text-[#2b2b2b]">
        Vehicle Information
      </h1>

      <p className="mt-[clamp(2px,0.6dvh,4px)] text-[clamp(10.5px,2.1dvh,12.5px)] text-gray-400">
        Tell us about the vehicle you'll be using
      </p>

      <div className="mt-[clamp(8px,2.2dvh,14px)] space-y-[clamp(8px,2.2dvh,14px)]">
        {/* ================================================== */}
        {/* PLATE NUMBER */}
        {/* ================================================== */}

        <div>
          <label className={labelClass}>
            Plate Number
            <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            placeholder="e.g. ABC 123 ZY"
            value={plateNumber}
            onChange={(e) => {
              setPlateNumber(e.target.value);
              setError("");
            }}
            className={fieldClass}
          />
        </div>

        {/* ================================================== */}
        {/* VEHICLE MODEL */}
        {/* ================================================== */}

        <div>
          <label className={labelClass}>
            Vehicle Model
            <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            placeholder="e.g. Toyota Corolla, 2021"
            value={vehicleModel}
            onChange={(e) => {
              setVehicleModel(e.target.value);
              setError("");
            }}
            className={fieldClass}
          />
        </div>

        {/* ================================================== */}
        {/* VEHICLE CAPACITY */}
        {/* ================================================== */}

        <div>
          <label className={labelClass}>
            Vehicle Capacity
            <span className="text-red-500">*</span>
          </label>

          <input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            placeholder="e.g. 4"
            value={capacity}
            onChange={(e) => {
              const value = e.target.value;

              // Only allow whole numbers.
              if (/^\d*$/.test(value)) {
                setCapacity(value);
                setError("");
              }
            }}
            className={fieldClass}
          />
        </div>

        {/* ================================================== */}
        {/* VEHICLE CATEGORY */}
        {/* ================================================== */}

        <div>
          <label className={labelClass}>
            Vehicle Category
            <span className="text-red-500">*</span>
          </label>

          <button
            type="button"
            onClick={() => setShowCategorySheet(true)}
            className={`${fieldClass} flex items-center justify-between text-left`}
          >
            <span
              className={`truncate ${
                category ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {category ? CATEGORY_LABELS[category] : "Select vehicle category"}
            </span>

            <ChevronDown className={iconClass} />
          </button>
        </div>

        {/* ================================================== */}
        {/* OWNERSHIP */}
        {/* ================================================== */}

        <UploadField
          label="Upload Ownership Document"
          file={ownershipFile}
          onChange={setOwnershipFile}
        />

        {/* ================================================== */}
        {/* VEHICLE LICENSE */}
        {/* ================================================== */}

        <UploadField
          label="Upload Vehicle License"
          file={licenseFile}
          onChange={setLicenseFile}
        />

        {/* ================================================== */}
        {/* ROADWORTHINESS */}
        {/* ================================================== */}

        <UploadField
          label="Upload Vehicle Road Worthiness"
          file={roadWorthinessFile}
          onChange={setRoadWorthinessFile}
        />
      </div>

      {/* ==================================================== */}
      {/* ERROR */}
      {/* ==================================================== */}

      {error && (
        <p className="mt-[clamp(8px,2.2dvh,14px)] text-center text-[clamp(10.5px,2.1dvh,12.5px)] text-red-600">
          {error}
        </p>
      )}

      {/* ==================================================== */}
      {/* SUBMIT BUTTON */}
      {/* ==================================================== */}

      <button
        type="button"
        onClick={submit}
        disabled={isSubmitting}
        className="mt-[clamp(12px,3dvh,18px)] h-[clamp(42px,9dvh,50px)] w-full rounded-xl bg-[#6E43A3] text-[clamp(13px,2.7dvh,16px)] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-60"
      >
        {isSubmitting ? "Uploading..." : "Continue"}
      </button>

      {/* ==================================================== */}
      {/* CATEGORY PICKER */}
      {/* ==================================================== */}

      {showCategorySheet && (
        <VehicleCategoryPickerSheet
          initialValue={category || "Comfort"}
          onClose={() => setShowCategorySheet(false)}
          onSelect={(value) => {
            setCategory(value);
            setShowCategorySheet(false);
            setError("");
          }}
        />
      )}
    </div>
  );
}
