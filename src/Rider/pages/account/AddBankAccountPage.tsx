import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Landmark,
  CreditCard,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  X,
} from "lucide-react";
import BankPickerSheet from "../../components/BankPickerSheet";
import AccountTypePickerSheet, {
  type BankAccountType,
} from "../../components/AccountTypePickerSheet";

export interface AddedBankAccount {
  bank: string;
  accountType: BankAccountType;
  accountNumber: string;
  holder: string;
}

type LookupStatus = "idle" | "searching" | "resolved" | "error";

// Deterministic mock name-resolution so the same account number always
// resolves to the same "account holder" name, similar to a real
// name-enquiry lookup against a bank's records.
const MOCK_NAMES = [
  "Adebayo Lateef Abiodun",
  "Chiamaka Nwosu",
  "Ibrahim Musa Sani",
  "Folasade Ogunleye",
  "Emeka Obinna",
];

function resolveNameFor(accountNumber: string): string {
  let hash = 0;
  for (let i = 0; i < accountNumber.length; i++) {
    hash = (hash * 31 + accountNumber.charCodeAt(i)) % MOCK_NAMES.length;
  }
  return MOCK_NAMES[hash];
}

interface AddBankAccountPageProps {
  onBack: () => void;
  onAdded: (account: AddedBankAccount) => void;
}

export default function AddBankAccountPage({
  onBack,
  onAdded,
}: AddBankAccountPageProps) {
  const [bank, setBank] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<BankAccountType | null>(
    null,
  );
  const [accountNumber, setAccountNumber] = useState("");

  const [showBankSheet, setShowBankSheet] = useState(false);
  const [showTypeSheet, setShowTypeSheet] = useState(false);

  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const attemptRef = useRef(0);

  const isReady = Boolean(bank && accountType && accountNumber.length === 10);

  // Run the (mock) account-name lookup whenever all three fields are complete.
  useEffect(() => {
    if (!isReady) {
      setLookupStatus("idle");
      setResolvedName(null);
      return;
    }

    let cancelled = false;
    setLookupStatus("searching");
    setResolvedName(null);

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      // Mock: every 5th-ending account number simulates a transient
      // lookup failure so the error state is reachable, same as a real
      // name-enquiry call occasionally timing out.
      if (accountNumber.endsWith("0")) {
        setLookupStatus("error");
        return;
      }
      setResolvedName(resolveNameFor(accountNumber));
      setLookupStatus("resolved");
    }, 1100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank, accountType, accountNumber, isReady]);

  const handleAddAccount = () => {
    if (lookupStatus !== "resolved" || !bank || !accountType || !resolvedName)
      return;

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      attemptRef.current += 1;

      // First attempt mirrors a name-mismatch rejection from the payout
      // processor; retrying succeeds, matching the add-account flow.
      if (attemptRef.current === 1) {
        setShowFailModal(true);
        return;
      }

      onAdded({
        bank,
        accountType,
        accountNumber,
        holder: resolvedName,
      });
      setShowSuccessToast(true);
      window.setTimeout(() => {
        onBack();
      }, 1400);
    }, 1300);
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

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            Add Bank Account
          </h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#9AA5B8]">
            The account name must match your SUR-DRIVEHT account name.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {/* Select bank */}
            <button
              type="button"
              onClick={() => setShowBankSheet(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <Landmark size={16} className="text-[#6E43A3]" />
              </span>
              <span
                className={`flex-1 truncate text-[15px] ${
                  bank ? "font-semibold text-[#1F2937]" : "text-[#9AA5B8]"
                }`}
              >
                {bank ?? "Select bank"}
              </span>
              <ChevronDown size={18} className="shrink-0 text-[#9AA5B8]" />
            </button>

            {/* Select account type */}
            <button
              type="button"
              onClick={() => setShowTypeSheet(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <CreditCard size={16} className="text-[#6E43A3]" />
              </span>
              <span
                className={`flex-1 truncate text-[15px] ${
                  accountType
                    ? "font-semibold text-[#1F2937]"
                    : "text-[#9AA5B8]"
                }`}
              >
                {accountType ?? "Select account type"}
              </span>
              <ChevronDown size={18} className="shrink-0 text-[#9AA5B8]" />
            </button>

            {/* Account number */}
            <div className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <Hash size={16} className="text-[#6E43A3]" />
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter account number"
                className="w-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#1F2937] outline-none placeholder:font-normal placeholder:text-[#9AA5B8]"
              />
            </div>

            {/* Lookup state */}
            {lookupStatus === "searching" && (
              <div className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4">
                <Loader2
                  size={18}
                  className="shrink-0 animate-spin text-[#9AA5B8]"
                />
                <span className="text-[15px] text-[#9AA5B8]">Searching</span>
              </div>
            )}

            {lookupStatus === "error" && (
              <div className="flex w-full items-center gap-3 rounded-2xl bg-[#FDE8E8] px-4 py-4">
                <AlertCircle
                  size={18}
                  className="shrink-0 text-[#E8542F]"
                />
                <span className="text-[15px] font-medium text-[#E8542F]">
                  Unable to fetch account details
                </span>
              </div>
            )}

            {lookupStatus === "resolved" && resolvedName && (
              <div className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4">
                <CheckCircle2
                  size={18}
                  className="shrink-0 text-[#1E9E56]"
                />
                <span className="text-[15px] font-semibold text-[#1F2937]">
                  {resolvedName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="absolute inset-x-0 bottom-0 bg-white px-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            disabled={lookupStatus !== "resolved"}
            onClick={handleAddAccount}
            className="h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#D8D2E3] disabled:shadow-none"
          >
            Add Account
          </button>
        </div>
      </div>

      {/* Success toast */}
      {showSuccessToast && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+92px)] flex justify-center px-6">
          <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2.5 rounded-2xl bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DCF5E4]">
              <CheckCircle2 size={14} className="text-[#1E9E56]" />
            </span>
            <span className="flex-1 text-[14px] font-medium text-[#1F2937]">
              Bank account successfully added
            </span>
            <button
              type="button"
              onClick={() => setShowSuccessToast(false)}
              className="shrink-0 text-[#9AA5B8]"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Submitting overlay */}
      {submitting && (
        <div className="absolute inset-0 z-[75] flex items-center justify-center bg-black/10">
          <Loader2 size={40} className="animate-spin text-white" />
        </div>
      )}

      {/* Failure modal */}
      {showFailModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-[28px] bg-white px-6 py-8 text-center shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FCE0DD]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0523A]">
                <XCircle size={28} className="text-white" />
              </span>
            </div>
            <h3 className="mt-5 text-xl font-bold text-[#1F2937]">
              Unable to add account
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#6B7280]">
              The bank account name must match your SUR-DRIVEHT profile name.
              Please check your details and try again.
            </p>
            <button
              type="button"
              onClick={() => setShowFailModal(false)}
              className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] text-[15px] font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {showBankSheet && (
        <BankPickerSheet
          initialValue={bank ?? undefined}
          onClose={() => setShowBankSheet(false)}
          onSelect={(value) => {
            setBank(value);
            setShowBankSheet(false);
          }}
        />
      )}

      {showTypeSheet && (
        <AccountTypePickerSheet
          initialValue={accountType ?? undefined}
          onClose={() => setShowTypeSheet(false)}
          onSelect={(value) => {
            setAccountType(value);
            setShowTypeSheet(false);
          }}
        />
      )}
    </div>
  );
}
