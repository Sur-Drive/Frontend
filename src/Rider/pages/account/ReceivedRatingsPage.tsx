import { ChevronLeft, Loader2, Star } from "lucide-react";
import { useReceivedRatings } from "../../hooks/useRatings";

interface Props {
  onBack: () => void;
}

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        className={
          n <= Math.round(value)
            ? "fill-[#F4C542] text-[#F4C542]"
            : "fill-transparent text-gray-300"
        }
      />
    ))}
  </span>
);

/** Account → "Rate us": the ratings passengers have given this driver. */
export default function ReceivedRatingsPage({ onBack }: Props) {
  const q = useReceivedRatings();
  const items = (q.data?.pages ?? []).flatMap((p) => p.items);
  const avg = items.length
    ? items.reduce((sum, r) => sum + r.stars, 0) / items.length
    : 0;
  const counts = [5, 4, 3, 2, 1].map((n) => ({
    n,
    c: items.filter((r) => Math.round(r.stars) === n).length,
  }));
  const failed = (q.data?.pages ?? []).reduce((s, p) => s + p.failed, 0);

  return (
    <div className="font-outfit flex h-full w-full flex-col overflow-hidden bg-[#F7F8FA]">
      <div className="flex shrink-0 items-center gap-3 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <button type="button" onClick={onBack} aria-label="Back" className="text-[#1F2937]">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-sm font-bold text-[#1F2937] sm:text-base">
          My ratings
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">
        <div className="mx-auto w-full max-w-xl">
          {q.isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 size={22} className="animate-spin text-[#6E43A3]" />
            </div>
          )}

          {q.error && (
            <div className="flex items-center justify-between rounded-xl bg-[#FEF3F2] px-4 py-3 text-xs text-[#B42318]">
              <span>{(q.error as Error).message}</span>
              <button type="button" onClick={() => q.refetch()} className="font-semibold underline">
                Retry
              </button>
            </div>
          )}

          {!q.isLoading && !q.error && (
            <>
              {/* summary */}
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-[12px] text-[#9AA5B8] sm:text-[13px]">
                  Passenger rating
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-[#1F2937]">
                    {avg.toFixed(1)}
                  </span>
                  <div>
                    <Stars value={avg} size={16} />
                    <p className="mt-0.5 text-[12px] text-[#9AA5B8]">
                      {items.length} {items.length === 1 ? "rating" : "ratings"}
                    </p>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {counts.map(({ n, c }) => (
                      <div key={n} className="flex items-center gap-2 text-[11px] text-[#6B7A99]">
                        <span className="w-3 text-right">{n}</span>
                        <Star size={10} className="fill-[#F4C542] text-[#F4C542]" />
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-[#6E43A3]"
                            style={{ width: `${(c / items.length) * 100}%` }}
                          />
                        </div>
                        <span className="w-5 text-right">{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length === 0 && (
                <p className="mt-8 text-center text-[13px] text-[#9AA5B8]">
                  No passenger ratings yet.
                </p>
              )}

              {/* list */}
              <div className="mt-3 flex flex-col gap-3">
                {items.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-bold text-[#1F2937]">
                        {r.passenger}
                      </p>
                      <span className="shrink-0 text-[11px] text-[#9AA5B8]">{r.date}</span>
                    </div>
                    <div className="mt-1">
                      <Stars value={r.stars} />
                    </div>
                    {r.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-[#6E43A3]/30 bg-[#6E43A3]/10 px-2.5 py-1 text-[11px] font-medium text-[#6E43A3]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {r.comment && (
                      <p className="mt-2 text-[13px] leading-5 text-[#4B5768]">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>

              {failed > 0 && (
                <p className="mt-3 text-center text-[11px] text-[#9AA5B8]">
                  {failed} ride{failed === 1 ? "" : "s"} couldn't be loaded.
                </p>
              )}

              {q.hasNextPage && (
                <button
                  type="button"
                  onClick={() => q.fetchNextPage()}
                  disabled={q.isFetchingNextPage}
                  className="mt-4 h-[41px] w-full rounded-[10px] border border-[#6E43A3] text-[14px] font-semibold text-[#6E43A3] disabled:opacity-60"
                >
                  {q.isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
