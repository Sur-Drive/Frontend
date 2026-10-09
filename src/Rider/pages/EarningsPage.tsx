import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import DriverBottomNav from "../components/DriverBottomNav";
import carTop from "../../assets/car-image.png";
import {
  useEarningsDetail,
  useEarningsOverview,
  useEarningsPeriod,
  useEarningsRides,
  useEarningsWallet,
} from "../hooks/useEarnings";
import {
  TABS,
  getPeriod,
  normalizeTrips,
  type Bar,
  type Period,
  type RangeType,
} from "../lib/earningsMap";

const PURPLE = "#6E43A3";

const CARD_SHADOW = "shadow-[0_10px_38px_rgba(198,198,208,0.43)]";
// Lighter version used on the Earnings Details cards.
const CARD_SHADOW_SOFT = "shadow-[0_10px_38px_rgba(198,198,208,0.21)]";
// Tiny lift under the round header buttons.
const ROUND_BTN_SHADOW = "shadow-[0_4px_12px_rgba(60,60,90,0.07)]";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type PeriodData = {
  bars: Bar[];
  highlightIndex: number;
  /** Labels under the chart when there are too many bars to label each one. */
  axisLabels?: string[];
};

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

/* ------------------------------------------------------------------ */
/* Small pieces                                                       */
/* ------------------------------------------------------------------ */

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="#141414"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="2" width="16" height="15" rx="3.6" />
      <path d="M1 6.6h16" />
      <path d="M5.2 0.8v2.4M12.8 0.8v2.4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Period tabs (Yesterday / Today, Last Week / Current Week, …)       */
/* ------------------------------------------------------------------ */

const TAB_W = 120;
const TAB_GAP = 4.5;

function PeriodTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="relative h-[41px] overflow-hidden rounded-lg bg-[#F9FAFB]">
      {/* The active tab always sits in the same spot; older tabs slide in
          from the left and peek out at the edge of the strip. */}
      <div
        className="absolute inset-y-1 left-[calc(50%-51.5px)] flex transition-transform duration-300 ease-out"
        style={{
          gap: TAB_GAP,
          transform: `translateX(${-active * (TAB_W + TAB_GAP)}px)`,
        }}
      >
        {tabs.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(i)}
            style={{ width: TAB_W }}
            className={`h-full shrink-0 whitespace-nowrap rounded-md text-sm font-semibold transition-colors ${
              i === active ? "bg-white text-[#251F61]" : "text-[#6B7A99]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bar chart                                                          */
/* ------------------------------------------------------------------ */

const PLOT_H = 120;

// The y-axis isn't linear: each label sits on an evenly spaced gridline.
const TICKS = [
  { label: "₦500k", value: 500000 },
  { label: "₦100k", value: 100000 },
  { label: "₦50k", value: 50000 },
  { label: "₦10k", value: 10000 },
  { label: "₦0", value: 0 },
];

// value → bar height in px, following the gridlines above (0, 30, 60, 90, 120)
const SCALE: [number, number][] = [
  [0, 0],
  [10000, 30],
  [50000, 60],
  [100000, 90],
  [500000, 120],
];

function barHeight(value: number) {
  if (value <= 0) return 0;
  for (let i = 1; i < SCALE.length; i++) {
    const [v0, h0] = SCALE[i - 1];
    const [v1, h1] = SCALE[i];
    if (value <= v1) return h0 + ((value - v0) / (v1 - v0)) * (h1 - h0);
  }
  return PLOT_H;
}

function BarChart({ data }: { data: PeriodData }) {
  const n = data.bars.length;
  const dense = n > 10; // month view: thin bars, sparse x labels
  const single = n === 1; // day view: one wide bar

  // Tapping a bar (e.g. Mon / Tue) moves the highlight + tooltip to it.
  const [selected, setSelected] = useState(data.highlightIndex);
  const signature = `${data.highlightIndex}|${data.bars.map((b) => b.value).join(",")}`;
  useEffect(() => {
    setSelected(data.highlightIndex);
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = Math.min(selected, Math.max(n - 1, 0));

  // Bars are fluid: each one fills an equal column and is capped at maxBar.
  const maxBar = dense ? 6.5 : single ? 36 : 31.5;
  const barRadius = dense ? "rounded-full" : "rounded-[10px]";

  const layout = dense
    ? { cardH: 171, top: 12.5, left: 47, right: 18 }
    : { cardH: 180, top: 21.5, left: 50, right: 15 };

  const hi = data.bars[active] ?? { label: "", value: 0 };
  const hiHeight = barHeight(hi.value);
  const tipW = 62;
  const tipH = dense ? 21 : 20;
  const tipGap = dense ? 9 : 11.5;
  // centre of the selected column, as a share of the bars area
  const centre = `${((active + 0.5) / Math.max(n, 1)) * 100}%`;

  return (
    <div
      style={{ height: layout.cardH }}
      className={`relative w-full rounded-[11px] border border-[#F2F4F7] bg-white ${CARD_SHADOW}`}
    >
      <div
        className="absolute"
        style={{
          top: layout.top,
          left: layout.left,
          right: layout.right,
          height: PLOT_H,
        }}
      >
        {/* gridlines */}
        {TICKS.map((t, i) => (
          <div
            key={t.label}
            className="absolute inset-x-0 h-px bg-[#F8F9FB]"
            style={{ top: i * 30 }}
          />
        ))}

        {/* y-axis labels, right-aligned against the gridlines */}
        {TICKS.map((t, i) => (
          <span
            key={t.label}
            className="absolute right-full -translate-y-1/2 whitespace-nowrap pr-1 text-right font-medium leading-none text-[#6B7A99]"
            style={{
              top: dense ? 7.75 + 28 * i : i * 30,
              fontSize: 12,
            }}
          >
            {t.label}
          </span>
        ))}

        {/* bars: equal-width columns that stretch to the card */}
        <div className="absolute inset-y-0 left-2 right-0 flex items-end">
          {data.bars.map((b, i) => {
            const isHi = i === active;
            return (
              <button
                key={`${b.label}-${i}`}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`${b.label}: ${b.tooltip ?? naira(b.value)}`}
                aria-pressed={isHi}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
              >
                <div
                  className={`${barRadius} transition-colors ${
                    isHi ? "bg-[#6E43A3]" : "bg-[#D0D5DD]"
                  }`}
                  style={{
                    width: "100%",
                    maxWidth: maxBar,
                    // keep a little air between thin bars on small screens
                    marginInline: dense ? 0.5 : 2,
                    height: barHeight(b.value),
                  }}
                />
                {!dense && (
                  <span
                    className={`absolute left-1/2 top-full mt-[7px] -translate-x-1/2 whitespace-nowrap text-xs leading-4 sm:text-sm ${
                      isHi
                        ? "font-semibold text-[#6E43A3]"
                        : "font-medium text-[#667085]"
                    }`}
                  >
                    {b.label}
                  </span>
                )}
              </button>
            );
          })}

          {dense && data.axisLabels && (
            <div className="pointer-events-none absolute inset-x-0 top-full mt-[7px] flex justify-between text-xs leading-4 text-[#878787] sm:text-sm">
              {data.axisLabels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          )}

          {/* tooltip over the selected bar (kept inside the plot) */}
          <span
            className="pointer-events-none absolute z-10 flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold text-white"
            style={{
              backgroundColor: PURPLE,
              width: tipW,
              height: tipH,
              bottom: hiHeight + tipGap,
              left: `clamp(0px, calc(${centre} - ${tipW / 2}px), calc(100% - ${tipW}px))`,
            }}
          >
            {hi.tooltip ?? naira(hi.value)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Time range bottom sheet                                            */
/* ------------------------------------------------------------------ */

function TimeRangeSheet({
  open,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  value: RangeType;
  onChange: (v: RangeType) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const options: { key: RangeType; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/[0.36] backdrop-blur-[8px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-t-[24px] bg-white pb-[calc(env(safe-area-inset-bottom,0px)+7px)]">
        <div className="flex h-[84.5px] items-start justify-between border-b border-[#E8E6EB] px-6 pt-10">
          <h2 className="text-lg font-semibold leading-7 text-[#2E2E2E]">
            Time Range
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5E5E5] text-[#041023]"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className="flex h-[60px] items-center justify-between border-b border-[#E8E6EB] pl-6 pr-[26px] text-left"
            >
              <span className="text-lg font-semibold text-[#2E2E2E]">
                {opt.label}
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#6E43A3]">
                {value === opt.key && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6E43A3]" />
                )}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mx-6 mt-[10px] flex h-[59px] w-[calc(100%-48px)] items-center justify-center rounded-full bg-[#6E43A3] text-lg font-semibold text-white shadow-[0_12px_24px_rgba(110,67,163,0.28)] transition active:scale-[0.99]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Earnings Details screen                                            */
/* ------------------------------------------------------------------ */

function EarningsDetail({
  period,
  onBack,
}: {
  period: Period;
  onBack: () => void;
}) {
  const detail = useEarningsDetail(period);
  const rides = useEarningsRides(period);
  const d = detail.data;
  const trips = (rides.data?.pages ?? []).flatMap((p) => normalizeTrips(p));
  const rate =
    d?.commissionRate ??
    (d && d.tripFares ? Math.round((d.commission / d.tripFares) * 100) : undefined);
  const dash = (v?: string | number) => (d ? String(v) : "—");

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-white">
      <div className="flex shrink-0 items-center px-6 pt-[calc(env(safe-area-inset-top,0px)+18px)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ${ROUND_BTN_SHADOW}`}
        >
          <ChevronLeft size={20} strokeWidth={2} className="text-[#141414]" />
        </button>
        <h1 className="flex-1 text-center text-2xl font-semibold leading-9 text-[#2E2E2E]">
          Earnings Details
        </h1>
      </div>

      <div className="flex-1 min-h-0 px-6 pt-5 pb-8 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-[20.5px]">
          {detail.error && (
            <div className="flex items-center justify-between rounded-[11px] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]">
              <span>{(detail.error as Error).message}</span>
              <button
                type="button"
                onClick={() => detail.refetch()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* period */}
          <div
            className={`flex h-[45px] items-center rounded-[11px] bg-white px-[14.5px] ${CARD_SHADOW_SOFT}`}
          >
            <p className="text-base font-medium text-[#1D2939]">
              {period.label}
            </p>
          </div>

          {/* net earnings */}
          <div
            className={`rounded-[11px] bg-white px-4 pb-[14.5px] pt-[13px] ${CARD_SHADOW_SOFT}`}
          >
            <p className="text-xs leading-4 text-[#6B7A99]">Net Earnings</p>
            <p className="mt-0.5 text-3xl font-bold leading-9 text-[#251F61]">
              {d ? naira(d.earning) : "—"}
            </p>
            <div className="-mx-4 mb-3.5 mt-[15px] h-px bg-[#F2F4F7]" />
            <div className="grid grid-cols-2 gap-x-3 gap-y-[9px]">
              {[
                ["Trips", dash(d?.trips)],
                ["Online Time", dash(d?.onlineTime)],
                ["Distance", dash(d?.distance)],
                ["Avg / Trip", d ? naira(d.avgPerTrip) : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs leading-4 text-[#6B7A99]">
                    {label}
                  </p>
                  <p className="text-base font-semibold leading-5 text-[#1D2939]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* fare breakdown */}
          <div
            className={`rounded-[11px] bg-white px-4 pb-[14.5px] pt-[13px] ${CARD_SHADOW_SOFT}`}
          >
            <h3 className="text-base font-semibold leading-5 text-[#1D2939]">
              Fare Breakdown
            </h3>
            <div className="mt-2.5 flex items-center justify-between text-sm leading-5">
              <span className="text-[#6B7A99]">Trip Fares</span>
              <span className="font-medium text-[#1D2939]">
                {d ? naira(d.tripFares) : "—"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm leading-5">
              <span className="text-[#6B7A99]">
                App Commission{rate !== undefined ? ` (${rate}%)` : ""}
              </span>
              <span className="font-medium text-[#1D2939]">
                {d ? `-${naira(d.commission)}` : "—"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base font-semibold leading-5 text-[#1D2939]">
              <span>Net Earnings</span>
              <span>{d ? naira(d.earning) : "—"}</span>
            </div>
          </div>

          {/* trips */}
          <div className="-mt-[3px]">
            <h3 className="mb-3 text-lg font-semibold leading-[22px] text-[#2E2E2E]">
              Trips
            </h3>

            {rides.isLoading && (
              <p className="text-sm text-[#6B7A99]">Loading trips…</p>
            )}
            {rides.error && (
              <p className="text-sm text-[#B42318]">
                {(rides.error as Error).message}
              </p>
            )}
            {!rides.isLoading && !rides.error && trips.length === 0 && (
              <p className="text-sm text-[#6B7A99]">
                No trips in this period.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {trips.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-[11px] bg-white px-4 pb-2.5 pt-[12.5px] ${CARD_SHADOW_SOFT}`}
                >
                  <div className="flex items-center gap-[10px]">
                    <img
                      src={carTop}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-[11px] bg-[#F5F5F4] object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center truncate text-base font-medium leading-[22px] text-[#2E2E2E]">
                        <span className="truncate">{t.from}</span>
                        <ArrowRight
                          size={21}
                          strokeWidth={1.5}
                          className="mx-[3px] shrink-0"
                        />
                        <span className="truncate">{t.to}</span>
                      </p>
                      <p className="truncate text-xs leading-[17px] text-[#7282A7]">
                        {t.date} • {t.person} •{" "}
                        <span className="text-[#47CA6C]">Completed</span>
                      </p>
                    </div>
                    <ChevronRight
                      size={22}
                      strokeWidth={1.5}
                      className="-mr-0.5 shrink-0 text-[#0A192F]"
                    />
                  </div>
                  <div className="ml-[42px] mt-[7.5px] h-px bg-[#C7CDDC]" />
                  <div className="flex items-center justify-between pt-[5px]">
                    <span className="text-sm text-[#7282A7]">
                      {t.paymentMethod}
                    </span>
                    <span className="text-lg font-semibold leading-[26px] text-[#2E2E2E]">
                      {naira(t.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {rides.hasNextPage && (
              <button
                type="button"
                onClick={() => rides.fetchNextPage()}
                disabled={rides.isFetchingNextPage}
                className="mt-4 h-[41px] w-full rounded-[10px] border border-[#6E43A3] text-base font-semibold text-[#6E43A3] transition active:scale-[0.99] disabled:opacity-60"
              >
                {rides.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */

export default function EarningsPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeType>("daily");
  const [subTab, setSubTab] = useState(TABS.daily.length - 1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const tabs = TABS[range];
  const period = getPeriod(range, subTab);

  const { summary, chart, isLoading, error, refetch } = useEarningsPeriod(
    range,
    period,
  );
  const wallet = useEarningsWallet();
  const overview = useEarningsOverview();

  const withdrawable = wallet.data?.balance ?? overview.data?.withdrawable;
  const nextPayout = overview.data?.nextPayout;

  const handleRangeChange = (r: RangeType) => {
    setRange(r);
    setSubTab(TABS[r].length - 1); // land on the current period
    setSheetOpen(false);
  };

  if (showDetail) {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <EarningsDetail period={period} onBack={() => setShowDetail(false)} />
      </div>
    );
  }

  const stats = [
    { label: "Completed Trips", value: summary ? String(summary.trips) : "—" },
    { label: "Online Time", value: summary?.onlineTime ?? "—" },
    { label: "Avg / Trip", value: summary ? naira(summary.avgPerTrip) : "—" },
  ];

  return (
    <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6 pt-[calc(env(safe-area-inset-top,0px)+18px)]">
        <div className="w-full max-w-xl mx-auto">
          {/* header */}
          <div className="flex items-center justify-between px-6 h-9">
            <h1 className="text-2xl font-semibold leading-9 text-[#2E2E2E]">
              Earnings
            </h1>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="Choose time range"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ${ROUND_BTN_SHADOW}`}
            >
              <CalendarIcon />
            </button>
          </div>

          {/* period tabs (full width) */}
          <div className="mt-[21px]">
            <PeriodTabs tabs={tabs} active={subTab} onChange={setSubTab} />
          </div>

          <div className="px-6">
            {error && (
              <div className="mt-4 flex items-center justify-between rounded-[11px] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]">
                <span>{error.message}</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* earning card */}
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="mt-[22px] flex h-[108px] w-full flex-col rounded-2xl border border-[#E8E6EB] bg-[#6E43A3] px-5 pt-[17px] text-left transition active:scale-[0.99]"
            >
              <div className="flex h-[18px] w-full items-center justify-between">
                <span className="text-sm leading-[18px] text-white/80">
                  Earning
                </span>
                <ChevronRight
                  size={22}
                  strokeWidth={1.5}
                  className="shrink-0 text-white/80"
                />
              </div>
              <span className="mt-[13px] text-3xl font-bold leading-[40px] text-white">
                {summary ? naira(summary.earning) : isLoading ? "…" : "—"}
              </span>
            </button>

            {/* stats row */}
            <div
              className={`mt-[22px] grid h-[68px] grid-cols-3 rounded-[11px] bg-white px-1 pt-[13.5px] text-center ${CARD_SHADOW}`}
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xs leading-4 text-[#6B7A99]">
                    {s.label}
                  </p>
                  <p className="mt-px text-lg font-bold leading-[22px] text-[#1D2939]">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* chart */}
            <div className="mt-[22px]">
              <BarChart data={chart} />
            </div>

            {/* withdraw card */}
            <div
              className={`mt-[23px] rounded-[11px] border border-[#F2F4F7] bg-white px-[15px] pb-[13.5px] pt-[13px] ${CARD_SHADOW}`}
            >
              <p className="text-xs leading-4 text-[#6B7A99]">
                Available to Withdraw
              </p>
              <p className="mt-[3px] text-2xl font-bold leading-8 text-[#1D2939]">
                {withdrawable !== undefined ? naira(withdrawable) : "—"}
              </p>
              {nextPayout && (
                <p className="mt-1 text-xs leading-4 text-[#6B7A99]">
                  Next auto-payout:{" "}
                  <span className="text-[#1D2939]">{nextPayout}</span>
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate("/driver/account")}
                className="mt-[15.5px] h-[41px] w-full rounded-[10px] bg-[#6E43A3] text-base font-semibold text-white transition active:scale-[0.99]"
              >
                Withdraw Earnings
              </button>
            </div>
          </div>
        </div>
      </div>

      <DriverBottomNav
        active="earnings"
        onChange={(tab) => {
          if (tab === "home") navigate("/driver/home");
          if (tab === "rides") navigate("/driver/rides");
          if (tab === "account") navigate("/driver/account");
        }}
      />

      <TimeRangeSheet
        open={sheetOpen}
        value={range}
        onChange={handleRangeChange}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
