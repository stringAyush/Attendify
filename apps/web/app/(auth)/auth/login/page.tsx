'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth.store';
import { Button, Input, Divider } from '@/components/ui';
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
    icon: <Icon.Zap size={16} className="text-white" />,
    title: 'One-Tap Marking',
    desc: 'Mark an entire class present in under 10 seconds.',
    color: 'from-indigo-500/20',
  },
  {
    icon: <Icon.FileText size={16} className="text-white" />,
    title: 'PDF & CSV Reports',
    desc: 'Export compliance-ready reports instantly.',
    color: 'from-purple-500/20',
  },
  {
    icon: <Icon.BarChart2 size={16} className="text-white" />,
    title: 'Live Analytics',
    desc: 'Track trends and at-risk students in real time.',
    color: 'from-sky-500/20',
  },
  {
    icon: <Icon.Smartphone size={16} className="text-white" />,
    title: 'Mobile First',
    desc: 'Optimized for teachers on Android and web.',
    color: 'from-emerald-500/20',
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
      setError('Google authentication failed. Please try again.');
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
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col w-[48%] xl:w-[50%] flex-shrink-0 relative overflow-hidden border-r border-white/[0.06]">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950" />
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col h-full px-12 xl:px-16 py-10 justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2.5"
          >
            <AttendifyMark size={30} />
            <span className="text-white font-extrabold text-base tracking-tight">Attendify</span>
          </motion.div>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="my-auto"
          >
            <p className="text-indigo-300/80 text-xs font-bold uppercase tracking-widest mb-3">
              Built for educators
            </p>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
              Smarter Attendance,<br />Every Class.
            </h1>
            <p className="text-slate-400 text-sm xl:text-base leading-relaxed mb-10 max-w-sm">
              Take attendance, track trends, and generate reports — all from one clean dashboard.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + i * 0.07 }}
                  className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center mb-3">
                    {f.icon}
                  </div>
                  <h3 className="text-xs font-bold text-white">{f.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Institution type tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-6 border-t border-white/[0.07]"
          >
            <p className="text-[11px] text-slate-500 mb-3">Built for educational institutions</p>
            <div className="flex gap-2 flex-wrap">
              {['Schools', 'Colleges', 'Coaching Institutes', 'Universities'].map((tag) => (
                <span key={tag} className="text-[10px] font-semibold text-slate-400 bg-white/[0.05] border border-white/[0.06] rounded-md px-2.5 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm space-y-7"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <AttendifyMark size={28} />
            <span className="text-white font-extrabold text-sm tracking-tight">Attendify</span>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-400 mt-1.5">Sign in to your Attendify account</p>
          </div>

          {/* Error alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-red-950/30 border border-red-800/40"
            >
              <Icon.AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={15} />
              <p className="text-xs text-red-300 font-semibold leading-relaxed">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Dark-mode overrides via className — Input component handles bg-white by default, so force dark */}
            <div className="[&_input]:bg-slate-900 [&_input]:border-slate-800 [&_input]:text-slate-100 [&_input]:placeholder:text-slate-500 [&_input:focus]:border-indigo-500 [&_input:focus]:ring-indigo-950/30 [&_label]:text-slate-400">
              <Input
                id="login-email"
                label="Email Address"
                type="email"
                placeholder="you@school.edu"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="[&_input]:bg-slate-900 [&_input]:border-slate-800 [&_input]:text-slate-100 [&_input]:placeholder:text-slate-500 [&_input:focus]:border-indigo-500 [&_label]:text-slate-400">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wide">Password</label>
                <Link href="/auth/forgot-password" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                error={errors.password?.message}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <Icon.EyeOff size={15} /> : <Icon.Eye size={15} />}
                  </button>
                }
                {...register('password')}
              />
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Sign In to Attendify
            </Button>
          </form>

          <Divider label="or continue with" className="[&>div]:border-slate-800 [&>span]:bg-slate-950 [&>span]:text-slate-600" />

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full h-10 flex items-center justify-center gap-3 px-4 border border-slate-800 rounded-lg text-sm font-semibold text-slate-300 bg-white/[0.03] hover:bg-white/[0.06] hover:border-slate-700 transition-all"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-indigo-400 font-bold hover:underline">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="dark min-h-screen flex bg-slate-950 text-white items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <AttendifyMark size={36} />
        </motion.div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
