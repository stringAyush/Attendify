'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { setAccessToken } from '@/lib/api/client';
import { Spinner } from '@/components/ui';

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      router.replace('/auth/login?error=oauth_failed');
      return;
    }

    const redirectUri = window.location.origin + '/auth/google/callback';

    authApi
      .googleAuth(code, redirectUri)
      .then((res) => {
        const { user, accessToken, refreshToken } = res.data;
        // Set in-memory access token FIRST — must happen before setState
        // so that loadUser()'s guard (isAuthenticated && getAccessToken()) works.
        setAccessToken(accessToken);
        // Persist refresh token
        if (typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', refreshToken);
        }
        // Update full auth state — explicitly clear isLoading to prevent
        // the dashboard layout from being stuck in a loading state.
        useAuthStore.setState({ user, isAuthenticated: true, isLoading: false });
        router.replace('/dashboard');
      })
      .catch((err) => {
        console.error('[Google OAuth] Code exchange failed:', err?.response?.data ?? err?.message ?? err);
        router.replace('/auth/login?error=oauth_failed');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
        <Spinner className="w-6 h-6 text-white" />
      </div>
      <p className="text-sm text-slate-500 font-medium">Signing you in with Google…</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner className="w-8 h-8" />
      </div>
    }>
      <GoogleCallbackInner />
    </Suspense>
  );
}
