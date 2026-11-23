// ---------------------------------------------------------------------------
// MOCK DATA — Settings page
// TODO: replace all of this with real auth-user data + API integration.
// ---------------------------------------------------------------------------
export type NotificationSetting = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

/**
 * The only design mock left on this page: the profile API exposes no avatar
 * field yet. The old firstName/lastName/email/phone/role mocks are gone on
 * purpose — those now come from GET /users/profile via AdminUserContext, and
 * keeping them here is exactly what made a saved update look like it reverted.
 */
export const PROFILE = {
  avatar: '/images/headshot.png',
};

export const ROLES = [
  'Super Administrator',
  'Administrator',
  'Moderator',
  'Verification Officer',
  'Content Manager',
];

export const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: 'email',
    label: 'Email Notification',
    description: 'Enable email notification updates',
    enabled: false,
  },
  {
    id: 'push',
    label: 'Push Notification',
    description: 'Enable desktop browser push updates',
    enabled: true,
  },
  {
    id: 'sos',
    label: 'SOS alerts',
    description: 'Enable desktop browser push updates for high priority warnings.',
    enabled: true,
  },
  {
    id: 'activity',
    label: 'Account Activity',
    description: 'Receive emails about log-ins.',
    enabled: true,
  },
];