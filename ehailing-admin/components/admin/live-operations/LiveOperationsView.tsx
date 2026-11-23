"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { PAGE_SIZE } from "@/components/ui/Pagination";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import {
  LIVE_POLL_INTERVAL_MS,
  createGlanceRefresher,
  createLivePoller,
  fetchLiveOperations,
  glanceReducer,
  initialGlanceState,
  mapLiveGlance,
  mapLiveQueueRow,
  updatedLabel,
} from "@/lib/live-operations";
import { LiveOperationsHeader } from "./LiveOperationsHeader";
import { LiveMapCard } from "./LiveMapCard";
import { OperationsGlance } from "./OperationsGlance";
import { LiveRideQueue } from "./LiveRideQueue";
import type { LiveMapData, LiveQueueRow } from "@/types/live-operations";

// Sentinel meaning "no status restriction" (matches useRecordsQuery).
const ALL = "all";

interface LiveOperationsViewProps {
  // Decorative SVG map data (lib/mock/live-operations-map.ts) — kept as is.
  map: LiveMapData;
}

// Owns every live-operations data source: the glance stats poll (single
// flight, 20s, paused while the tab is hidden) and the ride-queue query
// (server-side search / rideStatus / pagination via useRecordsQuery, which
// already provides debounce, abort-on-unmount and stale-response
// protection). The queue is polled through the hook's retry() only when no
// request is in flight, so refreshes never overlap and the last good data
// stays on screen while a refresh fails (small stale banner instead of a
// full error screen).
export function LiveOperationsView({ map }: LiveOperationsViewProps) {
  const [glance, dispatchGlance] = useReducer(glanceReducer, initialGlanceState);
  // Re-render cadence for the relative "Updated …" label (one per cycle);
  // read during render so the label never calls Date.now() in render.
  const [now, setNowTick] = useState(() => Date.now());
  const [queueLoaded, setQueueLoaded] = useState(false);

  const {
    query,
    setQuery,
    filterValues,
    setFilter,
    page,
    setPage,
    rows,
    total,
    loading,
    error,
    retry,
  } = useRecordsQuery<LiveQueueRow>({
    filterKeys: ["rideStatus"],
    fetchPage: async ({ page: nextPage, pageSize, query: search, filters }, signal) => {
      const result = await fetchLiveOperations(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          rideStatus: filters.rideStatus !== ALL ? filters.rideStatus : undefined,
        },
        signal,
      );
      // Loaded once a real response arrived (even with zero items) — the
      // flag separates "first load failed" (full error) from "refresh
      // failed" (stale banner over the last good data).
      setQueueLoaded(true);
      return {
        items: Array.isArray(result.items)
          ? result.items.map(mapLiveQueueRow)
          : [],
        total: Number(result.total) || 0,
        totalPages: Number(result.totalPages) || 0,
      };
    },
  });

  // Glance fetch: page=1&limit=1 — same endpoint, no queue filters, so the
  // counters never wobble when the queue is searched or filtered. Stats come
  // from the response's summary fields, never from an items array.
  const refresher = useMemo(
    () =>
      createGlanceRefresher(
        (signal) =>
          fetchLiveOperations({ page: 1, limit: 1 }, signal).then(mapLiveGlance),
        dispatchGlance,
      ),
    [dispatchGlance],
  );

  // Always-current mirrors for the poll closures (refs must not be written
  // during render).
  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  const retryRef = useRef(retry);
  useEffect(() => {
    retryRef.current = retry;
  }, [retry]);

  // One poll cycle, strictly sequential: glance request first, queue refresh
  // only after it settled and only while nothing else is in flight.
  const tick = useCallback(async () => {
    if (refresher.refresh()) {
      await refresher.settled();
      setNowTick(Date.now());
    }
    if (!refresher.busy && !loadingRef.current) retryRef.current();
  }, [refresher]);

  const pollerTick = useCallback(() => {
    void tick();
  }, [tick]);

  useEffect(() => {
    // The poller is created inside the effect: it owns the interval and the
    // visibility listener, both torn down on unmount together with the
    // in-flight glance request (refresher.abort()).
    const poller = createLivePoller({
      tick: pollerTick,
      isBusy: () => refresher.busy || loadingRef.current,
      intervalMs: LIVE_POLL_INTERVAL_MS,
    });
    poller.start();
    // First cycle deferred a tick so no state update runs synchronously in
    // the effect body; before it fires the cards simply show "—".
    const initialId = window.setTimeout(pollerTick, 0);
    return () => {
      window.clearTimeout(initialId);
      poller.stop();
      refresher.abort();
    };
  }, [pollerTick, refresher]);

  function setStatusFilter(value: string) {
    setFilter("rideStatus", value);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <LiveOperationsHeader stats={glance.data} rides={rows} />

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 lg:col-span-2">
          <LiveMapCard map={map} updatedLabel={updatedLabel(glance.updatedAt, now)} />
        </div>
        <div className="flex min-w-0">
          <OperationsGlance stats={glance.data} error={glance.error} stale={glance.stale} />
        </div>
      </div>

      <LiveRideQueue
        rides={rows}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        loadedOnce={queueLoaded}
        query={query}
        onQueryChange={setQuery}
        statusFilter={filterValues.rideStatus}
        onStatusFilterChange={setStatusFilter}
        onPageChange={setPage}
        onRetry={retry}
      />
    </div>
  );
}
