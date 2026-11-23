"use client";

import { useMemo, useState } from "react";
import { PAGE_SIZE } from "@/components/ui/Pagination";

// Sentinel meaning "no restriction" for the status select and every filter.
const ALL = "all";

interface UseRecordsListOptions<T> {
  rows: T[];
  // Case-insensitive substring search over this text.
  searchText: (row: T) => string;
  // Value compared against the current status (both use the ALL sentinel for "any").
  statusOf?: (row: T) => string;
  // Each key is a filter; the predicate receives the row and the chosen value.
  filters?: Record<string, (row: T, value: string) => boolean>;
  pageSize?: number;
}

interface RecordsListResult<T> {
  query: string;
  setQuery: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  filterValues: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  page: number;
  setPage: (page: number) => void;
  filtered: T[];
  pageRows: T[];
  total: number;
}

// Shared list state for records pages: search, status, extra filters and
// pagination. Any change to query/status/filters resets to page 1, and the
// page is clamped whenever the filtered total shrinks.
export function useRecordsList<T>({
  rows,
  searchText,
  statusOf,
  filters = {},
  pageSize = PAGE_SIZE,
}: UseRecordsListOptions<T>): RecordsListResult<T> {
  const [query, setQueryState] = useState("");
  const [status, setStatusState] = useState<string>(ALL);
  const [filterValues, setFilterValuesState] = useState<Record<string, string>>(
    () => Object.fromEntries(Object.keys(filters).map((key) => [key, ALL])),
  );
  const [page, setPageState] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== ALL && statusOf && statusOf(row) !== status) return false;
      for (const [key, value] of Object.entries(filterValues)) {
        if (value === ALL) continue;
        const matches = filters[key];
        if (matches && !matches(row, value)) return false;
      }
      if (needle && !searchText(row).toLowerCase().includes(needle)) return false;
      return true;
    });
    // filters/searchText/statusOf are usually inline closures; their identity
    // changing only re-filters, which is cheap and always correct.
  }, [rows, query, status, statusOf, filters, filterValues, searchText]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const activeFilterCount = Object.values(filterValues).filter(
    (value) => value !== ALL,
  ).length;

  function setQuery(value: string) {
    setQueryState(value);
    setPageState(1);
  }

  function setStatus(value: string) {
    setStatusState(value);
    setPageState(1);
  }

  function setFilter(key: string, value: string) {
    setFilterValuesState((prev) => ({ ...prev, [key]: value }));
    setPageState(1);
  }

  function clearFilters() {
    setFilterValuesState(
      Object.fromEntries(Object.keys(filters).map((key) => [key, ALL])),
    );
    setPageState(1);
  }

  function setPage(next: number) {
    setPageState(Math.max(1, next));
  }

  return {
    query,
    setQuery,
    status,
    setStatus,
    filterValues,
    setFilter,
    clearFilters,
    activeFilterCount,
    page: currentPage,
    setPage,
    filtered,
    pageRows,
    total,
  };
}
