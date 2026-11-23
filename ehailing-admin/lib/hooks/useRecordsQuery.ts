"use client";

import { useEffect, useRef, useState } from "react";
import { PAGE_SIZE } from "@/components/ui/Pagination";

// Server-side counterpart to useRecordsList: the backend does the filtering,
// so this hook owns search input + debounce, filter values, page resets,
// pagination totals, loading/error states and stale-response protection.
const SEARCH_DEBOUNCE_MS = 400;

// Sentinel meaning "no restriction" for every filter (matches useRecordsList).
const ALL = "all";

export interface ServerPage<T> {
  items: T[];
  total: number;
  totalPages: number;
}

export interface RecordsQueryState {
  page: number;
  pageSize: number;
  query: string;
  filters: Record<string, string>;
}

interface UseRecordsQueryOptions<T> {
  // Filter keys are initialised to the ALL sentinel; values map to confirmed
  // backend query params inside the view's fetchPage.
  filterKeys: string[];
  pageSize?: number;
  fetchPage: (
    state: RecordsQueryState,
    signal: AbortSignal,
  ) => Promise<ServerPage<T>>;
}

interface RecordsQueryResult<T> {
  query: string;
  setQuery: (value: string) => void;
  filterValues: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  page: number;
  setPage: (page: number) => void;
  rows: T[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  retry: () => void;
  updateRows: (updater: (current: T[]) => T[]) => void;
}

export function useRecordsQuery<T>({
  filterKeys,
  pageSize = PAGE_SIZE,
  fetchPage,
}: UseRecordsQueryOptions<T>): RecordsQueryResult<T> {
  const [query, setQueryState] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () => Object.fromEntries(filterKeys.map((key) => [key, ALL])),
  );
  const [page, setPageState] = useState(1);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const committedQueryRef = useRef("");
  // Always call the latest fetchPage without making it an effect dependency
  // (views build it inline, so its identity changes every render). Synced in
  // an effect because refs must not be written during render.
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  }, [fetchPage]);

  // Debounced search commit; committing a different value resets to page 1
  // and marks the list as loading for the refetch it triggers.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (query !== committedQueryRef.current) {
        committedQueryRef.current = query;
        setDebouncedQuery(query);
        setPageState(1);
        setLoading(true);
        setError(null);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  function setQuery(value: string) {
    setQueryState(value);
  }

  function setFilter(key: string, value: string) {
    setFilterValues((current) => ({ ...current, [key]: value }));
    setPageState(1);
    setLoading(true);
    setError(null);
  }

  function clearFilters() {
    setFilterValues(
      Object.fromEntries(filterKeys.map((key) => [key, ALL])),
    );
    setPageState(1);
    setLoading(true);
    setError(null);
  }

  function setPage(next: number) {
    const target = Math.max(1, next);
    if (target === page) return;
    setPageState(target);
    setLoading(true);
    setError(null);
  }

  function retry() {
    setLoading(true);
    setError(null);
    setRetryToken((token) => token + 1);
  }

  // Local-only row patch for the existing optimistic action handlers (drawer
  // actions stay unwired this round; the change lasts until the next fetch).
  function updateRows(updater: (current: T[]) => T[]) {
    setRows(updater);
  }

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    // Loading/error transitions happen in the async callbacks and in the
    // event handlers above — never synchronously inside this effect.
    fetchPageRef
      .current(
        { page, pageSize, query: debouncedQuery, filters: filterValues },
        controller.signal,
      )
      .then((result) => {
        if (cancelled) return;
        const nextTotalPages = Number(result.totalPages) || 0;
        // Clamp when the list shrank below the current page.
        if (nextTotalPages >= 1 && page > nextTotalPages) {
          setPageState(nextTotalPages);
        }
        setRows(Array.isArray(result.items) ? result.items : []);
        setTotal(Number(result.total) || 0);
        setTotalPages(nextTotalPages);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : "Request failed. Please try again.",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
    // filters identity changes only when a filter is actually updated.
  }, [debouncedQuery, filterValues, page, pageSize, retryToken]);

  const activeFilterCount = Object.values(filterValues).filter(
    (value) => value !== ALL,
  ).length;

  return {
    query,
    setQuery,
    filterValues,
    setFilter,
    clearFilters,
    activeFilterCount,
    page,
    setPage,
    rows,
    total,
    totalPages,
    loading,
    error,
    retry,
    updateRows,
  };
}
