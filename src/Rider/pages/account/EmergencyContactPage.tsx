import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AddContactPage, { type NewEmergencyContact } from "./AddContactPage";

export interface EmergencyContact extends NewEmergencyContact {
  id: string;
}

const AVATAR_PALETTE = [
  { bg: "#EFE6F7", color: "#6E43A3" },
  { bg: "#FDF1DC", color: "#E8A93E" },
  { bg: "#DCF5E4", color: "#1E9E56" },
  { bg: "#EAF0F6", color: "#0072BC" },
];

type View = "list" | "add";

interface EmergencyContactPageProps {
  onBack: () => void;
  contacts: EmergencyContact[];
  onAddContact: (contact: NewEmergencyContact) => void;
}

export default function EmergencyContactPage({
  onBack,
  contacts,
  onAddContact,
}: EmergencyContactPageProps) {
  const [view, setView] = useState<View>("list");

  const handleAdded = (contact: NewEmergencyContact) => {
    onAddContact(contact);
    setView("list");
  };

  if (view === "add") {
    return (
      <AddContactPage onBack={() => setView("list")} onAdded={handleAdded} />
    );
  }

  if (contacts.length === 0) {
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
              Emergency contact
            </h1>

            <div className="mt-24 flex flex-col items-center px-4 text-center">
              <svg
                width="88"
                height="88"
                viewBox="0 0 88 88"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 30c0-4.4 3.6-8 8-8h2.2c1.4 0 2.6.9 3 2.2l2.6 8a3.2 3.2 0 0 1-.9 3.3l-4 3.6a26 26 0 0 0 11.9 11.9l3.6-4a3.2 3.2 0 0 1 3.3-.9l8 2.6c1.3.4 2.2 1.6 2.2 3V54c0 4.4-3.6 8-8 8h-2C34.7 62 22 49.3 22 34v-4Z"
                  stroke="#9698c2"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="63"
                  cy="25"
                  r="12"
                  fill="white"
                  stroke="#9698c2"
                  strokeWidth="3.2"
                />
                <path
                  d="M63 20v10M58 25h10"
                  stroke="#9698c2"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>

              <p className="mt-6 text-[19px] font-bold text-[#1F2937]">
                No contacts added
              </p>
              <p className="mt-2 max-w-[280px] text-[14.5px] leading-relaxed text-[#9AA5B8]">
                for your security add at least one person that we can call in
                an emergency
              </p>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-white px-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3">
          <div className="mx-auto w-full max-w-xl">
            <button
              type="button"
              onClick={() => setView("add")}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#6E43A3] text-[16px] font-bold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
            >
              <Plus size={18} />
              Add contact
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Emergency contact
          </h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#9AA5B8]">
            In an emergency, Sur Drive may contact your emergency contact if
            we're unable to reach you.
          </p>

          <div className="mt-6 divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            {contacts.map((c, i) => {
              const palette = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
              return (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center gap-3.5 py-4 text-left"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[16px] font-bold"
                    style={{ background: palette.bg, color: palette.color }}
                  >
                    {c.name.trim()[0]?.toUpperCase() ?? "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15.5px] font-semibold text-[#1F2937]">
                      {c.name}
                    </p>
                    <p className="truncate text-[13.5px] text-[#6E43A3]">
                      +234 {c.phone} · {c.relationship}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-[#C7CCD6]"
                  />
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setView("add")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <Plus size={18} className="text-[#4B5768]" />
              </span>
              <span className="flex-1 text-[15px] font-semibold text-[#1F2937]">
                Add contact
              </span>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-white px-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={() => setView("add")}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#6E43A3] text-[16px] font-bold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
          >
            <Plus size={18} />
            Add contact
          </button>
        </div>
      </div>
    </div>
  );
}
