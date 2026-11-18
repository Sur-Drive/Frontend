import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus, X } from "lucide-react";
import AddBankAccountPage from "./AddBankAccountPage";
import {
  useAwaitingWithdrawals,
  useCancelAwaitingWithdrawal,
  useDriverId,
  useDriverWallet,
  useFinancePushRefresh,
  usePayoutAccounts,
  useRequestWithdrawal,
  useReverifyPayoutAccount,
  useWithdrawal,
  useWithdrawalHistory,
  useWithdrawalLimits,
} from "../../hooks/useFinance";
import {
  classifyWithdrawError,
  type PayoutItem,
  type PayoutStatus,
} from "../../lib/financeMap";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const STATUS_STYLES: Record<PayoutStatus, string> = {
  "Awaiting approval": "text-[#6E43A3]",
  Processing: "text-[#E8A93E]",
  Failed: "text-[#E8542F]",
  Paid: "text-[#1E9E56]",
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

export default function WalletPage({
  onBack,
  onContactSupport,
}: {
  onBack: () => void;
  onContactSupport?: () => void;
}) {
  const [view, setView] = useState<View>("wallet");
  const [showBalance, setShowBalance] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawDone, setWithdrawDone] = useState<null | "awaiting_approval" | "automatic">(null);
  const [cancelError, setCancelError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const { id: driverId } = useDriverId();
  const wallet = useDriverWallet();
  const limitsQ = useWithdrawalLimits();
  const accountsQ = usePayoutAccounts(driverId);
  const awaitingQ = useAwaitingWithdrawals(driverId);
  const historyQ = useWithdrawalHistory(driverId);
  const withdraw = useRequestWithdrawal();
  const cancel = useCancelAwaitingWithdrawal();
  const reverify = useReverifyPayoutAccount();

  // Push / focus -> refetch money state (never rely on push alone).
  useFinancePushRefresh();

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
  const verifiedAccounts = accounts.filter((a) => a.status === "verified");

  // Preselect the default VERIFIED account (or the first verified one).
  useEffect(() => {
    if (!verifiedAccounts.length) {
      if (selectedAccountId) setSelectedAccountId("");
      return;
    }
    if (!verifiedAccounts.some((a) => a.id === selectedAccountId)) {
      setSelectedAccountId(
        (verifiedAccounts.find((a) => a.isDefault) ?? verifiedAccounts[0]).id,
      );
    }
  }, [verifiedAccounts, selectedAccountId]);

  const balance = wallet.data?.balance ?? 0;
  const pendingWithdrawal = wallet.data?.pendingWithdrawal ?? 0;
  const debt = wallet.data?.outstandingDebt ?? 0;

  const limits = limitsQ.data;
  const minAmount = limits?.minAmount ?? 1;
  // Max = the smaller of withdrawable balance and the per-request limit (null = none).
  const maxAmount =
    limits?.maxAmount != null ? Math.min(balance, limits.maxAmount) : balance;

  const awaiting = awaitingQ.data ?? [];
  const history = historyQ.data ?? [];
  const shownHistory = showAll ? history : history.slice(0, 4);

  const selectedAccount = verifiedAccounts.find((a) => a.id === selectedAccountId);
  const amountNum = Number(amount);
  const amountError =
    amount === ""
      ? ""
      : amountNum < minAmount
        ? `Minimum withdrawal is ${naira(minAmount)}.`
        : amountNum > balance
          ? "Amount is more than your available balance."
          : limits?.maxAmount != null && amountNum > limits.maxAmount
            ? `Withdrawals are limited to ${naira(limits.maxAmount)} per request.`
            : "";
  const canWithdraw =
    !!driverId &&
    !!selectedAccount &&
    amountNum >= minAmount &&
    amountNum <= maxAmount &&
    !amountError;

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
        // Branch on the response status, never on the server's configuration.
        onSuccess: (r) => {
          setWithdrawDone(r.mode);
          setAmount("");
        },
        onError: (e) =>
          setWithdrawError((e as Error).message || "Withdrawal failed."),
      },
    );
  };

  const closeWithdraw = () => {
    setWithdrawOpen(false);
    setWithdrawDone(null);
    setWithdrawError("");
    setAmount("");
  };

  const cancelRequest = (settlementId: string) => {
    setCancelError("");
    cancel.mutate(settlementId, {
      onError: (e) => {
        const status = (e as Error & { status?: number }).status;
        setCancelError(
          status === 409
            ? "This request can no longer be cancelled. It has already been reviewed."
            : (e as Error).message || "Couldn't cancel the request.",
        );
      },
    });
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
            <h1 className="text-lg sm:text-xl font-bold text-[#1F2937]">Wallet</h1>
          </div>

          {/* balance card */}
          <div className="relative mt-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7B4FB0] to-[#4A2A73] px-6 py-6 shadow-sm">
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full border border-white/10"
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between">
              <p className="text-xs sm:text-sm text-white/70">Available to withdraw</p>
              <button
                type="button"
                onClick={() => setShowBalance((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <p className="relative mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {wallet.isLoading ? "…" : showBalance ? naira(balance) : "₦••••••"}
            </p>
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              disabled={!wallet.data || balance <= 0 || !verifiedAccounts.length}
              className="relative mt-5 w-full rounded-2xl bg-white/25 disabled:opacity-50 py-3.5 text-sm sm:text-base font-bold text-white backdrop-blur-sm transition active:scale-[0.99]"
            >
              Withdraw Now
            </button>
            {!!accountsQ.data && !verifiedAccounts.length && (
              <p className="relative mt-2 text-center text-xs text-white/80">
                Add and verify a payout account to withdraw.
              </p>
            )}
          </div>

          {/* outstanding debt: show prominently */}
          {debt > 0 && (
            <div className="mt-3 rounded-2xl border border-[#F5C2BA] bg-[#FDE8E8] px-4 py-3.5">
              <p className="text-sm font-bold text-[#E8542F]">
                Outstanding balance: {naira(debt)}
              </p>
              <p className="mt-0.5 text-xs text-[#B4472B]">
                Commission owed on cash rides. Contact support if this looks wrong.
              </p>
            </div>
          )}

          {wallet.isError && (
            <p className="mt-3 rounded-2xl bg-[#FDE8E8] px-4 py-3 text-sm text-[#E8542F]">
              {(wallet.error as Error)?.message}{" "}
              <button type="button" className="font-semibold underline" onClick={() => wallet.refetch()}>
                Retry
              </button>
            </p>
          )}

          {/* reserved / withdrawn */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-[#9AA5B8]">Pending withdrawals</p>
              <p className="mt-1.5 text-lg sm:text-xl font-extrabold text-[#1F2937]">
                {naira(pendingWithdrawal)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-[#9AA5B8]">Total withdrawn</p>
              <p className="mt-1.5 text-lg sm:text-xl font-extrabold text-[#1E9E56]">
                {naira(wallet.data?.totalWithdrawn ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-[#9AA5B8]">Cash earned</p>
              <p className="mt-1.5 text-lg sm:text-xl font-extrabold text-[#1F2937]">
                {naira(wallet.data?.cashEarned ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-[#9AA5B8]">Total earned</p>
              <p className="mt-1.5 text-lg sm:text-xl font-extrabold text-[#1F2937]">
                {naira(wallet.data?.totalEarned ?? 0)}
              </p>
            </div>
          </div>

          {/* awaiting approval */}
          {(awaiting.length > 0 || awaitingQ.isError) && (
            <>
              <h2 className="mb-3 mt-6 text-base sm:text-lg font-bold text-[#1F2937]">
                Awaiting approval
              </h2>
              <div className="divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
                {awaitingQ.isError && (
                  <p className="py-4 text-sm text-[#E8542F]">
                    {(awaitingQ.error as Error)?.message}
                  </p>
                )}
                {awaiting.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-[#1F2937]">
                        {naira(r.amount)}
                      </p>
                      <p className="mt-0.5 text-xs sm:text-sm text-[#9AA5B8]">
                        {r.date} · Your request is being reviewed
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={cancel.isPending}
                      onClick={() => r.settlementId && cancelRequest(r.settlementId)}
                      className="shrink-0 rounded-full border border-[#E8542F] px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#E8542F] disabled:opacity-50"
                    >
                      {cancel.isPending && cancel.variables === r.settlementId
                        ? "Cancelling…"
                        : "Cancel"}
                    </button>
                  </div>
                ))}
              </div>
              {cancelError && (
                <p className="mt-2 px-1 text-sm text-[#E8542F]">{cancelError}</p>
              )}
            </>
          )}

          {/* payout account */}
          <h2 className="mb-3 mt-6 text-base sm:text-lg font-bold text-[#1F2937]">
            Payout Account
          </h2>
          <div className="divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            {accountsQ.isLoading && (
              <p className="py-4 text-sm text-[#9AA5B8]">Loading accounts…</p>
            )}
            {accountsQ.isError && (
              <p className="py-4 text-sm text-[#E8542F]">
                {(accountsQ.error as Error)?.message}
              </p>
            )}
            {accounts.map((acc) => {
              const verified = acc.status === "verified";
              return (
                <div key={acc.id} className="flex items-center gap-3.5 py-4">
                  <button
                    type="button"
                    disabled={!verified}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className="flex min-w-0 flex-1 items-center gap-3.5 text-left disabled:opacity-70"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                      style={{ background: acc.badgeBg, color: acc.badgeColor }}
                    >
                      {acc.badgeText}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm sm:text-base font-semibold text-[#1F2937]">
                        {acc.bank} ····{acc.last4}
                      </p>
                      <p className="truncate text-xs sm:text-sm text-[#6E43A3]">
                        {acc.holder || "Account name pending"}
                      </p>
                      {acc.status === "pending_verification" && (
                        <p className="text-xs text-[#E8A93E]">Verifying…</p>
                      )}
                      {acc.status === "failed" && (
                        <p className="text-xs text-[#E8542F]">Verification failed</p>
                      )}
                    </div>
                  </button>
                  {verified ? (
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
                  ) : (
                    <button
                      type="button"
                      disabled={reverify.isPending}
                      onClick={() => reverify.mutate(acc.id)}
                      className="shrink-0 rounded-full bg-[#EFE6F7] px-3 py-1.5 text-xs font-semibold text-[#6E43A3] disabled:opacity-50"
                    >
                      {reverify.isPending && reverify.variables === acc.id
                        ? "Checking…"
                        : "Re-verify"}
                    </button>
                  )}
                </div>
              );
            })}
            {reverify.isError && (
              <p className="py-3 text-sm text-[#E8542F]">
                {(reverify.error as Error)?.message}
              </p>
            )}

            <button
              type="button"
              onClick={() => setView("add-account")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <Plus size={18} className="text-[#4B5768]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-semibold text-[#1F2937]">
                  {accounts.length ? "Use a different account" : "Add Bank Account"}
                </p>
                <p className="truncate text-xs sm:text-sm text-[#9AA5B8]">
                  Add your bank details for seamless payouts.
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>
          </div>

          {/* withdrawal history */}
          <div className="mb-3 mt-6 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
              Payout History
            </h2>
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-[#6E43A3]"
            >
              {showAll ? "Show less" : "View All"}
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            {historyQ.isLoading && (
              <p className="py-4 text-sm text-[#9AA5B8]">Loading…</p>
            )}
            {historyQ.isError && (
              <p className="py-4 text-sm text-[#E8542F]">
                {(historyQ.error as Error)?.message}
              </p>
            )}
            {!historyQ.isLoading && !historyQ.isError && shownHistory.length === 0 && (
              <p className="py-4 text-sm text-[#9AA5B8]">No withdrawals yet.</p>
            )}
            {shownHistory.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDetailId(item.id)}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm sm:text-base font-semibold text-[#1F2937]">
                    Withdrawal
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm text-[#9AA5B8]">
                    {item.date} ·{" "}
                    <span className={`font-medium ${STATUS_STYLES[item.status]}`}>
                      {item.status}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 text-sm sm:text-base font-bold text-[#1F2937]">
                  -{naira(item.amount)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* withdrawal detail (polls only while Processing and open) */}
      {detailId && (
        <WithdrawalDetailSheet
          id={detailId}
          fallback={history.find((h) => h.id === detailId)}
          onClose={() => setDetailId(null)}
          onContactSupport={onContactSupport}
        />
      )}

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
                <p className="mt-6 text-center text-base font-semibold text-[#1E9E56]">
                  {withdrawDone === "awaiting_approval"
                    ? "Request sent"
                    : "Withdrawal started"}
                </p>
                <p className="mt-1 text-center text-sm text-[#6B7280]">
                  {withdrawDone === "awaiting_approval"
                    ? "Your request is being reviewed. The amount is reserved and you can cancel it until it is approved."
                    : "Your money is on its way to your bank."}
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
                <p className="mt-4 text-sm text-[#9AA5B8]">
                  Available: {naira(balance)}
                  {limits?.maxAmount != null
                    ? ` · Max per request: ${naira(limits.maxAmount)}`
                    : ""}
                  {selectedAccount
                    ? ` · to ${selectedAccount.bank} ····${selectedAccount.last4}`
                    : ""}
                </p>
                {!selectedAccount && (
                  <p className="mt-2 text-sm text-[#E8542F]">
                    Add and verify a payout account first.
                  </p>
                )}
                <input
                  type="number"
                  inputMode="decimal"
                  min={minAmount}
                  max={maxAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (₦)"
                  className="mt-3 w-full rounded-xl bg-[#F1F2F5] px-4 py-3.5 text-base text-[#1F2937] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAmount(String(maxAmount))}
                  disabled={maxAmount <= 0}
                  className="mt-2 text-xs font-semibold text-[#6E43A3] disabled:opacity-50"
                >
                  Use max ({naira(maxAmount)})
                </button>
                {amountError && (
                  <p className="mt-2 text-sm text-[#E8542F]">{amountError}</p>
                )}
                {withdrawError && (
                  <div className="mt-2 text-sm text-[#E8542F]">
                    <p>{withdrawError}</p>
                    {classifyWithdrawError(withdrawError) === "no-account" && (
                      <button
                        type="button"
                        className="mt-1 font-semibold underline"
                        onClick={() => {
                          closeWithdraw();
                          setView("add-account");
                        }}
                      >
                        Add a payout account
                      </button>
                    )}
                  </div>
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

/** One withdrawal. Polls every 12s only while it is Processing and this sheet is open. */
function WithdrawalDetailSheet({
  id,
  fallback,
  onClose,
  onContactSupport,
}: {
  id: string;
  fallback?: PayoutItem;
  onClose: () => void;
  onContactSupport?: () => void;
}) {
  const q = useWithdrawal(id); // polls itself only while Processing
  const item = q.data ?? fallback;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F2937]">Withdrawal</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[#4B5768]"
          >
            <X size={16} />
          </button>
        </div>
        {!item ? (
          <p className="mt-6 text-sm text-[#9AA5B8]">Loading…</p>
        ) : (
          <>
            <p className="mt-5 text-3xl font-extrabold text-[#1F2937]">
              {naira(item.amount)}
            </p>
            <p className="mt-1 text-sm text-[#9AA5B8]">{item.date}</p>
            <p className={`mt-3 text-base font-semibold ${STATUS_STYLES[item.status]}`}>
              {item.status}
            </p>
            {item.status === "Processing" && (
              <p className="mt-1 text-sm text-[#6B7280]">
                Approved and on its way to your bank.
              </p>
            )}
            {item.status === "Failed" && (
              <>
                {item.failureReason && (
                  <p className="mt-1 text-sm text-[#E8542F]">{item.failureReason}</p>
                )}
                <p className="mt-1 text-sm text-[#6B7280]">
                  The money has returned to your available balance.
                </p>
                {onContactSupport && (
                  <button
                    type="button"
                    onClick={onContactSupport}
                    className="mt-4 w-full rounded-full border border-[#6E43A3] py-3 text-sm font-bold text-[#6E43A3]"
                  >
                    Contact support
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
