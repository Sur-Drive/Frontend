import { useState } from "react";
import { ChevronLeft, ChevronDown, User, UserPlus2 } from "lucide-react";
import RelationshipPickerSheet from "../../components/RelationshipPickerSheet";

export interface NewEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface AddContactPageProps {
  onBack: () => void;
  onAdded: (contact: NewEmergencyContact) => void;
}

export default function AddContactPage({
  onBack,
  onAdded,
}: AddContactPageProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState<string | null>(null);
  const [showRelationshipSheet, setShowRelationshipSheet] = useState(false);

  const isValid =
    name.trim().length > 0 && phone.trim().length >= 7 && Boolean(relationship);

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

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
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
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#1F2937] outline-none placeholder:font-normal placeholder:text-[#9AA5B8]"
              />
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="flex h-[60px] shrink-0 items-center gap-2 rounded-2xl bg-[#F5F5F7] px-4">
                <span className="text-base leading-none">🇳🇬</span>
                <span className="text-[15px] font-semibold text-[#1F2937]">
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
                  className="w-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#1F2937] outline-none placeholder:font-normal placeholder:text-[#9AA5B8]"
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
                className={`flex-1 truncate text-[15px] ${
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

          <p className="mt-4 text-[13.5px] leading-relaxed text-[#9AA5B8]">
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
            onClick={() => {
              if (!isValid || !relationship) return;
              onAdded({ name: name.trim(), phone: phone.trim(), relationship });
            }}
            className="h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
          >
            Add contact
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
