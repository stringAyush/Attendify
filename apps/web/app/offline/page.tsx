'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 000-5.656M2 2l20 20M9.172 9.172A4 4 0 006 12m-1.93-3.07A9 9 0 003.515 7.05"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        You're offline
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed mb-8">
        Check your internet connection. Any changes you made while offline will
        sync automatically when you reconnect.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
