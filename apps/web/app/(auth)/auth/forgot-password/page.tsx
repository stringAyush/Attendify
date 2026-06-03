'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { authApi } from '@/lib/api';
import { Button, Input, useToast } from '@/components/ui';
import { AttendifyMark } from '@/components/ui/icons';
import * as Icon from '@/components/ui/icons';
import { getApiErrorMessage } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Left panel — matches login/signup */}
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
            Secure Account<br />Recovery
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Forgot your password? No worries. Just enter your registered email address, and we'll send you a link to reset it securely.
          </p>
        </div>
        <div className="relative pt-8 border-t border-slate-800">
          <p className="text-xs text-slate-600">Need support? Contact us at support@attendify.com</p>
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

          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Icon.CheckCircle size={24} />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Check your email</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                  We sent a password reset link to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>. It expires in 1 hour.
                </p>
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:underline">
                  <Icon.ArrowLeft size={14} />
                  <span>Back to login</span>
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Forgot password?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">Enter your email and we'll send a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="forgot-email"
                  label="Email Address"
                  type="email"
                  placeholder="teacher@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading} className="w-full mt-2">
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
                Remembered it?{' '}
                <Link href="/auth/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
