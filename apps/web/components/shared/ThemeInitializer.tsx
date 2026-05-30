'use client';

import { useEffect } from 'react';

/**
 * Reads the saved theme preference from localStorage and applies
 * it to <html> on client mount — prevents FOUC without unconditionally
 * wiping the dark class (which was the old bug).
 */
export default function ThemeInitializer() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('attendify-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const useDark = saved === 'dark' || (!saved && prefersDark);

      if (useDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — leave as-is
    }
  }, []);

  return null;
}
