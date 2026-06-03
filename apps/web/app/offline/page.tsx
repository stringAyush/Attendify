'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center mb-5">
        <svg
          className="w-5 h-5 text-amber-600 dark:text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 000-5.656M2 2l20 20M9.172 9.172A4 4 0 006 12m-1.93-3.07A9 9 0 003.515 7.05"
          />
        </svg>
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
