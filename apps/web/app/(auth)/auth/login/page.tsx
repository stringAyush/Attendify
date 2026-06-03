'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store/auth.store';
import { Button, Input } from '@/components/ui';
import { AttendifyMark } from '@/components/ui/icons';
import * as Icon from '@/components/ui/icons';
import { getApiErrorMessage } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const FEATURES = [
  {
    icon: <Icon.ClipboardCheck size={18} className="text-indigo-400" />,
    title: 'One-tap attendance',
    desc: 'Mark entire classes in seconds with smart bulk actions and shortcuts.',
  },
  {
    icon: <Icon.FileText size={18} className="text-indigo-400" />,
    title: 'Professional reports',
    desc: 'Generate instantly exportable PDF or CSV attendance sheets for any class.',
  },
  {
    icon: <Icon.WifiOff size={18} className="text-indigo-400" />,
    title: 'Works 100% offline',
    desc: 'Record data without internet. Automatic sync when you reconnect.',
  },
  {
    icon: <Icon.Upload size={18} className="text-indigo-400" />,
    title: 'CSV bulk enrollment',
    desc: 'Add hundreds of students from your school roster in one single upload.',
  },
];

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your_google_client_id') {
      alert('Google OAuth is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
      return;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/auth?${params}`;
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans">
      {/* Left panel — engaging sidebar */}
      <div className="hidden lg:flex flex-col w-[440px] xl:w-[500px] flex-shrink-0 bg-slate-950 dark:bg-slate-900 p-12 relative overflow-hidden border-r border-slate-900">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-16">
          <AttendifyMark size={32} />
          <span className="text-white text-base font-bold tracking-tight">Attendify</span>
        </div>

        {/* Headline */}
        <div className="relative flex-1">
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Attendance tracking<br />made simple.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-12">
            Attendify empowers educators with fast, touch-friendly workflows, offline tracking, and compliant reports. Free for solo teachers.
          </p>

          {/* Feature list */}
          <div className="space-y-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative pt-8 border-t border-slate-800/80">
          <p className="text-xs text-slate-500 leading-normal">
            Used by schools globally. Your local data is stored securely and synced instantly.
          </p>
        </div>
      </div>

      {/* Right panel (form) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <AttendifyMark size={30} />
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Attendify</span>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Welcome back. Enter your email and password to access your dashboard.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
              <Icon.AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-400 leading-relaxed font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="login-email"
              label="Email Address"
              type="email"
              placeholder="name@school.edu"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full h-10 px-3.5 pr-10 rounded-lg border text-base sm:text-sm transition-all duration-150 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${errors.password ? 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/20'}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                >
                  {showPassword ? (
                    <Icon.EyeOff size={16} />
                  ) : (
                    <Icon.Eye size={16} />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full h-10 flex items-center justify-center gap-3 px-4 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-750 transition-all duration-150 shadow-xs"
          >
            <svg className="w-4.5 h-4.5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Workspace
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            New to Attendify?{' '}
            <Link href="/auth/signup" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Create an account free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
