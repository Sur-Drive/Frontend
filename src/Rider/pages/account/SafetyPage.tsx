import { useState } from "react";
import { ChevronLeft, ChevronRight, Phone, KeyRound } from "lucide-react";
import EmergencyContactPage, {
  type EmergencyContact,
} from "./EmergencyContactPage";
import type { NewEmergencyContact } from "./AddContactPage";
import PickupCodePage from "./PickupCodePage";

type View = "home" | "emergency-contact" | "pickup-code";

export default function SafetyPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("home");
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [pickupCodeEnabled, setPickupCodeEnabled] = useState(false);

  const handleAddContact = (contact: NewEmergencyContact) => {
    setContacts((prev) => [...prev, { ...contact, id: `${Date.now()}` }]);
  };

  if (view === "emergency-contact") {
    return (
      <EmergencyContactPage
        onBack={() => setView("home")}
        contacts={contacts}
        onAddContact={handleAddContact}
      />
    );
  }

  if (view === "pickup-code") {
    return (
      <PickupCodePage
        onBack={() => setView("home")}
        enabled={pickupCodeEnabled}
        onChange={setPickupCodeEnabled}
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

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            Safety
          </h1>

          <div className="mt-6 divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            <button
              type="button"
              onClick={() => setView("emergency-contact")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <Phone size={18} className="text-[#4B5768]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#1F2937]">
                  Emergency contact
                </p>
                <p className="text-[13.5px] text-[#9AA5B8]">
                  {contacts.length === 0
                    ? "None Added"
                    : `${contacts.length} Added`}
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>

            <button
              type="button"
              onClick={() => setView("pickup-code")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <KeyRound size={18} className="text-[#4B5768]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#1F2937]">
                  Pick-up code
                </p>
                <p className="text-[13.5px] text-[#9AA5B8]">
                  {pickupCodeEnabled ? "On" : "Off"}
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
