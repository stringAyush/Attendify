'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import { AttendifyMark } from '@/components/ui/icons';
import * as Icon from '@/components/ui/icons';
import { getApiErrorMessage } from '@/lib/utils';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

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
    <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans">
      {/* Left panel — matches login page styling */}
      <div className="hidden lg:flex flex-col w-[440px] xl:w-[500px] flex-shrink-0 bg-slate-950 dark:bg-slate-900 p-12 relative overflow-hidden border-r border-slate-900">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative flex items-center gap-3 mb-16">
          <AttendifyMark size={32} />
          <span className="text-white text-base font-bold tracking-tight">Attendify</span>
        </div>
        <div className="relative flex-1">
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Security &<br />Account Recovery.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-12">
            Forgot your password? No worries. Enter your verified email address and we'll send you instructions to securely reset it.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon.Lock size={18} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Secure Reset Link</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">We verify your account and send a single-use token valid for 1 hour.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon.AlertCircle className="text-indigo-400" size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Multi-device Lock</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Resetting your password will log out active sessions on other devices.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative pt-8 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Remember your credentials?{' '}
            <Link href="/auth/login" className="text-indigo-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <AttendifyMark size={30} />
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Attendify</span>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Reset Password
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Enter your email address to recover your account.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
              <Icon.AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-400 leading-relaxed font-medium">{error}</p>
            </div>
          )}

          {success ? (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600">
                <Icon.CheckCircle size={22} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Check your inbox</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  We sent secure instructions to reset your password. If you don't receive it shortly, please verify your spam folder.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/auth/login">
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
                placeholder="name@school.edu"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="space-y-3">
                <Button type="submit" loading={isSubmitting} className="w-full">
                  Send Recovery Link
                </Button>

                <Link href="/auth/login" className="block text-center text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1.5">
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
