'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '@/lib/api';
import { getMyProfile, type AdminProfile } from '@/lib/accounts';

/**
 * AdminUserContext — the shared client-side user state.
 *
 * Why a context: the logged-in user's name/role are displayed in Topbar and
 * ProfileDropdown, and the Settings page edits that same data. Context lets a
 * successful profile PATCH update every display site immediately without any
 * prop drilling through the layout. It is client-side display state only —
 * auth itself stays in cookies (accessToken/refreshToken via lib/auth.ts).
 *
 * Hydration: the GET /users/profile response is the source of truth. Before it
 * resolves the user is deliberately EMPTY (never a design mock) so a stale
 * placeholder can't be mistaken for real data — that was the bug where a saved
 * update appeared to "revert" on reload, because nothing ever re-read it.
 */
type AdminUser = {
  firstName: string;
  lastName: string;
  role: string;
};

type AdminUserContextValue = {
  /**
   * Display view of the profile (name + role). Empty strings until the GET
   * resolves — use `formatFullName` / `displayValue` rather than rendering blanks.
   */
  user: AdminUser;
  /**
   * The full fetched profile, or null before the first successful load. Settings
   * reads the read-only fields (phoneNumber, role) from here so no mock value
   * can be mistaken for real data.
   */
  profile: AdminProfile | null;
  /** True while a profile GET is in flight (the first one, or a retry). */
  isLoading: boolean;
  /** Set when the profile GET failed (expired token, network, ...). */
  error: string | null;
  /**
   * Optimistic update straight from a profile-update response — the PATCH
   * returns the full profile, so this replaces it wholesale. Only a
   * convenience over the next GET, never the source of truth.
   */
  setProfile: (profile: AdminProfile) => void;
  /** Re-runs the profile GET — the recovery path after a failed load. */
  refreshUser: () => Promise<void>;
};

/** Neutral stand-in for a display value we do not have. Never mock data. */
export const UNKNOWN_DISPLAY = '—';

/** A display string, or the neutral placeholder when it is empty. */
export function displayValue(value: string): string {
  return value.trim() || UNKNOWN_DISPLAY;
}

/** "First Last", or the neutral placeholder while loading / after a failure. */
export function formatFullName(user: AdminUser): string {
  return displayValue(`${user.firstName} ${user.lastName}`);
}

const AdminUserContext = createContext<AdminUserContextValue | null>(null);

export function AdminUserProvider({ children }: { children: ReactNode }) {
  // The fetched profile is the single source of truth; `user` is derived below.
  const [profile, setProfileState] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await getMyProfile();
      setProfileState(fetched);
      setError(null);
    } catch (err) {
      // Three failure cases, deliberately distinguished:
      // - 401: the access token expired; a retry cannot help, only re-signing in.
      // - other API errors: the backend's own message is the useful one.
      // - anything else: a network/parse failure, where the raw TypeError text
      //   ("Failed to fetch") would be noise in the UI.
      const message =
        err instanceof ApiError
          ? err.status === 401
            ? 'Your session has expired. Sign in again to continue.'
            : err.message
          : 'Could not reach the server. Check your connection and try again.';
      // `profile` is deliberately left alone: on a failed retry the last known
      // good values stay on screen rather than flashing back to the placeholder.
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const setProfile = useCallback((next: AdminProfile) => {
    setProfileState(next);
    setError(null);
  }, []);

  const user = useMemo<AdminUser>(
    () => ({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      role: profile?.role ?? '',
    }),
    [profile],
  );

  const value = useMemo(
    () => ({ user, profile, isLoading, error, setProfile, refreshUser }),
    [user, profile, isLoading, error, setProfile, refreshUser],
  );

  return <AdminUserContext.Provider value={value}>{children}</AdminUserContext.Provider>;
}

export function useAdminUser(): AdminUserContextValue {
  const context = useContext(AdminUserContext);
  if (!context) {
    throw new Error('useAdminUser must be used inside AdminUserProvider');
  }
  return context;
}

/** Re-exported so consumers derive display values from one place. */
export type { AdminProfile } from '@/lib/accounts';
export type { AdminUser };
