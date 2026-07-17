import { api } from '../lib/apiClient'

export interface EmergencyContactDto {
  id: string
  fullName: string
  phoneNumber: string
  email: string
  gender: 'Male' | 'Female' | 'Others'
  relationship: string
  isPrimary: boolean
}

export interface EmergencyContactInput {
  fullName: string
  phoneNumber: string
  email?: string
  gender: 'Male' | 'Female' | 'Others'
  relationship: string
  isPrimary?: boolean
}

export const getEmergencyContacts = () =>
  api.get<EmergencyContactDto[]>('/driver/emergency-contacts')

export const getPrimaryEmergencyContact = () =>
  api.get<EmergencyContactDto>('/driver/emergency-contacts/primary')

export const getEmergencyContact = (contactId: string) =>
  api.get<EmergencyContactDto>(`/driver/emergency-contacts/${contactId}`)

export const createEmergencyContact = (data: EmergencyContactInput) =>
  api.post<EmergencyContactDto>('/driver/emergency-contacts', data)

export const updateEmergencyContact = ({
  id,
  ...payload
}: EmergencyContactInput & { id: string }) =>
  api.put<EmergencyContactDto>(`/driver/emergency-contacts/${id}`, payload)

export const setPrimaryEmergencyContact = (contactId: string) =>
  api.patch<EmergencyContactDto>(`/driver/emergency-contacts/${contactId}/primary`)

export const deleteEmergencyContact = (contactId: string) =>
  api.delete<void>(`/driver/emergency-contacts/${contactId}`)