'use client';

// ---------------------------------------------------------------------------
// useTableFilters — reusable foundation for filtered lists.
//
// Holds search text (debounced ~300ms), status/tab filters, dropdown filters,
// date range and page; serializes active filters to the URL query string so
// filters survive a refresh and can be shared. Changing any filter resets
// pagination to page 1.
//
// Initial values are expected to arrive from the server page component (which
// reads them from `searchParams`), so there is no SSR/hydration mismatch and
// no `useSearchParams` Suspense requirement.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export type FilterMap = Record<string, string>;

export interface FilterPreset {
  /** URL query parameter name (also the local state key). */
  param: string;
  /** Human-readable label for chips / menus. */
  label: string;
  /** Value meaning "no filter". */
  defaultValue: string;
  /** Allowed values when this is a tab or dropdown; omitted for free text. */
  options?: string[];
}

export interface UseTableFiltersOptions {
  presets: FilterPreset[];
  /** Optional search field configuration. */
  search?: { param: string; debounceMs?: number };
  /** Optional pagination parameter. */
  page?: { param?: string; default?: number };
  /**
   * Initial values keyed by param name, typically read from the URL by the
   * server page component. Missing params fall back to each preset's default.
   */
  initial?: Record<string, string>;
}

export interface UseTableFiltersReturn {
  /** Current filter values keyed by param name (includes search when configured). */
  filters: FilterMap;
  /** Current page number. */
  page: number;
  /** Debounced search text — use this for data fetching. */
  debouncedSearch: string;
  /** Number of filters that differ from their default. */
  activeCount: number;
  /** True when any filter differs from its default. */
  hasActiveFilters: boolean;
  /** Change a non-search filter (resets page to 1 and rewrites the URL). */
  setFilter: (key: string, value: string) => void;
  /** Change the search text (debounced; resets page to 1 and rewrites the URL). */
  setSearch: (value: string) => void;
  /** Change the page (rewrites the URL only). */
  setPage: (value: number) => void;
  /** Reset every filter to its default, page to 1, rewrite the URL. */
  clearAll: () => void;
  /** True when `key` holds its default value. */
  isDefault: (key: string) => boolean;
}

const DEFAULT_DEBOUNCE_MS = 300;

export function useTableFilters({
  presets,
  search,
  page: pageOpt,
  initial = {},
}: UseTableFiltersOptions): UseTableFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParam = search?.param;
  const debounceMs = search?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const pageParam = pageOpt?.param ?? 'page';
  const pageDefault = pageOpt?.default ?? 1;

  const defaults: FilterMap = useMemo(() => {
    const d: FilterMap = {};
    for (const preset of presets) d[preset.param] = preset.defaultValue;
    if (searchParam) d[searchParam] = '';
    return d;
  }, [presets, searchParam]);

  // Initial state from the URL (supplied by the server page component).
  // The page param is deliberately skipped — it is tracked separately so it can
  // never be counted or serialized as a filter of its own.
  const initialFilters: FilterMap = useMemo(() => {
    const f: FilterMap = { ...defaults };
    for (const [param, value] of Object.entries(initial)) {
      if (param === pageParam) continue;
      const preset = presets.find((p) => p.param === param);
      const defaultValue = preset ? preset.defaultValue : '';
      // Validate enum-valued filters against their allowed options.
      if (preset?.options && !preset.options.includes(value)) continue;
      f[param] = value === '' ? defaultValue : value;
    }
    return f;
  }, [initial, defaults, presets, pageParam]);

  const initialPage = useMemo(() => {
    const raw = initial[pageParam];
    if (raw === undefined || raw === '') return pageDefault;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : pageDefault;
  }, [initial, pageParam, pageDefault]);

  const [filters, setFilters] = useState<FilterMap>(initialFilters);
  const [page, setPageState] = useState<number>(initialPage);
  const [searchText, setSearchText] = useState(filters[searchParam ?? ''] ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);

  const isMounted = useRef(false);
  const lastQuery = useRef<string>('');

  /**
   * Serialize filters + page to a query string. The search value is supplied
   * separately so the caller can write only the *debounced* text — the URL is
   * never rewritten per keystroke.
   */
  const buildQuery = useCallback(
    (nextFilters: FilterMap, nextPage: number, searchValue: string) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(nextFilters)) {
        if (searchParam && key === searchParam) continue;
        const preset = presets.find((p) => p.param === key);
        const defaultValue = preset ? preset.defaultValue : '';
        if (value === '' || value === defaultValue) continue;
        params.set(key, value);
      }
      if (searchParam && searchValue) params.set(searchParam, searchValue);
      if (nextPage !== pageDefault) params.set(pageParam, String(nextPage));
      return params.toString();
    },
    [presets, searchParam, pageParam, pageDefault],
  );

  /** Persist the current filter state to the URL (replace, no scroll). */
  const persist = useCallback(
    (nextFilters: FilterMap, nextPage: number, searchValue: string) => {
      const query = buildQuery(nextFilters, nextPage, searchValue);
      if (query === lastQuery.current) return;
      lastQuery.current = query;
      const href = query ? `${pathname}?${query}` : pathname;
      router.replace(href, { scroll: false });
    },
    [buildQuery, pathname, router],
  );

  // Keep the debounced search in sync.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchText, debounceMs]);

  // Whenever the debounced search lands, restart at page 1.
  useEffect(() => {
    if (!isMounted.current) return;
    setPageState(1);
  }, [debouncedSearch]);

  // Persist every committed state change (filters, page and the DEBOUNCED
  // search) to the URL. First mount is skipped — the effect below seeds
  // lastQuery with the URL-driven initial state instead, so a later
  // "Clear all" still rewrites the URL correctly.
  useEffect(() => {
    if (!isMounted.current) return;
    persist(filters, page, debouncedSearch);
  }, [filters, page, debouncedSearch, persist]);

  useEffect(() => {
    lastQuery.current = buildQuery(initialFilters, initialPage, searchText);
    isMounted.current = true;
    // Mount-only: buildQuery/initialFilters are stable for this lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = useCallback(
    (key: string, value: string) => {
      // Routing the search field through setFilter keeps the debounce chain
      // (searchText -> debouncedSearch) intact for callers that treat search
      // as just another filter key.
      if (searchParam && key === searchParam) {
        setSearchText(value);
        setFilters((prev) => ({ ...prev, [key]: value }));
        return;
      }
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPageState(1);
    },
    [searchParam],
  );

  const setSearch = useCallback((value: string) => {
    setSearchText(value);
    if (searchParam) setFilters((prev) => ({ ...prev, [searchParam]: value }));
  }, [searchParam]);

  const setPage = useCallback((value: number) => {
    setPageState(Math.max(1, value));
  }, []);

  const clearAll = useCallback(() => {
    setFilters({ ...defaults });
    setPageState(pageDefault);
    setSearchText('');
    setDebouncedSearch('');
  }, [defaults, pageDefault]);

  const activeCount = useMemo(() => {
    let n = 0;
    for (const [key, value] of Object.entries(filters)) {
      if (searchParam && key === searchParam) {
        if (value !== '') n++;
        continue;
      }
      const preset = presets.find((p) => p.param === key);
      const defaultValue = preset ? preset.defaultValue : '';
      if (value !== '' && value !== defaultValue) n++;
    }
    return n;
  }, [filters, presets, searchParam]);

  const hasActiveFilters = activeCount > 0;

  const isDefault = useCallback(
    (key: string) => {
      const preset = presets.find((p) => p.param === key);
      const defaultValue = preset ? preset.defaultValue : '';
      return filters[key] === '' || filters[key] === defaultValue;
    },
    [filters, presets],
  );

  return {
    filters,
    page,
    debouncedSearch,
    activeCount,
    hasActiveFilters,
    setFilter,
    setSearch,
    setPage,
    clearAll,
    isDefault,
  };
}