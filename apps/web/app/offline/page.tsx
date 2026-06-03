'use client';

import * as Icon from '@/components/ui/icons';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mb-5 text-amber-600 dark:text-amber-500">
        <Icon.WifiOff size={20} />
      </div>

      <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
        No internet connection
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6">
        Changes you made while offline will sync automatically when you reconnect.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
