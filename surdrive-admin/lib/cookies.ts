// ---------------------------------------------------------------------------
// Minimal client-side cookie helpers (document.cookie based).
// Non-httpOnly on purpose: this admin build authenticates from the client and
// middleware reads the plain, non-httpOnly cookie on /admin/* requests.
// ---------------------------------------------------------------------------

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, maxAgeSeconds?: number): void {
  if (typeof document === 'undefined') return;
  const maxAge = typeof maxAgeSeconds === 'number' ? `; max-age=${maxAgeSeconds}` : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/${maxAge}; SameSite=Lax`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}