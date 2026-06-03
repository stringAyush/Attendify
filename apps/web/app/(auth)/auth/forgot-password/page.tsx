'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { getApiErrorMessage } from '@/lib/utils';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const FEATURES = [
  {
    icon: <Icon.Lock size={18} className="text-white" />,
    title: 'Secure Tokens',
    desc: 'Password recovery links expire in 1 hour for account safety.',
  },
  {
    icon: <Icon.AlertCircle size={18} className="text-white" />,
    title: 'Session Lockout',
    desc: 'Resetting credentials logs out all other active browser sessions.',
  },
  {
    icon: <Icon.CheckCircle size={18} className="text-white" />,
    title: 'Identity Verification',
    desc: 'Uses cryptographically random signatures to secure reset flows.',
  },
  {
    icon: <Icon.Smartphone size={18} className="text-white" />,
    title: 'Cross-Device Safety',
    desc: 'Reset securely on desktop, mobile web, or native Android apps.',
  },
];

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError('');
    setSuccess(false);
    try {
      await authApi.forgotPassword(data.email);
      setSuccess(true);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="dark min-h-screen flex bg-slate-950 text-white font-sans">
      {/* Left panel — engaging sidebar (matching login) */}
      <div className="hidden lg:flex flex-col w-[48%] xl:w-[50%] flex-shrink-0 bg-gradient-to-br from-indigo-750 via-indigo-900 to-purple-950 p-12 xl:p-16 relative overflow-hidden justify-between border-r border-slate-900">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
            <Icon.ClipboardCheck size={16} className="text-white" />
          </div>
          <span className="text-white text-base font-extrabold tracking-tight">Attendify</span>
        </div>

        {/* Hero Section */}
        <div className="relative my-auto py-8">
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Security &<br />Account Recovery
          </h1>
          <p className="text-indigo-200/80 text-sm xl:text-base leading-relaxed mb-12 max-w-md">
            Forgot your password? No worries. Enter your registered email address and we will send you secure recovery instructions.
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

      {/* Right panel — forgot password form */}
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
              Reset Password
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Enter your email address to recover your account
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/20 border border-red-900/30">
              <Icon.AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-455 leading-relaxed font-semibold">{error}</p>
            </div>
          )}

          {success ? (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-950/30 border border-emerald-900/30 flex items-center justify-center text-emerald-450">
                <Icon.CheckCircle size={22} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Check your inbox</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We sent secure instructions to reset your password. If you don't receive it shortly, please verify your spam folder.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/auth/login" className="block w-full">
                  <Button className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                id="reset-email"
                label="Email Address"
                type="email"
                placeholder="youremail@school.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="space-y-3">
                <Button type="submit" loading={isSubmitting} className="w-full">
                  Send Recovery Link
                </Button>

                <Link
                  href="/auth/login"
                  className="block text-center text-sm font-bold text-slate-450 hover:text-slate-200 py-1.5 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
