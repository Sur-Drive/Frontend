import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "../api/emergencyContacts";

export const RIDE_DRIVER_EMERGENCY_CONTACTS_KEY = [
  "ride-driver",
  "emergency-contacts",
] as const;

export function useRideDriverEmergencyContacts() {
  return useQuery({
    queryKey: RIDE_DRIVER_EMERGENCY_CONTACTS_KEY,
    queryFn: getEmergencyContacts,
    enabled: !!localStorage.getItem("token"),
    staleTime: 30_000,
    retry: false,
  });
}

function useContactMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    // Setting a new primary changes other contacts too, so refetch the list.
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: RIDE_DRIVER_EMERGENCY_CONTACTS_KEY }),
  });
}

export const useAddRideDriverEmergencyContact = () =>
  useContactMutation(addEmergencyContact);

export const useUpdateRideDriverEmergencyContact = () =>
  useContactMutation(updateEmergencyContact);

export const useDeleteRideDriverEmergencyContact = () =>
  useContactMutation(deleteEmergencyContact);
