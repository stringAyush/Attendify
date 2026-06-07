'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Skeleton, Badge, ProgressBar, StatCard, QuickActionCard } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { attendanceApi, DashboardStats } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { motion } from 'framer-motion';

// ─── Custom Tooltip ───────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-bold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 ml-auto pl-4">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Greeting ─────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: '🌤️' };
  if (h < 17) return { text: 'Good afternoon', icon: '☀️' };
  return { text: 'Good evening', icon: '🌙' };
}

// ─── At-Risk Student Row ──────────────────────────────────────
function AtRiskRow({ student }: { student: { name: string; attendanceRate: number; className: string } }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center flex-shrink-0">
        <Icon.User size={14} className="text-red-500 dark:text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{student.name}</p>
        <p className="text-[10px] text-slate-400 truncate">{student.className}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-16">
          <ProgressBar value={student.attendanceRate} color="danger" size="xs" />
        </div>
        <span className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums w-9 text-right">
          {student.attendanceRate}%
        </span>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const greeting = getGreeting();

  useEffect(() => {
    attendanceApi.dashboard()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const QUICK_ACTIONS = [
    {
      href: '/attendance?create=true',
      label: 'Take Attendance',
      description: 'Start a session',
      icon: <Icon.ClipboardCheck size={17} />,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
    },
    {
      href: '/classes?create=true',
      label: 'New Class',
      description: 'Create a class',
      icon: <Icon.BookOpen size={17} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    },
    {
      href: '/students?import=true',
      label: 'Import Students',
      description: 'Bulk CSV upload',
      icon: <Icon.Upload size={17} />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    },
    {
      href: '/reports',
      label: 'Export Report',
      description: 'PDF or CSV',
      icon: <Icon.FileText size={17} />,
      iconBg: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
    },
  ];

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-7">

        {/* ── Hero greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {greeting.text}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link
            href="/attendance?create=true"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-200/50 dark:shadow-none transition-all active:scale-95"
          >
            <Icon.Plus size={15} />
            New Session
          </Link>
        </motion.div>

        {/* ── Stat cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
          >
            <motion.div variants={cardVariants}>
              <StatCard
                title="Classes"
                value={stats?.totalClasses ?? 0}
                icon={<Icon.BookOpen size={17} />}
                iconBg="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <StatCard
                title="Students"
                value={stats?.totalStudents ?? 0}
                icon={<Icon.Users size={17} />}
                iconBg="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <StatCard
                title="Sessions"
                value={stats?.totalSessions ?? 0}
                icon={<Icon.ClipboardCheck size={17} />}
                iconBg="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <StatCard
                title="Avg. Attendance"
                value={`${stats?.averageAttendance ?? 0}%`}
                subtitle={stats && stats.averageAttendance >= 75 ? 'On track' : 'Needs attention'}
                trend={stats ? (stats.averageAttendance >= 75 ? 'up' : 'down') : 'neutral'}
                trendValue={`${stats?.averageAttendance ?? 0}%`}
                icon={<Icon.BarChart2 size={17} />}
                iconBg={
                  stats && stats.averageAttendance >= 75
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                }
              />
            </motion.div>
          </motion.div>
        )}

        {/* ── Chart + Recent Sessions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Trend Chart */}
          <Card className="lg:col-span-3 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Attendance Trend</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Last 30 days</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                  Present
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />
                  Absent
                </span>
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={stats?.monthlyTrend ?? []} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="opacity-[0.04]" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-400 dark:text-slate-500"
                    tickFormatter={(v: string) => v.slice(5)}
                    axisLine={false}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-400 dark:text-slate-500"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="present" stroke="#4f46e5" fill="url(#presentGrad)" strokeWidth={2} name="Present" dot={false} />
                  <Area type="monotone" dataKey="absent" stroke="#dc2626" fill="url(#absentGrad)" strokeWidth={2} name="Absent" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Recent Sessions */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Sessions</h2>
              <Link href="/attendance" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View all
              </Link>
            </div>
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="space-y-1 p-4">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 rounded-lg mb-1" />)}
                </div>
              ) : !stats?.recentSessions?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                  <Icon.ClipboardCheck size={24} className="text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">No sessions yet</p>
                  <Link href="/attendance?create=true" className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Create your first session →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {stats.recentSessions.slice(0, 6).map((session) => {
                    const pct = session.stats?.total
                      ? Math.round((session.stats.present / session.stats.total) * 100)
                      : 0;
                    return (
                      <Link
                        key={session.id}
                        href="/attendance"
                        className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center flex-shrink-0">
                          <Icon.ClipboardCheck size={13} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {session.subject?.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                            {session.class?.name} · {formatDate(session.date)}
                          </p>
                        </div>
                        <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'} size="sm">
                          {pct}%
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <p className="section-label mb-3">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.href} {...action} />
            ))}
          </div>
        </div>

        {/* ── At-Risk Students ── */}
        {!loading && stats && stats.totalStudents > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="section-label">Needs Attention</p>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">Students below 75%</h2>
              </div>
              <Link href="/students" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View all
              </Link>
            </div>
            <Card className="px-5 py-1">
              {/* Mocked from stats; in production this would come from API */}
              <div className="py-8 text-center">
                <Icon.CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All students on track</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No students below the 75% attendance threshold.</p>
              </div>
            </Card>
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
}
