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
import { getApiErrorMessage } from '@/lib/utils';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
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
  const [passwordValue, setPasswordValue] = useState('');

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
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Left panel — matches login */}
      <div className="hidden lg:flex flex-col w-[420px] xl:w-[480px] flex-shrink-0 bg-slate-950 dark:bg-slate-900 p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative flex items-center gap-2.5 mb-12">
          <AttendifyMark size={28} />
          <span className="text-white text-sm font-semibold tracking-tight">Attendify</span>
        </div>
        <div className="relative flex-1">
          <h1 className="text-3xl font-bold text-white leading-tight mb-3">
            Get started in<br />under 2 minutes
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Create your free account. No credit card required. Start managing attendance across your classes right away.
          </p>
          <div className="space-y-4">
            {[
              { title: 'Free forever for individuals', desc: 'No subscriptions, no hidden fees for solo educators' },
              { title: 'Unlimited classes and sessions', desc: 'Create as many classes and attendance sessions as you need' },
              { title: 'Android app included', desc: 'Install Attendify on your phone and work offline too' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                <div>
                  <p className="text-sm font-medium text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative pt-8 border-t border-slate-800">
          <p className="text-xs text-slate-600">Already have an account?{' '}
            <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <AttendifyMark size={26} />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Attendify</span>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Create your account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">Free to use, no credit card required</p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="signup-name"
              label="Full Name"
              placeholder="John Smith"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="signup-email"
              label="Email"
              type="email"
              placeholder="you@school.edu"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="signup-institution"
              label="Institution (optional)"
              placeholder="School or college name"
              {...register('institutionName')}
            />

            {/* Password with strength hints */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide">Password</label>
              </div>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`w-full h-9 px-3 pr-9 rounded-lg border text-sm outline-none transition-colors bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${errors.password ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20'}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              {/* Password strength indicators */}
              <div className="flex gap-3 mt-2">
                {RULES.map((rule) => {
                  const ok = rule.test(watchedPassword ?? '');
                  return (
                    <span key={rule.label} className={`flex items-center gap-1 text-[11px] ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {ok
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          : <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                        }
                      </svg>
                      {rule.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-5">
            By signing up you agree to our{' '}
            <Link href="#" className="text-slate-500 dark:text-slate-400 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="#" className="text-slate-500 dark:text-slate-400 hover:underline">Privacy Policy</Link>
          </p>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
