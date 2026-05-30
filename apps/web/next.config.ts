import type { NextConfig } from 'next';
import path from 'path';

const isCapacitor = process.env.CAPACITOR === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fixes "multiple lockfiles" Turbopack warning in monorepo
  outputFileTracingRoot: path.join(__dirname, '../../'),

  ...(isCapacitor
    ? {
        output: 'export' as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        images: {
          remotePatterns: [
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
            { protocol: 'https', hostname: 'ui-avatars.com' },
          ],
        },
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'X-XSS-Protection', value: '1; mode=block' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                {
                  key: 'Permissions-Policy',
                  value: 'camera=(), microphone=(), geolocation=(), payment=()',
                },
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;

