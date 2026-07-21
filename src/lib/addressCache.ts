interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const PREFIX = 'surdrive:places:'
const TTL_MS = 12 * 60 * 60 * 1000 // 12 hours — address suggestions don't change often

function cacheKey(query: string, country: string): string {
  return `${PREFIX}${country}:${query.trim().toLowerCase()}`
}

export function getCachedPredictions<T>(query: string, country: string): T | null {
  try {
    const raw = localStorage.getItem(cacheKey(query, country))
    if (!raw) return null

    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(cacheKey(query, country))
      return null
    }
    return entry.value
  } catch {
    // Corrupt entry, private-browsing mode, storage disabled — cache is a
    // pure optimization, never let it break the actual search.
    return null
  }
}

export function setCachedPredictions<T>(query: string, country: string, value: T): void {
  try {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + TTL_MS }
    localStorage.setItem(cacheKey(query, country), JSON.stringify(entry))
  } catch {
    // Storage full/unavailable — safe to ignore.
  }
}
