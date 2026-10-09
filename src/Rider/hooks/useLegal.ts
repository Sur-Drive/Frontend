import { useQuery } from "@tanstack/react-query";
import { getLegalDocument, type LegalDocKind } from "../api/legal";

export function useLegalDocument(kind: LegalDocKind, enabled = true) {
  return useQuery({
    queryKey: ["ride-driver", "legal", kind],
    queryFn: () => getLegalDocument(kind),
    enabled,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
