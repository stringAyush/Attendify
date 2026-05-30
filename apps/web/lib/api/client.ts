import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

// ─── Base URL Resolution ──────────────────────────────────────
// NEXT_PUBLIC_API_URL is set at build time (baked in during `next build`).
// For Capacitor APK builds, set this to your real deployed HTTPS API URL.
// NEVER use 192.168.x.x, localhost, or 127.0.0.1 in production builds.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');

if (typeof window !== 'undefined' && API_URL.includes('localhost') && !window.location.hostname.includes('localhost')) {
  console.warn(
    `⚠️ [Attendify Config Warning] The web application is running on a remote server (${window.location.hostname}), ` +
    `but it is attempting to connect to a local API server at '${API_URL}'. ` +
    `Ensure you have set the NEXT_PUBLIC_API_URL environment variable in Vercel to your deployed Render API (e.g., https://attendify-wgo4.onrender.com).`
  );
}

// ─── Network Status Utility ───────────────────────────────────
// Tracks online/offline state client-side.
// Other modules (stores, hooks) can import isOnline() to gate API calls.
let _isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    _isOnline = true;
    console.info('[Network] Connection restored — flushing queued requests');
    flushOfflineQueue();
  });
  window.addEventListener('offline', () => {
    _isOnline = false;
    console.warn('[Network] Connection lost — requests will be queued');
  });
}

export function isOnline(): boolean {
  return _isOnline;
}

// ─── Offline Request Queue ────────────────────────────────────
// When offline, write-mutations (POST/PUT/PATCH/DELETE) are stored
// in localStorage. When connectivity is restored, they are replayed.
const OFFLINE_QUEUE_KEY = 'attendify_offline_queue';

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: unknown;
  timestamp: number;
}

function getOfflineQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function addToOfflineQueue(req: Omit<QueuedRequest, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue();
  queue.push({
    ...req,
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function clearOfflineQueue(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
}

async function flushOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue();
  if (!queue.length) return;

  console.info(`[Offline Queue] Flushing ${queue.length} queued requests`);
  clearOfflineQueue();

  for (const req of queue) {
    try {
      await apiClient.request({
        method: req.method,
        url: req.url,
        data: req.data,
      });
      console.info(`[Offline Queue] ✓ Replayed ${req.method} ${req.url}`);
    } catch (err) {
      console.error(`[Offline Queue] ✗ Failed to replay ${req.method} ${req.url}`, err);
      // Don't re-queue failed replays — the data may be stale
    }
  }
}

// ─── Axios Client ─────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // 15s timeout for normal requests; mobile networks can be slow
  timeout: 15_000,
  withCredentials: false,
});

// ─── Token Management (in-memory) ────────────────────────────
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ─── Request Interceptor ──────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach Bearer token if available
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Offline guard for mutating requests
    if (!_isOnline) {
      const method = config.method?.toUpperCase() ?? 'GET';
      const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

      if (isMutation) {
        // Queue the request for later replay
        addToOfflineQueue({
          method,
          url: config.url ?? '',
          data: config.data,
        });
        // Reject with a recognisable offline error
        return Promise.reject(Object.assign(new Error('OFFLINE'), { code: 'ERR_OFFLINE' }));
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (Auto Refresh + Error Normalisation) ─
let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: AxiosRequestConfig;
}[] = [];

function processQueue(error: AxiosError | null, token: string | null): void {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      if (config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      resolve(apiClient(config));
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    // Offline error — already queued; surface a friendly error
    if ((error as NodeJS.ErrnoException).code === 'ERR_OFFLINE') {
      return Promise.reject(
        Object.assign(new Error('You are offline. Your changes have been saved and will sync when you reconnect.'), {
          code: 'ERR_OFFLINE',
          isOffline: true,
        })
      );
    }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Network error (no response received)
    if (!error.response) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[API] Network error — is the backend running at ${API_URL}?`, error.message);
      }
      return Promise.reject(error);
    }

    // 401 Unauthorised → try token refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url ?? '';
      if (url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken =
          typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        if (!storedRefreshToken) {
          throw new Error('No refresh token stored — user must log in again');
        }

        // Use a raw axios instance (not apiClient) to avoid interceptor loops
        const refreshResponse = await axios.post(
          `${API_URL}/api/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10_000 }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          refreshResponse.data.data;

        setAccessToken(newAccessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login?reason=session_expired';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      const errData = (error.response?.data as Record<string, unknown>) ?? {};
      console.error(
        `[API] ${error.response.status} ${originalRequest.method?.toUpperCase()} ${originalRequest.url}:`,
        errData.error ?? errData.message ?? error.message
      );
    }

    return Promise.reject(error);
  }
);

// ─── Typed API Helpers ────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data;
}

export async function apiPost<T>(
  url: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, data);
  return response.data;
}

export async function apiPut<T>(
  url: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  const response = await apiClient.put<ApiResponse<T>>(url, data);
  return response.data;
}

export async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data;
}

export async function apiUpload<T>(
  url: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
