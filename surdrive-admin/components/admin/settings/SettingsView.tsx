'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  useAdminUser,
  displayValue,
  UNKNOWN_DISPLAY,
} from '@/components/admin/AdminUserContext';
import { ChevronDownIcon } from '@/components/ui/icons/ChevronDownIcon';
import { Toggle } from '@/components/ui/Toggle';
import { Toast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api';
import { changePassword, updateProfile } from '@/lib/accounts';
import { getCookie, setCookie } from '@/lib/cookies';
import {
  NOTIFICATION_SETTINGS,
  PROFILE,
  ROLES,
  type NotificationSetting,
} from './mockData';

const SAVE_BUTTON_CLASS =
  'rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60';

const FIELD_CLASS =
  'w-full rounded-lg border border-line-pill bg-surface-card px-3.5 py-2.5 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-placeholder focus:border-brand-primary';

// Fields the API does not let the user edit yet (see the docstring below):
// visually muted + non-interactive while they stay in the design.
const READONLY_FIELD_CLASS = `${FIELD_CLASS} cursor-not-allowed bg-surface-hover text-ink-tertiary`;

/** Per-field validation message under an input. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-status-danger-text">{message}</span>;
}

/**
 * Reads the local notificationPrefs cookie (written on every toggle below) into
 * the notifications state. Falls back to the design defaults when the cookie is
 * missing, malformed, or shaped wrong — a corrupt cookie must never break the
 * page. Client-side only persistence; the real source of truth stays the
 * backend once its endpoint exists.
 */
function loadNotificationPrefs(): NotificationSetting[] {
  const raw = getCookie('notificationPrefs');
  if (!raw) return NOTIFICATION_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return NOTIFICATION_SETTINGS;
    return parsed.map((entry) => {
      const setting = entry as Partial<NotificationSetting> | null;
      const fallback =
        NOTIFICATION_SETTINGS.find((s) => s.id === setting?.id) ?? NOTIFICATION_SETTINGS[0];
      return {
        id: typeof setting?.id === 'string' ? setting.id : fallback.id,
        label: typeof setting?.label === 'string' ? setting.label : fallback.label,
        // description is display-only; always taken from the matching default.
        description: fallback.description,
        enabled: typeof setting?.enabled === 'boolean' ? setting.enabled : fallback.enabled,
      };
    });
  } catch {
    return NOTIFICATION_SETTINGS;
  }
}

/**
 * Profile Settings — personal info, notification toggles, password change.
 *
 * Wired endpoints:
 * - GET   /users/profile reads the logged-in user's own profile. AdminUserContext
 *   owns that fetch on mount; this view hydrates its inputs from it and disables
 *   them until it resolves, so an update can never be submitted against a blank
 *   or placeholder name.
 * - PATCH update-profile sends ONLY { firstName, lastName } — the only fields
 *   the UI can actually edit. The response also carries gender/dateOfBirth/
 *   occupation (no UI field; never sent) and role/phoneNumber/isPhoneVerified
 *   (server-managed; their inputs render disabled).
 * - POST change-password sends { currentPassword, newPassword, confirmPassword }.
 *
 * The Email / Phone / Role inputs are deliberately disabled — the profile
 * endpoint exposes no email field, and role/phone look server-managed
 * (isPhoneVerified suggests a separate phone-verification flow). Notification
 * toggles stay unwired until a backend endpoint is confirmed.
 */
export function SettingsView() {
  const { user, profile, isLoading, error, setProfile, refreshUser } = useAdminUser();

  // Seeded from the fetched profile below — never from the design mock.
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  /**
   * True once the inputs hold real fetched data. Gates both the inputs and the
   * submit handler, so a PATCH can never send a half-loaded (blank) name that
   * would silently wipe the user's real one.
   */
  const [hydrated, setHydrated] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationSetting[]>(NOTIFICATION_SETTINGS);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const savingProfileRef = useRef(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);
  const savingPasswordRef = useRef(false);

  /**
   * Re-sync the notification toggles from the local cookie once the page has
   * actually loaded in the browser (the declaration above starts from the design
   * defaults so server render and first client render agree).
   */
  useEffect(() => {
    setNotifications(loadNotificationPrefs());
  }, []);

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    variant?: 'success' | 'error';
  }>({ open: false, message: '', variant: 'success' });
  const closeToast = () => setToast((previous) => ({ ...previous, open: false }));

  /**
   * Hydrate the editable inputs from the fetched profile. Deliberately one-shot
   * (`hydrated` latch): a later `profile` change — a retry, or the optimistic
   * `setProfile` after a save — must not overwrite edits in progress.
   */
  useEffect(() => {
    if (hydrated || !profile) return;
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setHydrated(true);
  }, [hydrated, profile]);

  // Read-only by design — no confirmed endpoint makes these user-editable:
  // - email: absent from the profile response entirely, so there is no real
  //   value to show either. The mock address went with the rest of the design
  //   mock rather than being rendered as if it were the user's own.
  // - phone: read from the real profile (never the mock). The response carries
  //   isPhoneVerified alongside it, so changing it needs its own verification flow.
  // - role: server-managed; self-service role changes would be an access-control hole.
  const email = UNKNOWN_DISPLAY;
  const phone = displayValue(profile?.phoneNumber ?? '');
  const role = displayValue(user.role);
  /** Keep the real role visible even if it is missing from the fixed list. While
   *  the profile is loading there is no role yet, so the list stands alone rather
   *  than gaining a placeholder entry. */
  const roleOptions =
    ROLES.includes(role) || role === UNKNOWN_DISPLAY ? ROLES : [role, ...ROLES];

  /** Clears one field's message as soon as the user edits it. */
  const clearProfileError = (field: string) =>
    setProfileErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });

  const clearPasswordError = (field: string) =>
    setPasswordErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });

  const handleToggle = (id: string, checked: boolean) => {
    // TODO: persist notification preferences via API (endpoint not confirmed yet).
    // Local-only persistence via cookie in the meantime — see the effect below.
    setNotifications((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: checked } : setting,
      ),
    );
  };

  // Mirror the notification set to the cookie whenever it changes. Side effect
  // lives here rather than in the state updater so the updater stays pure.
  //
  // The guard compares against the module-level default array by identity: while
  // the state is still that exact object, the stored prefs have not loaded, and
  // persisting now would overwrite the cookie with the *default* toggle state —
  // the bug that made toggles appear to reset on every reload. An identity check
  // (rather than a mount/load flag) also holds through React Strict Mode's
  // dev-only double-invoke, where the effect can run a second time before the
  // loaded state has been applied: the state is still the default array then, so
  // the write is skipped.
  useEffect(() => {
    if (notifications === NOTIFICATION_SETTINGS) return; // still the unloaded default array — nothing to persist yet
    setCookie('notificationPrefs', JSON.stringify(notifications), 31536000);
  }, [notifications]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingProfileRef.current) return;
    // Guard the loading window: the PATCH replaces the names wholesale, so
    // submitting before hydration would overwrite the real name with a blank one.
    if (!hydrated) return;

    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    savingProfileRef.current = true;
    setSavingProfile(true);
    try {
      // Deliberately only the two editable fields — never gender/dateOfBirth/
      // occupation, and never email (not in the endpoint at all).
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      // Reflect immediately in Topbar / ProfileDropdown. The PATCH returns the
      // full profile, so this replaces it wholesale — an optimistic update over
      // the GET that hydrated us, not the source of truth itself.
      setProfile(updated);
      setToast({ open: true, message: 'Profile updated successfully', variant: 'success' });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      const message = apiError?.message ?? 'Could not update your profile. Please try again.';
      setToast({ open: true, message, variant: 'error' });

      // Prefer per-field messages when the API sends them; otherwise fall back
      // to a single form-level line so the error is never silent.
      const mapped: Record<string, string> = {};
      for (const field of ['firstName', 'lastName'] as const) {
        const fieldMessage = apiError?.fieldErrors?.[field];
        if (fieldMessage) mapped[field] = fieldMessage;
      }
      setProfileErrors(Object.keys(mapped).length > 0 ? mapped : { form: message });
    } finally {
      savingProfileRef.current = false;
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingPasswordRef.current) return;

    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword) errors.newPassword = 'New password is required';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm the new password';
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    savingPasswordRef.current = true;
    setSavingPassword(true);
    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({
        open: true,
        // The API's confirmation message, verbatim.
        message: response.message || 'Password changed successfully',
        variant: 'success',
      });
    } catch (error) {
      // A wrong current password arrives here with the API's own message
      // (apiFetch surfaces response.message) — shown verbatim, not genericized.
      const apiError = error instanceof ApiError ? error : null;
      const message = apiError?.message ?? 'Could not change your password. Please try again.';
      setToast({ open: true, message, variant: 'error' });

      // A rejected current password has no field in the errors map on most
      // backends, so it is anchored to the current-password input explicitly.
      const mapped: Record<string, string> = {};
      for (const field of ['currentPassword', 'newPassword', 'confirmPassword'] as const) {
        const fieldMessage = apiError?.fieldErrors?.[field];
        if (fieldMessage) mapped[field] = fieldMessage;
      }
      if (Object.keys(mapped).length === 0) {
        if (apiError?.status === 400 || apiError?.status === 401) {
          mapped.currentPassword = message;
        } else {
          mapped.form = message;
        }
      }
      setPasswordErrors(mapped);
    } finally {
      savingPasswordRef.current = false;
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Personal Information */}
      <section className="rounded-2xl border border-line-card bg-surface-card p-6 lg:col-span-7">
        <h2 className="text-lg font-semibold text-ink-primary">Personal Information</h2>
        <div className="mt-4 border-t border-line-card" />

        {/* Profile-load state. The inputs below stay locked until this resolves,
            so a save can never submit a blank name over the real one. */}
        {isLoading && (
          <p className="mt-5 flex items-center gap-2 text-xs font-medium text-ink-tertiary">
            <span
              className="h-3 w-3 animate-spin rounded-full border-2 border-line-pill border-t-brand-primary"
              aria-hidden="true"
            />
            Loading your profile…
          </p>
        )}

        {error && !isLoading && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-status-danger-bg px-4 py-3">
            <p className="text-xs font-medium text-status-danger-text">{error}</p>
            <button
              type="button"
              onClick={() => void refreshUser()}
              className="rounded-lg border border-status-danger-text px-3 py-1.5 text-xs font-semibold text-status-danger-text transition-colors hover:bg-status-danger-text hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Profile photo row */}
        <div className="mt-5 flex items-center gap-4">
          {/* TODO: wire Edit/Delete photo to real avatar upload */}
          <Image
            src={PROFILE.avatar}
            alt="Profile photo"
            width={64}
            height={64}
            className="h-16 w-16 rounded-2xl object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-ink-primary">Profile Photo</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-brand-primary px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary-hover"
              >
                Edit Photo
              </button>
              <button
                type="button"
                className="rounded-lg border border-line-pill bg-surface-card px-3.5 py-1.5 text-xs font-semibold text-ink-primary transition-colors hover:bg-surface-hover"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={handleProfileSubmit}
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-primary">First Name</span>
              <input
                type="text"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  clearProfileError('firstName');
                }}
                aria-invalid={Boolean(profileErrors.firstName)}
                disabled={!hydrated}
                aria-busy={!hydrated}
                className={hydrated ? FIELD_CLASS : READONLY_FIELD_CLASS}
              />
              <FieldError message={profileErrors.firstName} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-primary">Last Name</span>
              <input
                type="text"
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  clearProfileError('lastName');
                }}
                aria-invalid={Boolean(profileErrors.lastName)}
                disabled={!hydrated}
                aria-busy={!hydrated}
                className={hydrated ? FIELD_CLASS : READONLY_FIELD_CLASS}
              />
              <FieldError message={profileErrors.lastName} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-primary">Email Address</span>
            {/* Read-only: the update-profile response has no email field at all.
                Whether email is user-editable at all is pending backend confirmation. */}
            <input type="email" value={email} readOnly className={READONLY_FIELD_CLASS} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-primary">Phone Number</span>
            {/* Read-only: isPhoneVerified suggests changing a phone needs its own
                verification flow rather than this PATCH. */}
            <input type="tel" value={phone} readOnly className={READONLY_FIELD_CLASS} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-primary">Role</span>
            {/* Server-managed: never sent in the request body. */}
            <span className="relative block">
              <select
                value={role}
                disabled
                className={`${READONLY_FIELD_CLASS} appearance-none pr-10`}
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
            </span>
          </label>

          {profileErrors.form && (
            <p className="text-xs font-medium text-status-danger-text">{profileErrors.form}</p>
          )}

          <div className="mt-2 flex justify-end">
            <button type="submit" disabled={savingProfile || !hydrated} className={SAVE_BUTTON_CLASS}>
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      <div className="flex flex-col gap-6 lg:col-span-5">
        {/* Notifications Settings */}
        <section className="rounded-2xl border border-line-card bg-surface-card p-6">
          <h2 className="text-lg font-semibold text-ink-primary">Notifications Settings</h2>

          <div className="mt-5 flex flex-col gap-5">
            {notifications.map((setting) => (
              <div key={setting.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-primary">{setting.label}</p>
                  <p className="mt-0.5 text-xs text-ink-placeholder">{setting.description}</p>
                </div>
                <Toggle
                  checked={setting.enabled}
                  onChange={(checked) => handleToggle(setting.id, checked)}
                  label={setting.label}
                />
              </div>
            ))}
          </div>

          {/* TODO: wire Save Changes to real notification-preferences API */}
          <div className="mt-6 flex justify-end">
            <button type="button" className={SAVE_BUTTON_CLASS}>
              Save Changes
            </button>
          </div>
        </section>

        {/* Change Password */}
        <section className="rounded-2xl border border-line-card bg-surface-card p-6">
          <h2 className="text-lg font-semibold text-ink-primary">Change Password</h2>

          <form
            className="mt-5 flex flex-col gap-4"
            onSubmit={handlePasswordSubmit}
            noValidate
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-primary">Current Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  clearPasswordError('currentPassword');
                }}
                aria-invalid={Boolean(passwordErrors.currentPassword)}
                className={FIELD_CLASS}
              />
              <FieldError message={passwordErrors.currentPassword} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-primary">New Password</span>
              <input
                type="password"
                placeholder="Enter new password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  clearPasswordError('newPassword');
                  clearPasswordError('confirmPassword');
                }}
                aria-invalid={Boolean(passwordErrors.newPassword)}
                className={FIELD_CLASS}
              />
              <FieldError message={passwordErrors.newPassword} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-primary">Confirm New Password</span>
              <input
                type="password"
                placeholder="Re-enter new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearPasswordError('confirmPassword');
                }}
                aria-invalid={Boolean(passwordErrors.confirmPassword)}
                className={FIELD_CLASS}
              />
              <FieldError message={passwordErrors.confirmPassword} />
            </label>

            {passwordErrors.form && (
              <p className="text-xs font-medium text-status-danger-text">{passwordErrors.form}</p>
            )}

            <div className="mt-2 flex justify-end">
              <button type="submit" disabled={savingPassword} className={SAVE_BUTTON_CLASS}>
                {savingPassword ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={closeToast}
      />
    </div>
  );
}