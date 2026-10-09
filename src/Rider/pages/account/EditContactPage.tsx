import { useState } from "react";
import { ChevronLeft, Phone, Trash2, User, UserPlus2 } from "lucide-react";
import ToggleSwitch from "../../components/ToggleSwitch";
import { relationshipLabel } from "../../components/RelationshipPickerSheet";
import type { RideDriverEmergencyContact } from "../../api/emergencyContacts";
import {
  useDeleteRideDriverEmergencyContact,
  useUpdateRideDriverEmergencyContact,
} from "../../hooks/useEmergencyContacts";

interface EditContactPageProps {
  contact: RideDriverEmergencyContact;
  onBack: () => void;
  /** Called after a successful save or delete. */
  onDone: () => void;
}

export default function EditContactPage({
  contact,
  onBack,
  onDone,
}: EditContactPageProps) {
  const [name, setName] = useState(contact.name);
  const [isPrimary, setIsPrimary] = useState(contact.isPrimary);
  const [notifyOnRideStart, setNotifyOnRideStart] = useState(
    contact.notifyOnRideStart,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const { mutate: updateContact, isPending: isSaving } =
    useUpdateRideDriverEmergencyContact();
  const { mutate: deleteContact, isPending: isDeleting } =
    useDeleteRideDriverEmergencyContact();

  const busy = isSaving || isDeleting;
  const isValid = name.trim().length > 0;

  // PATCH /ride-drivers/emergency-contacts/:contactId
  const save = () => {
    if (!isValid || busy) return;
    setError("");
    updateContact(
      {
        contactId: contact.id,
        name: name.trim(),
        isPrimary,
        notifyOnRideStart,
      },
      {
        onSuccess: onDone,
        onError: (err: unknown) =>
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't save your changes. Please try again.",
          ),
      },
    );
  };

  // DELETE /ride-drivers/emergency-contacts/:contactId
  const remove = () => {
    if (busy) return;
    setError("");
    deleteContact(contact.id, {
      onSuccess: onDone,
      onError: (err: unknown) => {
        setConfirmDelete(false);
        setError(
          err instanceof Error
            ? err.message
            : "Couldn't delete this contact. Please try again.",
        );
      },
    });
  };

  return (
    <div className="font-outfit relative flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-40 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[22px] sm:text-[28px] font-bold text-[#1F2937]">
            Edit contact
          </h1>

          <div className="mt-6 flex flex-col gap-3">
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

            {/* Phone and relationship can't be edited by the API */}
            <div className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4 opacity-70">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <Phone size={16} className="text-[#6E43A3]" />
              </span>
              <span className="text-[13px] sm:text-[15px] font-semibold text-[#1F2937]">
                {contact.phoneNumber || "—"}
              </span>
            </div>

            <div className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4 opacity-70">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <UserPlus2 size={16} className="text-[#6E43A3]" />
              </span>
              <span className="text-[13px] sm:text-[15px] font-semibold text-[#1F2937]">
                {relationshipLabel(contact.relationship) || "—"}
              </span>
            </div>
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

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="mt-6 flex items-center gap-2 text-[13px] sm:text-[15px] font-semibold text-red-500 disabled:opacity-50"
          >
            <Trash2 size={17} />
            Delete contact
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-white px-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={save}
            disabled={!isValid || busy}
            className="h-14 w-full rounded-2xl bg-[#6E43A3] text-[15px] sm:text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-7 text-center shadow-2xl">
            <h2 className="text-[17px] sm:text-xl font-bold text-[#2b2b2b]">
              Delete contact?
            </h2>
            <p className="mt-2 text-[13px] sm:text-sm leading-relaxed text-gray-500">
              {contact.name} will be removed from your emergency contacts.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
                className="h-12 flex-1 rounded-2xl bg-gray-100 text-[13px] sm:text-[15px] font-semibold text-[#1F2937]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={isDeleting}
                className="h-12 flex-1 rounded-2xl bg-red-500 text-[13px] sm:text-[15px] font-semibold text-white disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
