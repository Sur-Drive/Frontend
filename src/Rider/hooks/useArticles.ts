import { useQuery } from "@tanstack/react-query";
import { getArticle, searchArticles } from "../api/articles";

/** GET /articles/faq?q=...  — pass the (already debounced) search text. */
export function useArticles(q: string) {
  return useQuery({
    queryKey: ["articles", "faq", q.trim().toLowerCase()],
    queryFn: () => searchArticles(q),
    staleTime: 5 * 60_000,
    retry: 1,
    placeholderData: (prev) => prev, // keep the old list on screen while typing
  });
}

/** GET /articles/faq/:slug — pass null until the row is opened. */
export function useArticle(slug: string | null) {
  return useQuery({
    queryKey: ["articles", "faq", "detail", slug],
    queryFn: () => getArticle(slug as string),
    enabled: !!slug,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
