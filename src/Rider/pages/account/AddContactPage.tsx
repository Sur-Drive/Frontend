import { useState } from "react";
import { ChevronLeft, ChevronDown, User, UserPlus2 } from "lucide-react";
import RelationshipPickerSheet, {
  relationshipToApi,
} from "../../components/RelationshipPickerSheet";
import ToggleSwitch from "../../components/ToggleSwitch";
import { toE164 } from "../../api/emergencyContacts";
import { useAddRideDriverEmergencyContact } from "../../hooks/useEmergencyContacts";

interface AddContactPageProps {
  onBack: () => void;
  onAdded: () => void;
  /** First contact is made primary by default. */
  isFirstContact?: boolean;
}

export default function AddContactPage({
  onBack,
  onAdded,
  isFirstContact = false,
}: AddContactPageProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState<string | null>(null);
  const [showRelationshipSheet, setShowRelationshipSheet] = useState(false);
  const [isPrimary, setIsPrimary] = useState(isFirstContact);
  const [notifyOnRideStart, setNotifyOnRideStart] = useState(false);
  const [error, setError] = useState("");

  const { mutate: addContact, isPending } = useAddRideDriverEmergencyContact();

  const isValid =
    name.trim().length > 0 &&
    phone.replace(/\D/g, "").length >= 10 &&
    Boolean(relationship);

  // POST /ride-drivers/emergency-contacts
  const submit = () => {
    if (!isValid || !relationship || isPending) return;
    setError("");
    addContact(
      {
        name: name.trim(),
        phoneNumber: toE164(phone),
        relationship: relationshipToApi(relationship),
        isPrimary,
        notifyOnRideStart,
      },
      {
        onSuccess: onAdded,
        onError: (err: unknown) =>
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't add this contact. Please try again.",
          ),
      },
    );
  };

  return (
    <div className="font-outfit relative flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-32 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[22px] sm:text-[28px] font-bold text-[#1F2937]">
            Add contact
          </h1>

          <div className="mt-6 flex flex-col gap-3">
            {/* Full name */}
            <div className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <User size={16} className="text-[#6E43A3]" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Full Name"
                className="w-full min-w-0 flex-1 bg-transparent text-[13px] sm:text-[15px] font-semibold text-[#1F2937] outline-none placeholder:font-normal placeholder:text-[#9AA5B8]"
              />
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="flex h-[60px] shrink-0 items-center gap-2 rounded-2xl bg-[#F5F5F7] px-4">
                <span className="text-sm sm:text-base leading-none">🇳🇬</span>
                <span className="text-[13px] sm:text-[15px] font-semibold text-[#1F2937]">
                  +234
                </span>
              </div>
              <div className="flex h-[60px] w-full min-w-0 flex-1 items-center rounded-2xl bg-[#F5F5F7] px-4">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^\d\s]/g, ""))
                  }
                  placeholder="803 660 0027"
                  className="w-full min-w-0 flex-1 bg-transparent text-[13px] sm:text-[15px] font-semibold text-[#1F2937] outline-none placeholder:font-normal placeholder:text-[#9AA5B8]"
                />
              </div>
            </div>

            {/* Relationship */}
            <button
              type="button"
              onClick={() => setShowRelationshipSheet(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <UserPlus2 size={16} className="text-[#6E43A3]" />
              </span>
              <span
                className={`flex-1 truncate text-[13px] sm:text-[15px] ${
                  relationship
                    ? "font-semibold text-[#1F2937]"
                    : "text-[#9AA5B8]"
                }`}
              >
                {relationship ?? "Select Relationship"}
              </span>
              <ChevronDown size={18} className="shrink-0 text-[#9AA5B8]" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-gray-100 rounded-2xl bg-[#F5F5F7] px-4">
            <div className="flex items-center justify-between gap-3 py-3.5">
              <span className="text-[13px] sm:text-[15px] font-medium text-[#1F2937]">
                Primary contact
              </span>
              <ToggleSwitch
                checked={isPrimary}
                onChange={setIsPrimary}
                ariaLabel="Primary contact"
              />
            </div>
            <div className="flex items-center justify-between gap-3 py-3.5">
              <span className="text-[13px] sm:text-[15px] font-medium text-[#1F2937]">
                Notify when a ride starts
              </span>
              <ToggleSwitch
                checked={notifyOnRideStart}
                onChange={setNotifyOnRideStart}
                ariaLabel="Notify when a ride starts"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-[13px] sm:text-sm text-red-500">{error}</p>}

          <p className="mt-4 text-[12px] sm:text-[13.5px] leading-relaxed text-[#9AA5B8]">
            By adding a trusted contact, you confirm they know you've
            provided their details to Sur Drive. We may contact them in an
            emergency if you're unreachable. For more information, please
            see the Sur Drive.{" "}
            <button
              type="button"
              className="font-medium text-[#6E43A3] underline"
            >
              Privacy Policy.
            </button>
          </p>
        </div>
      </div>

      {/* Bottom action */}
      <div className="absolute inset-x-0 bottom-0 bg-white px-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={submit}
            disabled={!isValid || isPending}
            className="h-14 w-full rounded-2xl bg-[#6E43A3] text-[15px] sm:text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Add contact"}
          </button>
        </div>
      </div>

      {showRelationshipSheet && (
        <RelationshipPickerSheet
          initialValue={relationship ?? undefined}
          onClose={() => setShowRelationshipSheet(false)}
          onSelect={(value) => {
            setRelationship(value);
            setShowRelationshipSheet(false);
          }}
        />
      )}
    </div>
  );
}
