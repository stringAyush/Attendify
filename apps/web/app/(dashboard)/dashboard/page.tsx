'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Skeleton, Badge, Avatar, ProgressBar } from '@/components/ui';
import { attendanceApi, DashboardStats } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { formatDate, getAttendanceBg } from '@/lib/utils';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, gradient, subtitle }: StatCardProps) {
  return (
    <motion.div variants={STAGGER.item}>
      <Card className="p-6 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${gradient} opacity-10 translate-x-8 -translate-y-8`} />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

const COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi.dashboard()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const pieData = stats
    ? [
        { name: 'Present', value: stats.monthlyTrend.reduce((s, d) => s + d.present, 0) },
        { name: 'Absent', value: stats.monthlyTrend.reduce((s, d) => s + d.absent, 0) },
        { name: 'Late', value: stats.monthlyTrend.reduce((s, d) => s + d.late, 0) },
      ]
    : [];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={STAGGER.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard
              title="Total Classes"
              value={stats?.totalClasses ?? 0}
              gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            />
            <StatCard
              title="Total Students"
              value={stats?.totalStudents ?? 0}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            />
            <StatCard
              title="Sessions Taken"
              value={stats?.totalSessions ?? 0}
              gradient="bg-gradient-to-br from-sky-500 to-cyan-500"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            />
            <StatCard
              title="Avg. Attendance"
              value={`${stats?.averageAttendance ?? 0}%`}
              gradient="bg-gradient-to-br from-rose-500 to-pink-500"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              subtitle={stats && stats.averageAttendance >= 75 ? '✅ On track' : '⚠️ Needs attention'}
            />
          </motion.div>
        )}

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">
                30-Day Attendance Trend
              </h3>
              {loading ? (
                <Skeleton className="h-56" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={stats?.monthlyTrend ?? []}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.slice(5)}
                      stroke="#e2e8f0"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#e2e8f0" />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="present" stroke="#6366f1" fill="url(#presentGrad)" strokeWidth={2} name="Present" />
                    <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="url(#absentGrad)" strokeWidth={2} name="Absent" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Monthly Overview
              </h3>
              {loading ? (
                <Skeleton className="h-56" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Recent Sessions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Recent Sessions
              </h3>
              <Link
                href="/attendance"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : stats?.recentSessions?.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No sessions yet. Start by marking attendance!</p>
            ) : (
              <div className="space-y-3">
                {stats?.recentSessions.map((session) => {
                  const pct = session.stats
                    ? session.stats.total > 0
                      ? Math.round((session.stats.present / session.stats.total) * 100)
                      : 0
                    : 0;
                  return (
                    <Link
                      key={session.id}
                      href={`/attendance/${session.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {session.subject?.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {session.class?.name} {session.class?.section} · {formatDate(session.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:block w-24">
                          <ProgressBar value={pct} />
                        </div>
                        <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>
                          {pct}%
                        </Badge>
                        {session.isFinalized && <Badge variant="purple">Final</Badge>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/attendance?create=true', label: 'Take Attendance', icon: '✅', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
              { href: '/classes?create=true', label: 'Add Class', icon: '🏫', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
              { href: '/students?import=true', label: 'Import Students', icon: '📋', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
              { href: '/reports', label: 'View Reports', icon: '📊', color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${action.color} font-medium text-sm hover:opacity-80 transition-all duration-200 hover:scale-105 active:scale-95 text-center`}
              >
                <span className="text-2xl">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
