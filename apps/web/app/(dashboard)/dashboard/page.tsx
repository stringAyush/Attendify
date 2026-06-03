'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Skeleton, Badge, ProgressBar } from '@/components/ui';
import { attendanceApi, DashboardStats } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function StatCard({
  title,
  value,
  sub,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </Card>
  );
}

// Quick action links
const QUICK_ACTIONS = [
  {
    href: '/attendance?create=true',
    label: 'Take Attendance',
    description: 'Start a new session',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/classes?create=true',
    label: 'New Class',
    description: 'Create a class',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: '/students?import=true',
    label: 'Import Students',
    description: 'Upload via CSV',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Export Report',
    description: 'PDF or CSV',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

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

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Classes"
              value={stats?.totalClasses ?? 0}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            />
            <StatCard
              title="Students"
              value={stats?.totalStudents ?? 0}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <StatCard
              title="Sessions"
              value={stats?.totalSessions ?? 0}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>}
            />
            <StatCard
              title="Avg. Attendance"
              value={`${stats?.averageAttendance ?? 0}%`}
              sub={stats && stats.averageAttendance >= 75 ? 'On track' : 'Needs attention'}
              trend={stats ? (stats.averageAttendance >= 75 ? 'up' : 'down') : 'neutral'}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
          </div>
        )}

        {/* Chart + Recent Sessions */}
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Trend Chart */}
          <Card className="lg:col-span-3 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Attendance Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Last 30 days</p>
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={stats?.monthlyTrend ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="opacity-5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v: string) => v.slice(5)}
                    axisLine={false}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                  />
                  <Area type="monotone" dataKey="present" stroke="#4f46e5" fill="url(#presentGrad)" strokeWidth={1.75} name="Present" dot={false} />
                  <Area type="monotone" dataKey="absent" stroke="#dc2626" fill="url(#absentGrad)" strokeWidth={1.75} name="Absent" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Recent Sessions */}
          <Card className="lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recent Sessions</h3>
              <Link href="/attendance" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                View all
              </Link>
            </div>
            <div className="flex-1 divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden">
              {loading ? (
                <div className="space-y-px p-5">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 mb-2" />)}
                </div>
              ) : !stats?.recentSessions?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                  <p className="text-sm text-slate-400">No sessions yet</p>
                  <Link href="/attendance?create=true" className="mt-2 text-xs text-indigo-600 hover:underline">
                    Create your first session
                  </Link>
                </div>
              ) : (
                stats.recentSessions.slice(0, 5).map((session) => {
                  const pct = session.stats?.total
                    ? Math.round((session.stats.present / session.stats.total) * 100)
                    : 0;
                  return (
                    <Link
                      key={session.id}
                      href={`/attendance`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {session.subject?.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {session.class?.name} · {formatDate(session.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-14">
                          <ProgressBar value={pct} size="xs" />
                        </div>
                        <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>
                          {pct}%
                        </Badge>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors group"
              >
                <div className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-shrink-0">
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 truncate">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
