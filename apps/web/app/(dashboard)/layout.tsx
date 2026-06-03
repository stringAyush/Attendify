'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { ToastProvider } from '@/components/ui';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const router = useRouter();
  const loadCalled = useRef(false);
  // Guard against Zustand persist rehydration race: on first render the store
  // has its initial values (isAuthenticated=false) before localStorage is read.
  // We wait one tick for persist to rehydrate before evaluating auth state.
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist rehydrates synchronously on mount when localStorage is
    // available, but the React state update is batched. Using a microtask (or
    // simply the first useEffect) guarantees we're past the rehydration point.
    setHasHydrated(true);
  }, []);

  // Attempt session recovery on first mount only
  useEffect(() => {
    if (!loadCalled.current) {
      loadCalled.current = true;
      loadUser();
    }
  }, [loadUser]);

  // NOTE: Dark mode is handled by ThemeInitializer in the root layout.
  // Do NOT touch classList.remove('dark') here — it would wipe the user's theme.

  // Redirect unauthenticated users after loading completes AND hydration is done
  useEffect(() => {
    if (hasHydrated && !isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [hasHydrated, isAuthenticated, isLoading, router]);

  // Show loading spinner while:
  // 1. Persist store hasn't hydrated yet, OR
  // 2. loadUser() is in-flight
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Attendify</p>
            <p className="text-xs text-slate-400 mt-0.5">Restoring your session…</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated → null while redirect is in-flight
  if (!isAuthenticated) return null;

  return <ToastProvider>{children}</ToastProvider>;
}
