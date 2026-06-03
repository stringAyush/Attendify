'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store/auth.store';
import { Button, Input } from '@/components/ui';
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

const FEATURES = [
  {
    icon: <Icon.Plus size={18} className="text-white" />,
    title: 'Easy Class Setup',
    desc: 'Register subjects, sessions, and academic calendars in minutes.',
  },
  {
    icon: <Icon.Users size={18} className="text-white" />,
    title: 'Bulk Roster Import',
    desc: 'Upload standard CSV lists to enroll hundreds of students at once.',
  },
  {
    icon: <Icon.Award size={18} className="text-white" />,
    title: 'Reliable Analytics',
    desc: 'Verify regular presence rates and trace shortage alerts instantly.',
  },
  {
    icon: <Icon.Smartphone size={18} className="text-white" />,
    title: 'Capacitor Android Support',
    desc: 'Optimized for local screen flows on mobile and tablets.',
  },
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
            Get started in<br />under 2 minutes
          </h1>
          <p className="text-indigo-200/80 text-sm xl:text-base leading-relaxed mb-12 max-w-md">
            Create your free account. Start registering students, logging sessions, and generating compliant reports today.
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

      {/* Right panel — signup form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-950">
        <div className="w-full max-w-sm space-y-7">
          {/* Mobile logo header */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Icon.ClipboardCheck size={14} className="text-white" />
            </div>
            <span className="text-base font-extrabold text-white tracking-tight">Attendify</span>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Create account
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Free forever for individual educators
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/20 border border-red-900/30">
              <Icon.AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-450 leading-relaxed font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="youremail@school.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="signup-institution"
              label="Institution Name (optional)"
              placeholder="Stanford University"
              {...register('institutionName')}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-400 tracking-wide">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`w-full h-10 px-3.5 pr-10 rounded-lg border text-base sm:text-sm outline-none transition-all bg-slate-900 text-slate-100 placeholder:text-slate-500 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-950/30' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950/20'}`}
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

              {/* Password checks indicators */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
                {RULES.map((rule) => {
                  const ok = rule.test(watchedPassword ?? '');
                  return (
                    <span
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors duration-150 ${ok ? 'text-emerald-500' : 'text-slate-500'}`}
                    >
                      {ok ? (
                        <Icon.CheckCircle size={12} className="text-emerald-500" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      )}
                      {rule.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-3">
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 leading-relaxed mt-4">
            By signing up, you agree to our{' '}
            <Link href="#" className="underline hover:text-slate-400">Terms of Service</Link>
            {' '}and{' '}
            <Link href="#" className="underline hover:text-slate-400">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-400 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
