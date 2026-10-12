import { useQuery } from "@tanstack/react-query";
import { fetchCities, fetchStates } from "../api/locations";

export function useStates() {
  return useQuery({
    queryKey: ["locations", "states"],
    queryFn: fetchStates,
    staleTime: 1000 * 60 * 60,
  });
}

export function useCities(stateId: string) {
  return useQuery({
    queryKey: ["locations", "cities", stateId],
    queryFn: () => fetchCities(stateId),
    enabled: !!stateId,
    staleTime: 1000 * 60 * 60,
  });
}
