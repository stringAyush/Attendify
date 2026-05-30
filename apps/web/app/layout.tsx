import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import ThemeInitializer from '@/components/shared/ThemeInitializer';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Attendify — Smart Attendance Management',
    template: '%s | Attendify',
  },
  description:
    'Attendify is a production-grade attendance management platform for schools, colleges, coaching institutes, and universities. Track attendance, generate reports, and gain insights.',
  keywords: [
    'attendance management',
    'school attendance',
    'student attendance tracker',
    'teacher dashboard',
    'attendance reports',
    'education technology',
  ],
  authors: [{ name: 'Attendify' }],
  creator: 'Attendify',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Attendify',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // Prevents auto-zoom on input focus in iOS WebView (Capacitor)
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Register service worker for offline support */}
        <script src="/sw-register.js" defer />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeInitializer />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}

