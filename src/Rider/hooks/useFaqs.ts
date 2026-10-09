import { useQuery } from "@tanstack/react-query";
import { getFaq, getFaqs } from "../api/faqs";

export function useRideDriverFaqs() {
  return useQuery({
    queryKey: ["ride-driver", "faqs"],
    queryFn: getFaqs,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

/** Fetches one FAQ; pass enabled=false until the row is opened. */
export function useRideDriverFaq(id: string | null) {
  return useQuery({
    queryKey: ["ride-driver", "faqs", id],
    queryFn: () => getFaq(id as string),
    enabled: !!id,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
