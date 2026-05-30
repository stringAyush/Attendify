'use client';

import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OfflineBanner
 *
 * Renders a non-intrusive banner at the top of the viewport when the
 * device loses internet connectivity. Disappears automatically when
 * connection is restored.
 *
 * Drop this inside the root layout so it covers every page.
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2 shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          {/* Wifi-off icon */}
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 000-5.656M2 2l20 20M9.172 9.172A4 4 0 006 12m-1.93-3.07A9 9 0 003.515 7.05"
            />
          </svg>
          <span>You're offline — changes will sync when you reconnect.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
