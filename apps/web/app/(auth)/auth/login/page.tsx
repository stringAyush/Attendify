'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
    icon: <Icon.ClipboardCheck size={18} className="text-white" />,
    title: 'One-Tap Workflows',
    desc: 'Mark entire classes present in seconds with bulk actions.',
  },
  {
    icon: <Icon.FileText size={18} className="text-white" />,
    title: 'Compliance Reports',
    desc: 'Generate exportable PDF and CSV sheets for administrators.',
  },
  {
    icon: <Icon.Layers size={18} className="text-white" />,
    title: 'Class Insights',
    desc: 'Track attendance logs, trends, and student details in one place.',
  },
  {
    icon: <Icon.Smartphone size={18} className="text-white" />,
    title: 'Multi-Device Sync',
    desc: 'Works seamlessly on PC, mobile browser, and Android devices.',
  },
];

function LoginPageInner() {
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'oauth_failed') {
      setError('Google authentication failed. Please make sure Google OAuth is configured and try again.');
    } else if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);


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
    <div className="dark min-h-screen flex bg-slate-950 text-white font-sans">
      {/* Left panel — engaging sidebar (vibrant dark layout) */}
      <div className="hidden lg:flex flex-col w-[48%] xl:w-[50%] flex-shrink-0 bg-gradient-to-br from-indigo-750 via-indigo-900 to-purple-950 p-12 xl:p-16 relative overflow-hidden justify-between border-r border-slate-900">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Logo Header */}
        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
            <Icon.ClipboardCheck size={16} className="text-white" />
          </div>
          <span className="text-white text-base font-extrabold tracking-tight">Attendify</span>
        </div>

        {/* Hero Section */}
        <div className="relative my-auto py-8">
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Smart Attendance<br />Management
          </h1>
          <p className="text-indigo-200/80 text-sm xl:text-base leading-relaxed mb-12 max-w-md">
            A simple and powerful platform to take attendance, manage records, and make data-driven decisions.
          </p>

          {/* 2x2 Feature Grid */}
          <div className="grid grid-cols-2 gap-4 xl:gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md flex flex-col justify-between min-h-[145px] hover:border-white/[0.12] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-white mb-4">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">{f.title}</h3>
                  <p className="text-[11px] text-indigo-200/60 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tag System */}
        <div className="relative pt-6 border-t border-white/[0.08] flex items-center gap-3.5 flex-wrap">
          <span className="text-[10px] font-bold text-indigo-200/50 uppercase tracking-widest">Designed for</span>
          <div className="flex gap-2 flex-wrap">
            {['Schools', 'Colleges', 'Coaching Centers', 'Universities'].map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold text-indigo-100 bg-white/[0.08] border border-white/[0.04] rounded-lg px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel (dark authentication form) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-950">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo header */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Icon.ClipboardCheck size={14} className="text-white" />
            </div>
            <span className="text-base font-extrabold text-white tracking-tight">Attendify</span>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Sign in to your Attendify account
            </p>
          </div>

          {/* Form Error Box */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/20 border border-red-900/30">
              <Icon.AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-450 leading-relaxed font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="login-email"
              label="Email Address"
              type="email"
              placeholder="youremail@school.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-400 tracking-wide">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-350"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full h-10 px-3.5 pr-10 rounded-lg border text-base sm:text-sm transition-all duration-150 outline-none bg-slate-900 text-slate-100 placeholder:text-slate-500 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-950/30' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950/20'}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-300 p-1"
                >
                  {showPassword ? (
                    <Icon.EyeOff size={16} />
                  ) : (
                    <Icon.Eye size={16} />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password.message}</p>}
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-slate-950 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full h-10 flex items-center justify-center gap-3 px-4 border border-slate-800 rounded-lg text-sm font-bold text-slate-200 bg-slate-900/40 hover:bg-slate-900 transition-colors shadow-xs"
          >
            <svg className="w-4.5 h-4.5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-indigo-400 font-bold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="dark min-h-screen flex bg-slate-950 text-white font-sans items-center justify-center">
        <Icon.ClipboardCheck size={28} className="animate-pulse text-indigo-400" />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}

