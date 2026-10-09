import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus, X } from "lucide-react";
import AddBankAccountPage from "./AddBankAccountPage";
import {
  useDriverId,
  useDriverWallet,
  usePayoutAccounts,
  useRequestWithdrawal,
  useWalletTransactions,
} from "../../hooks/useFinance";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

type PayoutStatus = "Pending" | "Failed" | "Successful";

const STATUS_STYLES: Record<PayoutStatus, string> = {
  Pending: "text-[#E8A93E]",
  Failed: "text-[#E8542F]",
  Successful: "text-[#1E9E56]",
};

const BADGE_PALETTE = [
  { badgeBg: "#EFE6F7", badgeColor: "#6E43A3" },
  { badgeBg: "#FDF1DC", badgeColor: "#E8A93E" },
  { badgeBg: "#DCF5E4", badgeColor: "#1E9E56" },
];

type View = "wallet" | "add-account";

const initialsOf = (bank: string) =>
  bank
    .replace(/\(.*\)/g, "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "BK";

export default function WalletPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("wallet");
  const [showBalance, setShowBalance] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawDone, setWithdrawDone] = useState(false);

  const { id: driverId } = useDriverId();
  const wallet = useDriverWallet(driverId);
  const accountsQ = usePayoutAccounts(driverId);
  const txQ = useWalletTransactions(wallet.data?.id || undefined);
  const withdraw = useRequestWithdrawal();

  const accounts = useMemo(
    () =>
      (accountsQ.data ?? []).map((a, i) => ({
        ...a,
        ...(a.bank.toLowerCase().includes("guaranty") || a.bank.toLowerCase().includes("gt")
          ? { badgeBg: "#F15A22", badgeColor: "#FFFFFF" }
          : BADGE_PALETTE[i % BADGE_PALETTE.length]),
        badgeText: initialsOf(a.bank),
      })),
    [accountsQ.data],
  );

  // Preselect the default account (or the first one) once they load.
  useEffect(() => {
    if (!accounts.length) return;
    if (!accounts.some((a) => a.id === selectedAccountId)) {
      setSelectedAccountId((accounts.find((a) => a.isDefault) ?? accounts[0]).id);
    }
  }, [accounts, selectedAccountId]);

  const balance = wallet.data?.balance ?? 0;
  const pendingEarnings = wallet.data?.pending ?? 0;
  const transactions = txQ.data ?? [];
  const shownTx = showAll ? transactions : transactions.slice(0, 4);

  const paidThisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const d = new Date(t.dateRaw);
        return (
          t.isDebit &&
          t.status === "Successful" &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const amountNum = Number(amount);
  const canWithdraw =
    !!driverId && !!selectedAccount && amountNum > 0 && amountNum <= balance;

  const submitWithdrawal = () => {
    if (!canWithdraw || !driverId || !selectedAccount) return;
    setWithdrawError("");
    withdraw.mutate(
      {
        providerId: driverId,
        amount: amountNum,
        currency: wallet.data?.currency || "NGN",
        payoutAccountId: selectedAccount.id,
      },
      {
        onSuccess: () => {
          setWithdrawDone(true);
          setAmount("");
        },
        onError: (e) =>
          setWithdrawError((e as Error).message || "Withdrawal failed."),
      },
    );
  };

  const closeWithdraw = () => {
    setWithdrawOpen(false);
    setWithdrawDone(false);
    setWithdrawError("");
    setAmount("");
  };

  if (view === "add-account") {
    return (
      <AddBankAccountPage
        onBack={() => setView("wallet")}
        onAdded={() => undefined}
      />
    );
  }

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FA] px-5 pb-10 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <div className="mx-auto w-full max-w-xl">
          {/* header */}
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={onBack}
              className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
            >
              <ChevronLeft size={22} className="text-[#1F2937]" />
            </button>
            <h1 className="text-[17px] sm:text-[20px] font-bold text-[#1F2937]">Wallet</h1>
          </div>

          {/* balance card */}
          <div className="relative mt-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7B4FB0] to-[#4A2A73] px-6 py-6 shadow-sm">
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full border border-white/10"
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between">
              <p className="text-[12.5px] sm:text-[14px] text-white/70">Available Balance</p>
              <button
                type="button"
                onClick={() => setShowBalance((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <p className="relative mt-1.5 text-[26px] sm:text-[34px] font-extrabold tracking-tight text-white">
              {wallet.isLoading ? "…" : showBalance ? naira(balance) : "₦••••••"}
            </p>
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              disabled={!wallet.data || balance <= 0}
              className="relative mt-5 w-full rounded-2xl bg-white/25 disabled:opacity-50 py-3.5 text-[13px] sm:text-[15px] font-bold text-white backdrop-blur-sm transition active:scale-[0.99]"
            >
              Withdraw Now
            </button>
          </div>

          {wallet.isError && (
            <p className="mt-3 rounded-2xl bg-[#FDE8E8] px-4 py-3 text-[13px] text-[#E8542F]">
              {(wallet.error as Error)?.message}{" "}
              <button type="button" className="font-semibold underline" onClick={() => wallet.refetch()}>
                Retry
              </button>
            </p>
          )}

          {/* pending / paid */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-[12px] sm:text-[13px] text-[#9AA5B8]">Pending Earnings</p>
              <p className="mt-1.5 text-[17px] sm:text-xl font-extrabold text-[#1F2937]">
                {naira(pendingEarnings)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-[12px] sm:text-[13px] text-[#9AA5B8]">Paid This Month</p>
              <p className="mt-1.5 text-[17px] sm:text-xl font-extrabold text-[#1E9E56]">
                {naira(paidThisMonth)}
              </p>
            </div>
          </div>

          {/* payout account */}
          <h2 className="mb-3 mt-6 text-[15px] sm:text-lg font-bold text-[#1F2937]">
            Payout Account
          </h2>
          <div className="divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            {accountsQ.isLoading && (
              <p className="py-4 text-[13px] text-[#9AA5B8]">Loading accounts…</p>
            )}
            {accountsQ.isError && (
              <p className="py-4 text-[13px] text-[#E8542F]">
                {(accountsQ.error as Error)?.message}
              </p>
            )}
            {accounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => setSelectedAccountId(acc.id)}
                className="flex w-full items-center gap-3.5 py-4 text-left"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold"
                  style={{ background: acc.badgeBg, color: acc.badgeColor }}
                >
                  {acc.badgeText}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] sm:text-[15px] font-semibold text-[#1F2937]">
                    {acc.bank} ····{acc.last4}
                  </p>
                  <p className="truncate text-[12px] sm:text-[13px] text-[#6E43A3]">
                    {acc.holder}
                  </p>
                </div>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selectedAccountId === acc.id
                      ? "border-[#6E43A3]"
                      : "border-gray-300"
                  }`}
                >
                  {selectedAccountId === acc.id && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6E43A3]" />
                  )}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setView("add-account")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <Plus size={18} className="text-[#4B5768]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] sm:text-[15px] font-semibold text-[#1F2937]">
                  Add Bank Account
                </p>
                <p className="truncate text-[12px] sm:text-[13px] text-[#9AA5B8]">
                  Add your bank details for seamless payouts.
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>
          </div>

          {/* payout history */}
          <div className="mb-3 mt-6 flex items-center justify-between">
            <h2 className="text-[15px] sm:text-lg font-bold text-[#1F2937]">
              Payout History
            </h2>
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center gap-0.5 text-[12.5px] sm:text-[14px] font-semibold text-[#6E43A3]"
            >
              {showAll ? "Show less" : "View All"}
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            {txQ.isLoading && (
              <p className="py-4 text-[13px] text-[#9AA5B8]">Loading…</p>
            )}
            {txQ.isError && (
              <p className="py-4 text-[13px] text-[#E8542F]">
                {(txQ.error as Error)?.message}
              </p>
            )}
            {!txQ.isLoading && !txQ.isError && shownTx.length === 0 && (
              <p className="py-4 text-[13px] text-[#9AA5B8]">No transactions yet.</p>
            )}
            {shownTx.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] sm:text-[15px] font-semibold text-[#1F2937]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[12px] sm:text-[13px] text-[#9AA5B8]">
                    {item.date} ·{" "}
                    <span className={`font-medium ${STATUS_STYLES[item.status]}`}>
                      {item.status}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 text-[13px] sm:text-[15px] font-bold text-[#1F2937]">
                  {item.isDebit ? "-" : ""}
                  {naira(item.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {withdrawOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeWithdraw} />
          <div className="relative w-full max-w-md rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1F2937]">Withdraw</h2>
              <button
                type="button"
                onClick={closeWithdraw}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[#4B5768]"
              >
                <X size={16} />
              </button>
            </div>

            {withdrawDone ? (
              <>
                <p className="mt-6 text-center text-[15px] font-semibold text-[#1E9E56]">
                  Withdrawal requested successfully
                </p>
                <button
                  type="button"
                  onClick={closeWithdraw}
                  className="mt-6 w-full rounded-full bg-[#6E43A3] py-3.5 text-base font-bold text-white"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <p className="mt-4 text-[13px] text-[#9AA5B8]">
                  Available: {naira(balance)}
                  {selectedAccount
                    ? ` · to ${selectedAccount.bank} ····${selectedAccount.last4}`
                    : ""}
                </p>
                {!selectedAccount && (
                  <p className="mt-2 text-[13px] text-[#E8542F]">
                    Add a payout account first.
                  </p>
                )}
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (₦)"
                  className="mt-3 w-full rounded-xl bg-[#F1F2F5] px-4 py-3.5 text-[15px] text-[#1F2937] outline-none"
                />
                {amountNum > balance && (
                  <p className="mt-2 text-[13px] text-[#E8542F]">
                    Amount is more than your available balance.
                  </p>
                )}
                {withdrawError && (
                  <p className="mt-2 text-[13px] text-[#E8542F]">{withdrawError}</p>
                )}
                <button
                  type="button"
                  onClick={submitWithdrawal}
                  disabled={!canWithdraw || withdraw.isPending}
                  className="mt-5 w-full rounded-full bg-[#6E43A3] py-3.5 text-base font-bold text-white disabled:bg-[#D8D2E3]"
                >
                  {withdraw.isPending ? "Requesting..." : "Withdraw"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
