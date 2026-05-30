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
import { getApiErrorMessage } from '@/lib/utils';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  institutionName: z.string().optional(),
});
type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setError('');
    try {
      await signup(data);
      router.push('/dashboard');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">Attendify</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h2>
          <p className="text-slate-500 text-sm mb-6">Start managing attendance in minutes</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input id="signup-name" label="Full Name" placeholder="Mr. John Smith" error={errors.name?.message} {...register('name')} />
            <Input id="signup-email" label="Email Address" type="email" placeholder="teacher@school.com" error={errors.email?.message} {...register('email')} />
            <Input id="signup-institution" label="Institution Name (optional)" placeholder="ABC School / College" {...register('institutionName')} />
            <Input id="signup-password" label="Password" type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number" error={errors.password?.message} {...register('password')} />

            {/* Password hints */}
            <div className="flex gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span>8+ chars</span></span>
              <span className="flex items-center gap-1"><span>Uppercase</span></span>
              <span className="flex items-center gap-1"><span>Number</span></span>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full py-3 mt-2">
              Create Account — Free
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            By signing up, you agree to our{' '}
            <Link href="#" className="text-indigo-600">Terms</Link> and{' '}
            <Link href="#" className="text-indigo-600">Privacy Policy</Link>
          </p>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
