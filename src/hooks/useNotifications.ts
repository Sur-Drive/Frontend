import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import { api, ApiError } from '../lib/apiClient'

// ============================================================
// Types
// ============================================================

export interface NotificationPreferences {
  push: boolean
  email: boolean
  sms: boolean
  hazardTypes: string[]
  radius: number
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: Record<string, unknown>
}

export interface NotificationsListParams {
  limit?: number
  offset?: number
  isRead?: boolean
  type?: string
}

export interface NotificationsListResponse {
  notifications: NotificationItem[]
  total: number
}

// CHANGED: added 'web' so browser push subscriptions can be registered
// through the same endpoint as native FCM tokens.
export type DevicePlatform = 'android' | 'ios' | 'web'

// ============================================================
// Query keys
// ============================================================

export const notificationKeys = {
  all: ['notifications'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  list: (params: NotificationsListParams) => [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  recent: (limit: number) => [...notificationKeys.all, 'recent', limit] as const,
}

// ============================================================
// Preferences: GET /notifications/preferences, PATCH /notifications/preferences
// ============================================================

async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  return api.get<NotificationPreferences>('/notifications/preferences')
}

export function useNotificationPreferences(
  options?: Omit<UseQueryOptions<NotificationPreferences>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: fetchNotificationPreferences,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 3
    },
    ...options,
  })
}

async function updateNotificationPreferences(
  payload: Partial<NotificationPreferences>
): Promise<void> {
  await api.patch('/notifications/preferences', payload)
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences() })
      const previous = queryClient.getQueryData<NotificationPreferences>(
        notificationKeys.preferences()
      )
      if (previous) {
        queryClient.setQueryData(notificationKeys.preferences(), { ...previous, ...payload })
      }
      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.preferences(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() })
    },
  })
}

// ============================================================
// Device token: POST /notifications/device-token, DELETE /notifications/device-token
// ============================================================

async function registerDeviceToken(payload: { token: string; platform: DevicePlatform }) {
  return api.post('/notifications/device-token', payload)
}

export function useRegisterDeviceToken() {
  return useMutation({
    mutationFn: registerDeviceToken,
  })
}

async function unregisterDeviceToken(payload: { token: string }) {
  return api.delete('/notifications/device-token', payload)
}

export function useUnregisterDeviceToken() {
  return useMutation({
    mutationFn: unregisterDeviceToken,
  })
}

// ============================================================
// Notifications list: GET /notifications
// ============================================================

async function fetchNotifications(
  params: NotificationsListParams
): Promise<NotificationsListResponse> {
  return api.get<NotificationsListResponse>('/notifications', {
    params: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      isRead: params.isRead,
      type: params.type,
    },
  })
}

export function useNotificationsList(params: NotificationsListParams = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
  })
}

// ============================================================
// Unread count: GET /notifications/unread-count
// ============================================================

async function fetchUnreadCount(): Promise<{ count: number }> {
  return api.get<{ count: number }>('/notifications/unread-count')
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
  })
}

// ============================================================
// Recent notifications: GET /notifications/recent
// ============================================================

async function fetchRecentNotifications(limit: number): Promise<NotificationItem[]> {
  return api.get<NotificationItem[]>('/notifications/recent', {
    params: { limit },
  })
}

export function useRecentNotifications(limit = 5) {
  return useQuery({
    queryKey: notificationKeys.recent(limit),
    queryFn: () => fetchRecentNotifications(limit),
  })
}

// ============================================================
// Mark all read: PATCH /notifications/mark-all-read
// ============================================================

async function markAllRead(): Promise<{ success: boolean }> {
  return api.patch<{ success: boolean }>('/notifications/mark-all-read')
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

// ============================================================
// Delete notification: DELETE /notifications/{id}
// ============================================================

async function deleteNotification(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/notifications/${id}`)
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}






// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import type { UseQueryOptions } from '@tanstack/react-query'
// import { api, ApiError } from '../lib/apiClient'

// // ============================================================
// // Types
// // ============================================================

// export interface NotificationPreferences {
//   push: boolean
//   email: boolean
//   sms: boolean
//   hazardTypes: string[]
//   radius: number
// }

// export interface NotificationItem {
//   id: string
//   type: string
//   title: string
//   message: string
//   isRead: boolean
//   createdAt: string
//   data?: Record<string, unknown>
// }

// export interface NotificationsListParams {
//   limit?: number
//   offset?: number
//   isRead?: boolean
//   type?: string
// }

// export interface NotificationsListResponse {
//   notifications: NotificationItem[]
//   total: number
// }

// export type DevicePlatform = 'android' | 'ios'

// // ============================================================
// // Query keys
// // ============================================================

// export const notificationKeys = {
//   all: ['notifications'] as const,
//   preferences: () => [...notificationKeys.all, 'preferences'] as const,
//   list: (params: NotificationsListParams) => [...notificationKeys.all, 'list', params] as const,
//   unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
//   recent: (limit: number) => [...notificationKeys.all, 'recent', limit] as const,
// }

// // ============================================================
// // Preferences: GET /notifications/preferences, PATCH /notifications/preferences
// // ============================================================

// async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
//   return api.get<NotificationPreferences>('/notifications/preferences')
// }

// export function useNotificationPreferences(
//   options?: Omit<UseQueryOptions<NotificationPreferences>, 'queryKey' | 'queryFn'>
// ) {
//   return useQuery({
//     queryKey: notificationKeys.preferences(),
//     queryFn: fetchNotificationPreferences,
//     retry: (failureCount, error) => {
//       if (error instanceof ApiError && error.status === 404) return false
//       return failureCount < 3
//     },
//     ...options,
//   })
// }

// async function updateNotificationPreferences(
//   payload: Partial<NotificationPreferences>
// ): Promise<void> {
//   // NOTE: the backend's PATCH /notifications/preferences currently returns
//   // the full User record (with preferences nested under `notificationPreferences`,
//   // plus fields like password/refreshToken that shouldn't be in the response at all)
//   // instead of the preferences object itself. Until that's fixed server-side,
//   // we deliberately ignore the response body and rely on the follow-up GET
//   // (via onSettled -> invalidateQueries) to get the real, current preferences.
//   await api.patch('/notifications/preferences', payload)
// }

// export function useUpdateNotificationPreferences() {
//   const queryClient = useQueryClient()

//   return useMutation({
//     mutationFn: updateNotificationPreferences,
//     // Optimistic update so toggles feel instant
//     onMutate: async (payload) => {
//       await queryClient.cancelQueries({ queryKey: notificationKeys.preferences() })
//       const previous = queryClient.getQueryData<NotificationPreferences>(
//         notificationKeys.preferences()
//       )
//       if (previous) {
//         queryClient.setQueryData(notificationKeys.preferences(), { ...previous, ...payload })
//       }
//       return { previous }
//     },
//     onError: (_err, _payload, context) => {
//       if (context?.previous) {
//         queryClient.setQueryData(notificationKeys.preferences(), context.previous)
//       }
//     },
//     onSettled: () => {
//       queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() })
//     },
//   })
// }

// // ============================================================
// // Device token: POST /notifications/device-token, DELETE /notifications/device-token
// // ============================================================

// async function registerDeviceToken(payload: { token: string; platform: DevicePlatform }) {
//   return api.post('/notifications/device-token', payload)
// }

// export function useRegisterDeviceToken() {
//   return useMutation({
//     mutationFn: registerDeviceToken,
//   })
// }

// async function unregisterDeviceToken(payload: { token: string }) {
//   return api.delete('/notifications/device-token', payload)
// }

// export function useUnregisterDeviceToken() {
//   return useMutation({
//     mutationFn: unregisterDeviceToken,
//   })
// }

// // ============================================================
// // Notifications list: GET /notifications
// // ============================================================

// async function fetchNotifications(
//   params: NotificationsListParams
// ): Promise<NotificationsListResponse> {
//   return api.get<NotificationsListResponse>('/notifications', {
//     params: {
//       limit: params.limit ?? 20,
//       offset: params.offset ?? 0,
//       isRead: params.isRead,
//       type: params.type,
//     },
//   })
// }

// export function useNotificationsList(params: NotificationsListParams = {}) {
//   return useQuery({
//     queryKey: notificationKeys.list(params),
//     queryFn: () => fetchNotifications(params),
//   })
// }

// // ============================================================
// // Unread count: GET /notifications/unread-count
// // ============================================================

// async function fetchUnreadCount(): Promise<{ count: number }> {
//   return api.get<{ count: number }>('/notifications/unread-count')
// }

// export function useUnreadCount() {
//   return useQuery({
//     queryKey: notificationKeys.unreadCount(),
//     queryFn: fetchUnreadCount,
//     // handy for a badge that stays fresh
//     refetchInterval: 30_000,
//   })
// }

// // ============================================================
// // Recent notifications: GET /notifications/recent
// // ============================================================

// async function fetchRecentNotifications(limit: number): Promise<NotificationItem[]> {
//   return api.get<NotificationItem[]>('/notifications/recent', {
//     params: { limit },
//   })
// }

// export function useRecentNotifications(limit = 5) {
//   return useQuery({
//     queryKey: notificationKeys.recent(limit),
//     queryFn: () => fetchRecentNotifications(limit),
//   })
// }

// // ============================================================
// // Mark all read: PATCH /notifications/mark-all-read
// // ============================================================

// async function markAllRead(): Promise<{ success: boolean }> {
//   return api.patch<{ success: boolean }>('/notifications/mark-all-read')
// }

// export function useMarkAllRead() {
//   const queryClient = useQueryClient()

//   return useMutation({
//     mutationFn: markAllRead,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: notificationKeys.all })
//     },
//   })
// }

// // ============================================================
// // Delete notification: DELETE /notifications/{id}
// // ============================================================

// async function deleteNotification(id: string): Promise<{ success: boolean }> {
//   return api.delete<{ success: boolean }>(`/notifications/${id}`)
// }

// export function useDeleteNotification() {
//   const queryClient = useQueryClient()

//   return useMutation({
//     mutationFn: deleteNotification,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: notificationKeys.all })
//     },
//   })
// }