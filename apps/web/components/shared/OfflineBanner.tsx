'use client';

import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { AnimatePresence, motion } from 'framer-motion';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium px-4 py-2 flex items-center justify-center gap-2"
          role="alert"
          aria-live="assertive"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 000-5.656M2 2l20 20M9.172 9.172A4 4 0 006 12m-1.93-3.07A9 9 0 003.515 7.05" />
          </svg>
          <span>Offline — changes will sync when you reconnect</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
