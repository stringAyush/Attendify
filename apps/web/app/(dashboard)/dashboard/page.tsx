'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Skeleton, Badge, ProgressBar } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
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
        {trend && trend !== 'neutral' && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {trend === 'up' ? <Icon.TrendingUp size={14} /> : <Icon.TrendingDown size={14} />}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </Card>
  );
}

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

  const QUICK_ACTIONS = [
    {
      href: '/attendance?create=true',
      label: 'Take Attendance',
      description: 'Start a new session',
      icon: <Icon.ClipboardCheck size={16} />,
    },
    {
      href: '/classes?create=true',
      label: 'New Class',
      description: 'Create a class',
      icon: <Icon.Plus size={16} />,
    },
    {
      href: '/students?import=true',
      label: 'Import Students',
      description: 'Upload via CSV',
      icon: <Icon.Upload size={16} />,
    },
    {
      href: '/reports',
      label: 'Export Report',
      description: 'PDF or CSV',
      icon: <Icon.FileText size={16} />,
    },
  ];

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
              icon={<Icon.BookOpen size={16} />}
            />
            <StatCard
              title="Students"
              value={stats?.totalStudents ?? 0}
              icon={<Icon.Users size={16} />}
            />
            <StatCard
              title="Sessions"
              value={stats?.totalSessions ?? 0}
              icon={<Icon.ClipboardCheck size={16} />}
            />
            <StatCard
              title="Avg. Attendance"
              value={`${stats?.averageAttendance ?? 0}%`}
              sub={stats && stats.averageAttendance >= 75 ? 'On track' : 'Needs attention'}
              trend={stats ? (stats.averageAttendance >= 75 ? 'up' : 'down') : 'neutral'}
              icon={<Icon.BarChart2 size={16} />}
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
