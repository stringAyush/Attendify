'use client';

import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { AnimatePresence, motion } from 'framer-motion';
import * as Icon from '@/components/ui/icons';

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
          className="fixed top-0 left-0 right-0 z-[9999] bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 text-xs font-medium px-4 py-2 flex items-center justify-center gap-2"
          role="alert"
          aria-live="assertive"
        >
          <Icon.WifiOff size={14} className="flex-shrink-0" />
          <span>Offline — changes will sync when you reconnect</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
