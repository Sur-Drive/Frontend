import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import DriverBottomNav from "../components/DriverBottomNav";
import carTop from "../../assets/car-image.png";

const PURPLE = "#6E43A3";

const CARD_SHADOW = "shadow-[0_10px_38px_rgba(198,198,208,0.43)]";
// Lighter version used on the Earnings Details cards.
const CARD_SHADOW_SOFT = "shadow-[0_10px_38px_rgba(198,198,208,0.21)]";
// Tiny lift under the round header buttons.
const ROUND_BTN_SHADOW = "shadow-[0_4px_12px_rgba(60,60,90,0.07)]";

/* ------------------------------------------------------------------ */
/* Types & sample data                                                */
/* ------------------------------------------------------------------ */

type RangeType = "daily" | "weekly" | "monthly";

type Bar = {
  label: string;
  /** Real value, used to work out the bar height on the chart's scale. */
  value: number;
  /** Text shown in the tooltip when this bar is highlighted. */
  tooltip?: string;
};

type PeriodData = {
  tabs: string[]; // oldest → newest; the last one is the active default
  earning: number;
  trips: number;
  onlineTime: string;
  avgPerTrip: number;
  bars: Bar[];
  highlightIndex: number;
  /** Labels under the chart when there are too many bars to label each one. */
  axisLabels?: string[];
};

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const DAILY: PeriodData = {
  tabs: ["Yesterday", "Today"],
  earning: 46630,
  trips: 4,
  onlineTime: "12h 29m",
  avgPerTrip: 11540,
  bars: [{ label: "Sun 10-19", value: 38000, tooltip: "₦46,630" }],
  highlightIndex: 0,
};

const WEEKLY: PeriodData = {
  tabs: ["Two Weeks Ago", "Last Week", "Current Week"],
  earning: 84500,
  trips: 32,
  onlineTime: "38h 24m",
  avgPerTrip: 2640,
  bars: [
    { label: "M", value: 23300 },
    { label: "T", value: 58300 },
    { label: "W", value: 91700, tooltip: "₦98,500" },
    { label: "T", value: 36700 },
    { label: "F", value: 66700 },
    { label: "S", value: 166700 },
    { label: "S", value: 10000 },
  ],
  highlightIndex: 2,
};

const MONTHLY_VALUES = [
  6000, 66700, 66700, 51700, 7000, 5500, 6200, 23300, 49300, 8800, 64200, 36000,
  9200, 49300, 34000, 5700, 15300, 7800, 8800, 7700, 31300, 12000, 29300, 22000,
  51700, 56700, 5800, 56700, 20000, 33300,
];

const MONTHLY: PeriodData = {
  tabs: ["Two Months Ago", "Last Month", "Current Month"],
  earning: 284500,
  trips: 32,
  onlineTime: "38h 24m",
  avgPerTrip: 2640,
  bars: MONTHLY_VALUES.map((value, i) => ({
    label: String(i + 1),
    value,
    tooltip: i === 2 ? "₦ 72,590" : undefined,
  })),
  highlightIndex: 2,
  axisLabels: ["1", "6", "11", "16", "21", "26", "31"],
};

const RANGE_DATA: Record<RangeType, PeriodData> = {
  daily: DAILY,
  weekly: WEEKLY,
  monthly: MONTHLY,
};

const WITHDRAWABLE = 62300;
const NEXT_PAYOUT = "Friday, 25 Sep";

const DETAIL = {
  period: "9 Sep – 15 Sep",
  net: "₦84,500",
  trips: "32",
  onlineTime: "38h 24m",
  distance: "426 km",
  avgPerTrip: "₦2,640",
  tripFares: "₦98,400",
  commission: "-₦22,500",
};

const RECENT_TRIPS = [
  {
    id: "t1",
    from: "Ikoyi",
    to: "Ajah",
    date: "5 sept, 12:26",
    person: "Ngozi U.",
    paymentMethod: "Card",
    amount: 9440,
  },
  {
    id: "t2",
    from: "VI",
    to: "Lekki Phase 1",
    date: "5 sept, 12:26",
    person: "Femi B.",
    paymentMethod: "Card",
    amount: 4960,
  },
  {
    id: "t3",
    from: "Yaba",
    to: "Surulere",
    date: "5 sept, 11:20",
    person: "Femi B.",
    paymentMethod: "Card",
    amount: 3840,
  },
];

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
            className={`h-full shrink-0 whitespace-nowrap rounded-md text-[14.5px] font-semibold transition-colors ${
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

  const barW = dense ? 6.5 : single ? 36 : 31.5;
  const barRadius = dense ? "rounded-full" : "rounded-[10px]";

  const layout = dense
    ? { cardH: 171, top: 12.5, left: 47, right: 18, barsRight: -3 }
    : { cardH: 180, top: 21.5, left: 50, right: 15, barsRight: 0 };

  const hi = data.bars[data.highlightIndex];
  const hiHeight = barHeight(hi.value);
  const tipW = dense ? 62.5 : 62;
  const tipH = dense ? 21 : 20;
  const tipGap = dense ? 9 : 11.5;
  const centre = single
    ? "50%"
    : `calc(${data.highlightIndex / (n - 1)} * (100% - ${barW}px) + ${barW / 2}px)`;

  return (
    <div
      style={{ height: layout.cardH }}
      className={`relative rounded-[11px] border border-[#F2F4F7] bg-white ${CARD_SHADOW}`}
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
            className="absolute right-full -translate-y-1/2 whitespace-nowrap text-right font-medium leading-none text-[#6B7A99]"
            style={{
              top: dense ? 7.75 + 28 * i : i * 30,
              fontSize: dense ? 11 : 12,
            }}
          >
            {t.label}
          </span>
        ))}

        {/* bars */}
        <div
          className={`absolute inset-y-0 flex items-end ${
            single ? "justify-center" : "justify-between"
          }`}
          style={{ left: 16, right: layout.barsRight }}
        >
          {data.bars.map((b, i) => {
            const isHi = i === data.highlightIndex;
            return (
              <div
                key={`${b.label}-${i}`}
                className="relative flex items-end h-full"
                style={{ width: barW }}
              >
                <div
                  className={`w-full ${barRadius} ${
                    isHi ? "bg-[#6E43A3]" : "bg-[#D0D5DD]"
                  }`}
                  style={{ height: barHeight(b.value) }}
                />
                {!dense && (
                  <span
                    className={`absolute left-1/2 top-full mt-[7px] -translate-x-1/2 whitespace-nowrap text-[13px] leading-4 ${
                      isHi
                        ? "font-semibold text-[#6E43A3]"
                        : "font-medium text-[#667085]"
                    }`}
                  >
                    {b.label}
                  </span>
                )}
              </div>
            );
          })}

          {dense && data.axisLabels && (
            <div className="absolute inset-x-0 top-full mt-[7px] flex justify-between text-[13px] leading-4 text-[#878787]">
              {data.axisLabels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          )}

          {/* tooltip over the highlighted bar (kept inside the plot) */}
          <span
            className="absolute z-10 flex items-center justify-center whitespace-nowrap rounded-md text-[12px] font-semibold text-white"
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
          <h2 className="text-[19px] font-semibold leading-7 text-[#2E2E2E]">
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
              <span className="text-[17px] font-semibold text-[#2E2E2E]">
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
          className="mx-6 mt-[10px] flex h-[59px] w-[calc(100%-48px)] items-center justify-center rounded-full bg-[#6E43A3] text-[17px] font-semibold text-white shadow-[0_12px_24px_rgba(110,67,163,0.28)] transition active:scale-[0.99]"
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

function EarningsDetail({ onBack }: { onBack: () => void }) {
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
        <h1 className="flex-1 text-center text-[24px] font-semibold leading-9 text-[#2E2E2E]">
          Earnings Details
        </h1>
      </div>

      <div className="flex-1 min-h-0 px-6 pt-5 pb-8 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-[20.5px]">
          {/* period */}
          <div
            className={`flex h-[45px] items-center rounded-[11px] bg-white px-[14.5px] ${CARD_SHADOW_SOFT}`}
          >
            <p className="text-[15px] font-medium text-[#1D2939]">
              {DETAIL.period}
            </p>
          </div>

          {/* net earnings */}
          <div
            className={`rounded-[11px] bg-white px-4 pb-[14.5px] pt-[13px] ${CARD_SHADOW_SOFT}`}
          >
            <p className="text-[12px] leading-4 text-[#6B7A99]">Net Earnings</p>
            <p className="mt-0.5 text-[30px] font-bold leading-9 text-[#251F61]">
              {DETAIL.net}
            </p>
            <div className="-mx-4 mb-3.5 mt-[15px] h-px bg-[#F2F4F7]" />
            <div className="grid grid-cols-2 gap-x-3 gap-y-[9px]">
              {[
                ["Trips", DETAIL.trips],
                ["Online Time", DETAIL.onlineTime],
                ["Distance", DETAIL.distance],
                ["Avg / Trip", DETAIL.avgPerTrip],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[12px] leading-4 text-[#6B7A99]">
                    {label}
                  </p>
                  <p className="text-[16px] font-semibold leading-5 text-[#1D2939]">
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
            <h3 className="text-[15px] font-semibold leading-5 text-[#1D2939]">
              Fare Breakdown
            </h3>
            <div className="mt-2.5 flex items-center justify-between text-[14px] leading-5">
              <span className="text-[#6B7A99]">Trip Fares</span>
              <span className="font-medium text-[#1D2939]">
                {DETAIL.tripFares}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[14px] leading-5">
              <span className="text-[#6B7A99]">App Commission (15%)</span>
              <span className="font-medium text-[#1D2939]">
                {DETAIL.commission}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[15px] font-semibold leading-5 text-[#1D2939]">
              <span>Net Earnings</span>
              <span>{DETAIL.net}</span>
            </div>
          </div>

          {/* trips */}
          <div className="-mt-[3px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[17px] font-semibold leading-[22px] text-[#2E2E2E]">
                Trips
              </h3>
              <button
                type="button"
                onClick={onBack}
                className="-mr-[3px] flex items-center text-[14px] font-semibold text-[#6E43A3]"
              >
                View All
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {RECENT_TRIPS.map((t) => (
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
                      <p className="flex items-center truncate text-[16px] font-medium leading-[22px] text-[#2E2E2E]">
                        <span>{t.from}</span>
                        <ArrowRight
                          size={21}
                          strokeWidth={1.5}
                          className="mr-[3px] shrink-0"
                        />
                        <span className="truncate">{t.to}</span>
                      </p>
                      <p className="truncate text-[12.5px] leading-[17px] text-[#7282A7]">
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
                    <span className="text-[13px] text-[#7282A7]">
                      {t.paymentMethod}
                    </span>
                    <span className="text-[19px] font-semibold leading-[26px] text-[#2E2E2E]">
                      {naira(t.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
  const [subTab, setSubTab] = useState(RANGE_DATA.daily.tabs.length - 1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const data = RANGE_DATA[range];

  const handleRangeChange = (r: RangeType) => {
    setRange(r);
    setSubTab(RANGE_DATA[r].tabs.length - 1); // land on the current period
    setSheetOpen(false);
  };

  if (showDetail) {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <EarningsDetail onBack={() => setShowDetail(false)} />
      </div>
    );
  }

  const stats = [
    { label: "Completed Trips", value: String(data.trips) },
    { label: "Online Time", value: data.onlineTime },
    { label: "Avg / Trip", value: naira(data.avgPerTrip) },
  ];

  return (
    <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6 pt-[calc(env(safe-area-inset-top,0px)+18px)]">
        <div className="w-full max-w-xl mx-auto">
          {/* header */}
          <div className="flex items-center justify-between px-6 h-9">
            <h1 className="text-[24px] font-semibold leading-9 text-[#2E2E2E]">
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
            <PeriodTabs tabs={data.tabs} active={subTab} onChange={setSubTab} />
          </div>

          <div className="px-6">
            {/* earning card */}
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="mt-[22px] flex h-[108px] w-full flex-col rounded-2xl border border-[#E8E6EB] bg-[#6E43A3] px-5 pt-[17px] text-left transition active:scale-[0.99]"
            >
              <div className="flex h-[18px] w-full items-center justify-between">
                <span className="text-[14px] leading-[18px] text-white/80">
                  Earning
                </span>
                <ChevronRight
                  size={22}
                  strokeWidth={1.5}
                  className="shrink-0 text-white/80"
                />
              </div>
              <span className="mt-[13px] text-[33px] font-bold leading-[40px] text-white">
                {naira(data.earning)}
              </span>
            </button>

            {/* stats row */}
            <div
              className={`mt-[22px] grid h-[68px] grid-cols-3 rounded-[11px] bg-white px-1 pt-[13.5px] text-center ${CARD_SHADOW}`}
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-[12px] leading-4 text-[#6B7A99]">
                    {s.label}
                  </p>
                  <p className="mt-px text-[17px] font-bold leading-[22px] text-[#1D2939]">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* chart */}
            <div className="mt-[22px]">
              <BarChart data={data} />
            </div>

            {/* withdraw card */}
            <div
              className={`mt-[23px] rounded-[11px] border border-[#F2F4F7] bg-white px-[15px] pb-[13.5px] pt-[13px] ${CARD_SHADOW}`}
            >
              <p className="text-[12px] leading-4 text-[#6B7A99]">
                Available to Withdraw
              </p>
              <p className="mt-[3px] text-[26px] font-bold leading-8 text-[#1D2939]">
                {naira(WITHDRAWABLE)}
              </p>
              <p className="mt-1 text-[12px] leading-4 text-[#6B7A99]">
                Next auto-payout:{" "}
                <span className="text-[#1D2939]">{NEXT_PAYOUT}</span>
              </p>
              <button
                type="button"
                className="mt-[15.5px] h-[41px] w-full rounded-[10px] bg-[#6E43A3] text-[15px] font-semibold text-white transition active:scale-[0.99]"
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
