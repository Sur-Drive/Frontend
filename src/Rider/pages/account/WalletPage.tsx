import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus } from "lucide-react";
import AddBankAccountPage, { type AddedBankAccount } from "./AddBankAccountPage";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const BALANCE = 62300;
const PENDING_EARNINGS = 22200;
const PAID_THIS_MONTH = 186400;

type PayoutStatus = "Pending" | "Failed" | "Successful";

interface BankAccount {
  id: string;
  bank: string;
  last4: string;
  holder: string;
  badgeBg: string;
  badgeColor: string;
  badgeText: string;
}

interface PayoutHistoryItem {
  id: string;
  bank: string;
  last4: string;
  date: string;
  status: PayoutStatus;
  amount: number;
}

const INITIAL_ACCOUNTS: BankAccount[] = [
  {
    id: "1",
    bank: "GTBank",
    last4: "4821",
    holder: "Driver Name",
    badgeBg: "#F15A22",
    badgeColor: "#FFFFFF",
    badgeText: "GT",
  },
  {
    id: "2",
    bank: "Access bank",
    last4: "4521",
    holder: "Driver Name",
    badgeBg: "#EAF0F6",
    badgeColor: "#0072BC",
    badgeText: "AB",
  },
];

const PAYOUT_HISTORY: PayoutHistoryItem[] = [
  {
    id: "p1",
    bank: "GTBank",
    last4: "4821",
    date: "13 Sep, 2024",
    status: "Pending",
    amount: 42500,
  },
  {
    id: "p2",
    bank: "GTBank",
    last4: "4821",
    date: "13 Sep, 2024",
    status: "Failed",
    amount: 51000,
  },
  {
    id: "p3",
    bank: "GTBank",
    last4: "4821",
    date: "13 Sep, 2024",
    status: "Successful",
    amount: 51000,
  },
  {
    id: "p4",
    bank: "GTBank",
    last4: "4821",
    date: "6 Sep, 2024",
    status: "Successful",
    amount: 38000,
  },
];

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

export default function WalletPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("wallet");
  const [showBalance, setShowBalance] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState(
    INITIAL_ACCOUNTS[0].id,
  );

  const handleAdded = (account: AddedBankAccount) => {
    const palette = BADGE_PALETTE[accounts.length % BADGE_PALETTE.length];
    const initials = account.bank
      .replace(/\(.*\)/g, "")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const newAccount: BankAccount = {
      id: `${Date.now()}`,
      bank: account.bank,
      last4: account.accountNumber.slice(-4),
      holder: account.holder,
      badgeBg: palette.badgeBg,
      badgeColor: palette.badgeColor,
      badgeText: initials || "BK",
    };

    setAccounts((prev) => [...prev, newAccount]);
    setSelectedAccountId(newAccount.id);
  };

  if (view === "add-account") {
    return (
      <AddBankAccountPage
        onBack={() => setView("wallet")}
        onAdded={handleAdded}
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
            <h1 className="text-[20px] font-bold text-[#1F2937]">Wallet</h1>
          </div>

          {/* balance card */}
          <div className="relative mt-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7B4FB0] to-[#4A2A73] px-6 py-6 shadow-sm">
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full border border-white/10"
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between">
              <p className="text-[14px] text-white/70">Available Balance</p>
              <button
                type="button"
                onClick={() => setShowBalance((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <p className="relative mt-1.5 text-[34px] font-extrabold tracking-tight text-white">
              {showBalance ? naira(BALANCE) : "₦••••••"}
            </p>
            <button
              type="button"
              className="relative mt-5 w-full rounded-2xl bg-white/25 py-3.5 text-[15px] font-bold text-white backdrop-blur-sm transition active:scale-[0.99]"
            >
              Withdraw Now
            </button>
          </div>

          {/* pending / paid */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-[13px] text-[#9AA5B8]">Pending Earnings</p>
              <p className="mt-1.5 text-xl font-extrabold text-[#1F2937]">
                {naira(PENDING_EARNINGS)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-[13px] text-[#9AA5B8]">Paid This Month</p>
              <p className="mt-1.5 text-xl font-extrabold text-[#1E9E56]">
                {naira(PAID_THIS_MONTH)}
              </p>
            </div>
          </div>

          {/* payout account */}
          <h2 className="mb-3 mt-6 text-lg font-bold text-[#1F2937]">
            Payout Account
          </h2>
          <div className="divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
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
                  <p className="truncate text-[15px] font-semibold text-[#1F2937]">
                    {acc.bank} ····{acc.last4}
                  </p>
                  <p className="truncate text-[13px] text-[#6E43A3]">
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
                <p className="text-[15px] font-semibold text-[#1F2937]">
                  Add Bank Account
                </p>
                <p className="truncate text-[13px] text-[#9AA5B8]">
                  Add your bank details for seamless payouts.
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>
          </div>

          {/* payout history */}
          <div className="mb-3 mt-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1F2937]">
              Payout History
            </h2>
            <button
              type="button"
              className="flex items-center gap-0.5 text-[14px] font-semibold text-[#6E43A3]"
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            {PAYOUT_HISTORY.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#1F2937]">
                    {item.bank} ····{item.last4}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#9AA5B8]">
                    {item.date} ·{" "}
                    <span className={`font-medium ${STATUS_STYLES[item.status]}`}>
                      {item.status}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 text-[15px] font-bold text-[#1F2937]">
                  {naira(item.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
