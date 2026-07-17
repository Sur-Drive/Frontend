import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEmergencyContacts,
  getPrimaryEmergencyContact,
  getEmergencyContact,
  createEmergencyContact,
  updateEmergencyContact,
  setPrimaryEmergencyContact,
  deleteEmergencyContact,
} from '../api/emergencyContacts'

const contactKeys = {
  all: ['emergency-contacts'] as const,
  primary: ['emergency-contacts', 'primary'] as const,
  detail: (id: string) => ['emergency-contacts', id] as const,
}

export function useEmergencyContacts() {
  return useQuery({ queryKey: contactKeys.all, queryFn: getEmergencyContacts })
}

export function usePrimaryEmergencyContact() {
  return useQuery({ queryKey: contactKeys.primary, queryFn: getPrimaryEmergencyContact })
}

export function useEmergencyContact(contactId: string | null) {
  return useQuery({
    queryKey: contactId ? contactKeys.detail(contactId) : ['emergency-contacts', 'detail-none'],
    queryFn: () => getEmergencyContact(contactId as string),
    enabled: !!contactId,
  })
}

export function useCreateEmergencyContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmergencyContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all })
      queryClient.invalidateQueries({ queryKey: contactKeys.primary })
    },
  })
}

export function useUpdateEmergencyContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEmergencyContact,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all })
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: contactKeys.primary })
    },
  })
}

export function useSetPrimaryEmergencyContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setPrimaryEmergencyContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all })
      queryClient.invalidateQueries({ queryKey: contactKeys.primary })
    },
  })
}

export function useDeleteEmergencyContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEmergencyContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all })
      queryClient.invalidateQueries({ queryKey: contactKeys.primary })
    },
  })
}