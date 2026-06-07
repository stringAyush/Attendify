'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
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
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col w-[48%] xl:w-[50%] flex-shrink-0 relative overflow-hidden border-r border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col h-full px-12 xl:px-16 py-10 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <AttendifyMark size={30} />
            <span className="text-white font-extrabold text-base tracking-tight">Attendify</span>
          </div>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative my-auto"
          >
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Get started in<br />under 2 minutes
          </h1>
          <p className="text-indigo-200/80 text-sm xl:text-base leading-relaxed mb-12 max-w-md">
            Create your free account. Start registering students, logging sessions, and generating compliant reports today.
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

          <div className="pt-6 border-t border-white/[0.07] flex gap-2 flex-wrap">
            {['Schools', 'Colleges', 'Coaching Centers', 'Universities'].map((tag) => (
              <span key={tag} className="text-[10px] font-semibold text-slate-400 bg-white/[0.05] border border-white/[0.06] rounded-md px-2.5 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — signup form */}
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
        </motion.div>
      </div>
    </div>
  );
}
