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

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  institutionName: z.string().optional().or(z.literal('')),
});
type SignupForm = z.infer<typeof signupSchema>;

const RULES = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export default function SignupPage() {
  const { signup } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const watchedPassword = watch('password', '');

  const onSubmit = async (data: SignupForm) => {
    setError('');
    try {
      await signup({ ...data, institutionName: data.institutionName || undefined });
      router.push('/dashboard');
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
            Get started in<br />under 2 minutes.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-12">
            Create your free account. No credit card required. Start tracking attendance and generating reports right away.
          </p>
          <div className="space-y-6">
            {[
              { title: 'Free forever for solo teachers', desc: 'No subscriptions, no features locked behind paywalls.' },
              { title: 'Unlimited classes & records', desc: 'Create as many subjects, classes, and sessions as you want.' },
              { title: 'Full mobile offline database', desc: 'Work inside remote classrooms without a cell signal.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative pt-8 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right panel — signup form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <AttendifyMark size={30} />
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Attendify</span>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Create account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Free forever for individual educators. Join today.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
              <Icon.AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-400 leading-relaxed font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="signup-name"
              label="Full Name"
              placeholder="Professor John Smith"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="signup-email"
              label="Email Address"
              type="email"
              placeholder="you@school.edu"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="signup-institution"
              label="Institution Name (optional)"
              placeholder="e.g., Stanford University"
              {...register('institutionName')}
            />

            {/* Password input with visual hints */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`w-full h-10 px-3.5 pr-10 rounded-lg border text-base sm:text-sm outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${errors.password ? 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/20'}`}
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

              {/* Rules checkmarks */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
                {RULES.map((rule) => {
                  const ok = rule.test(watchedPassword ?? '');
                  return (
                    <span
                      key={rule.label}
                      className={`flex items-center gap-1 text-[11px] font-semibold transition-colors duration-150 ${ok ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                      {ok ? (
                        <Icon.CheckCircle size={12} className="text-emerald-600 dark:text-emerald-450" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                      )}
                      {rule.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed mt-4">
            By signing up, you agree to our{' '}
            <Link href="#" className="underline hover:text-slate-600">Terms of Service</Link>
            {' '}and{' '}
            <Link href="#" className="underline hover:text-slate-600">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
