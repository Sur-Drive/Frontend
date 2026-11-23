'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks whether the `.dark` class is currently present on <html>.
 *
 * Initial state is read from the DOM on mount (the server layout sets the
 * class from the theme cookie before first paint, so no flash). A
 * MutationObserver on the root element's class attribute keeps the hook in
 * sync whenever anything toggles dark mode, including imperative
 * `classList.toggle('dark', …)` calls elsewhere in the app. No dependency on
 * next-themes — hand-rolled per the Phase-1 decision.
 */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
