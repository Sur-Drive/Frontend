import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AddContactPage from "./AddContactPage";
import EditContactPage from "./EditContactPage";
import { relationshipLabel } from "../../components/RelationshipPickerSheet";
import type { RideDriverEmergencyContact } from "../../api/emergencyContacts";
import { useRideDriverEmergencyContacts } from "../../hooks/useEmergencyContacts";

const AVATAR_PALETTE = [
  { bg: "#EFE6F7", color: "#6E43A3" },
  { bg: "#FDF1DC", color: "#E8A93E" },
  { bg: "#DCF5E4", color: "#1E9E56" },
  { bg: "#EAF0F6", color: "#0072BC" },
];

type View = "list" | "add" | "edit";

export default function EmergencyContactPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<RideDriverEmergencyContact | null>(
    null,
  );

  // GET /ride-drivers/emergency-contacts
  const { data, isLoading, error, refetch } = useRideDriverEmergencyContacts();
  const contacts = data ?? [];

  if (view === "add") {
    return (
      <AddContactPage
        isFirstContact={contacts.length === 0}
        onBack={() => setView("list")}
        onAdded={() => setView("list")}
      />
    );
  }

  if (view === "edit" && selected) {
    return (
      <EditContactPage
        contact={selected}
        onBack={() => setView("list")}
        onDone={() => {
          setSelected(null);
          setView("list");
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white px-6 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>
          <h1 className="mt-6 text-xl sm:text-2xl font-bold text-[#1F2937]">
            Emergency contact
          </h1>
          <div className="mt-24 flex justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-[#6E43A3]" />
          </div>
        </div>
      </div>
    );
  }

  if (error && contacts.length === 0) {
    return (
      <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white px-6 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>
          <h1 className="mt-6 text-xl sm:text-2xl font-bold text-[#1F2937]">
            Emergency contact
          </h1>
          <div className="mt-16 rounded-2xl bg-gray-50 p-5 text-center">
            <p className="text-sm sm:text-base text-[#4B5768]">
              {error instanceof Error
                ? error.message
                : "Couldn't load your emergency contacts."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-full bg-[#1F2937] px-5 py-2 text-xs sm:text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
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

            <h1 className="mt-6 text-xl sm:text-2xl font-bold text-[#1F2937]">
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

              <p className="mt-6 text-base sm:text-lg font-bold text-[#1F2937]">
                No contacts added
              </p>
              <p className="mt-2 max-w-[280px] text-xs sm:text-sm leading-relaxed text-[#9AA5B8]">
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
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#6E43A3] text-sm sm:text-base font-bold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
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

          <h1 className="mt-6 text-xl sm:text-2xl font-bold text-[#1F2937]">
            Emergency contact
          </h1>
          <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-[#9AA5B8]">
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
                  onClick={() => {
                    setSelected(c);
                    setView("edit");
                  }}
                  className="flex w-full items-center gap-3.5 py-4 text-left"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm sm:text-base font-bold"
                    style={{ background: palette.bg, color: palette.color }}
                  >
                    {c.name.trim()[0]?.toUpperCase() ?? "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm sm:text-base font-semibold text-[#1F2937]">
                      <span className="truncate">{c.name}</span>
                      {c.isPrimary && (
                        <span className="shrink-0 rounded-full bg-[#EFE6F7] px-2 py-0.5 text-xs font-semibold text-[#6E43A3]">
                          Primary
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs sm:text-sm text-[#6E43A3]">
                      {c.phoneNumber} · {relationshipLabel(c.relationship)}
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
              <span className="flex-1 text-sm sm:text-base font-semibold text-[#1F2937]">
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
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#6E43A3] text-sm sm:text-base font-bold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
          >
            <Plus size={18} />
            Add contact
          </button>
        </div>
      </div>
    </div>
  );
}
