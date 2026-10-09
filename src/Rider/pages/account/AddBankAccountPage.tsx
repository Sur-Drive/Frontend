import { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Landmark,
  Hash,
  CheckCircle2,
  Loader2,
  XCircle,
  X,
} from "lucide-react";
import BankPickerSheet from "../../components/BankPickerSheet";
import {
  useAddPayoutAccount,
  useDriverId,
  usePayoutBanks,
} from "../../hooks/useFinance";

export interface AddedBankAccount {
  bank: string;
  accountNumber: string;
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
  const [accountNumber, setAccountNumber] = useState("");
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [failMessage, setFailMessage] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const { id: providerId, error: profileError } = useDriverId();
  const { data: banks = [], isLoading: banksLoading, isError: banksError } =
    usePayoutBanks();
  const add = useAddPayoutAccount();

  const selectedBank = banks.find((b) => b.name === bank);
  const isReady = Boolean(selectedBank && accountNumber.length === 10 && providerId);

  // Why the button is disabled, shown under the form.
  const blocker = !selectedBank
    ? banksLoading
      ? "Loading banks…"
      : "Select a bank"
    : accountNumber.length !== 10
      ? `Enter the 10-digit account number (${accountNumber.length}/10)`
      : !providerId && profileError
        ? profileError.message
        : !providerId
        ? "Couldn't find your driver id from your profile. Sign in again or check the [finance] driver id log."
        : "";

  const handleAddAccount = () => {
    if (!isReady || !selectedBank || !providerId) return;
    add.mutate(
      {
        providerId,
        bankCode: selectedBank.code,
        accountNumber,
        bankName: selectedBank.name,
        makeDefault: true,
      },
      {
        onSuccess: () => {
          onAdded({ bank: selectedBank.name, accountNumber });
          setShowSuccessToast(true);
          window.setTimeout(onBack, 1400);
        },
        onError: (e) =>
          setFailMessage(
            (e as Error).message ||
              "The bank account name must match your SUR-DRIVEHT profile name. Please check your details and try again.",
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

          <h1 className="mt-6 text-xl sm:text-2xl font-bold text-[#1F2937]">
            Add Bank Account
          </h1>
          <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-[#9AA5B8]">
            The account name must match your SUR-DRIVEHT account name.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {/* Select bank */}
            <button
              type="button"
              onClick={() => banks.length && setShowBankSheet(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-4 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE6F7]">
                <Landmark size={16} className="text-[#6E43A3]" />
              </span>
              <span
                className={`flex-1 truncate text-sm sm:text-base ${
                  bank ? "font-semibold text-[#1F2937]" : "text-[#9AA5B8]"
                }`}
              >
                {banksLoading ? "Loading banks…" : (bank ?? "Select bank")}
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
                className="w-full min-w-0 flex-1 bg-transparent text-base font-semibold text-[#1F2937] outline-none placeholder:font-normal placeholder:text-[#9AA5B8]"
              />
            </div>

            {blocker && (
              <p className="px-1 text-sm text-[#9AA5B8]">{blocker}</p>
            )}
            {banksError && (
              <p className="px-1 text-sm text-[#E8542F]">
                Couldn't load banks. Check your connection and reopen this page.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="absolute inset-x-0 bottom-0 bg-white px-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            disabled={!isReady || add.isPending}
            onClick={handleAddAccount}
            className="h-14 w-full rounded-2xl bg-[#6E43A3] text-base sm:text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#D8D2E3] disabled:shadow-none"
          >
            {add.isPending ? "Adding..." : "Add Account"}
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
            <span className="flex-1 text-xs sm:text-sm font-medium text-[#1F2937]">
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
      {add.isPending && (
        <div className="absolute inset-0 z-[75] flex items-center justify-center bg-black/10">
          <Loader2 size={40} className="animate-spin text-white" />
        </div>
      )}

      {/* Failure modal */}
      {failMessage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-[28px] bg-white px-6 py-8 text-center shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FCE0DD]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0523A]">
                <XCircle size={28} className="text-white" />
              </span>
            </div>
            <h3 className="mt-5 text-lg sm:text-xl font-bold text-[#1F2937]">
              Unable to add account
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6B7280]">
              {failMessage}
            </p>
            <button
              type="button"
              onClick={() => setFailMessage("")}
              className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] text-sm sm:text-base font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {showBankSheet && (
        <BankPickerSheet
          banks={banks.map((b) => b.name)}
          initialValue={bank ?? undefined}
          onClose={() => setShowBankSheet(false)}
          onSelect={(value) => {
            setBank(value);
            setShowBankSheet(false);
          }}
        />
      )}

    </div>
  );
}
