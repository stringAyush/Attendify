'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { setAccessToken, getAccessToken } from '@/lib/api/client';
import { authApi, AuthUser } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    institutionName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: Partial<AuthUser>) => void;
}

// ─── Helpers ─────────────────────────────────────────────────
function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function setStoredRefreshToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
}

// ─── Store ────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        // Start as loading if we have a stored refresh token — prevents the
        // dashboard layout from redirecting to /login before loadUser() completes.
        // IMPORTANT: isLoading is NOT persisted — it is always re-derived from
        // localStorage on client boot. On server (SSR) it defaults to false.
        isLoading: typeof window !== 'undefined' && !!localStorage.getItem('refreshToken'),

        // ── Login ──────────────────────────────────────────
        login: async (email, password) => {
          set({ isLoading: true });
          try {
            const response = await authApi.login({ email, password });
            const { user, accessToken, refreshToken } = response.data;

            setAccessToken(accessToken);
            setStoredRefreshToken(refreshToken);

            set({ user, isAuthenticated: true, isLoading: false });
          } catch (error) {
            set({ isLoading: false });
            throw error; // Let the calling component handle display
          }
        },

        // ── Signup ─────────────────────────────────────────
        signup: async (data) => {
          set({ isLoading: true });
          try {
            const response = await authApi.signup(data);
            const { user, accessToken, refreshToken } = response.data;

            setAccessToken(accessToken);
            setStoredRefreshToken(refreshToken);

            set({ user, isAuthenticated: true, isLoading: false });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        // ── Logout ─────────────────────────────────────────
        logout: async () => {
          try {
            await authApi.logout();
          } catch {
            // Ignore errors on logout — clear state regardless
          } finally {
            setAccessToken(null);
            setStoredRefreshToken(null);
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        },

        // ── Session Recovery on App Load ───────────────────
        // Called once on app startup. Uses stored refresh token to:
        // 1. Get a new access token
        // 2. Restore the user session without requiring re-login
        loadUser: async () => {
          const storedRefreshToken = getStoredRefreshToken();
          if (!storedRefreshToken) {
            // No token → not logged in, silently bail
            set({ isLoading: false });
            return;
          }

          // Already authenticated in this session (e.g. just completed Google OAuth
          // callback which set tokens in-memory + persisted state) — skip the refresh
          // network call but ALWAYS clear the loading flag so the dashboard can render.
          if (get().isAuthenticated && getAccessToken() !== null) {
            set({ isLoading: false });
            return;
          }

          set({ isLoading: true });
          try {
            const response = await authApi.refresh(storedRefreshToken);
            const { user, accessToken, refreshToken: newRefreshToken } = response.data;

            setAccessToken(accessToken);
            setStoredRefreshToken(newRefreshToken);

            set({ user, isAuthenticated: true, isLoading: false });
          } catch (err) {
            // Refresh failed — token expired or revoked → force logout
            console.warn('[Auth] Session recovery failed, clearing auth state:', err);
            setAccessToken(null);
            setStoredRefreshToken(null);
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        },

        // ── Patch User Fields ──────────────────────────────
        updateUser: (partial) => {
          const current = get().user;
          if (current) {
            set({ user: { ...current, ...partial } });
          }
        },
      }),
      {
        name: 'attendify-auth',
        // Only persist non-sensitive fields — access token stays in memory only
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'AuthStore' }
  )
);
