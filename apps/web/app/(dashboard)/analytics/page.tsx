'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Skeleton, Select, Input, useToast, StatCard, ProgressBar, Badge } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { attendanceApi, classApi, AttendanceAnalytics, ClassItem } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const CHART_COLORS = ['#4f46e5', '#dc2626', '#d97706', '#059669', '#7c3aed'];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-bold text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 ml-auto pl-3 tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    classId: '',
    startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; })(),
    endDate: new Date().toISOString().split('T')[0],
  });

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getAnalytics({
        classId: filter.classId || undefined,
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
      setAnalytics(res.data as AttendanceAnalytics);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    classApi.list({ limit: 100 }).then((r) => setClasses(r.data as ClassItem[])).catch(() => {});
    loadAnalytics();
  }, [loadAnalytics]);

  const pieData = analytics
    ? [
        { name: 'Present', value: analytics.presentCount },
        { name: 'Absent',  value: analytics.absentCount },
      ]
    : [];

  const subjectRadar = analytics?.subjectWise?.map((s) => ({
    subject: (s.subjectName || '').slice(0, 10),
    attendance: s.averageAttendance,
  })) ?? [];

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` · ${c.section}` : ''}` })),
  ];

  const chartStyle = {
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--card))',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
    fontSize: '11px',
    color: 'hsl(var(--foreground))',
    padding: '8px 12px',
  };

  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const cardVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Attendance insights across classes and subjects
          </p>
        </div>

        {/* ── Filter bar ── */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <Select
              label="Class"
              value={filter.classId}
              onChange={(e) => setFilter((f) => ({ ...f, classId: e.target.value }))}
              options={classOptions}
            />
            <Input
              label="From"
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label="To"
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button onClick={loadAnalytics} className="flex-1" icon={<Icon.RefreshCw size={13} />}>
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={() => setFilter({
                  classId: '',
                  startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; })(),
                  endDate: new Date().toISOString().split('T')[0],
                })}
              >
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* ── KPI cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
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
                title="Total Sessions"
                value={analytics?.totalSessions ?? 0}
                icon={<Icon.ClipboardCheck size={17} />}
                iconBg="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <StatCard
                title="Avg. Attendance"
                value={`${analytics?.averageAttendance ?? 0}%`}
                icon={<Icon.BarChart2 size={17} />}
                iconBg={
                  (analytics?.averageAttendance ?? 0) >= 75
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                }
                trend={(analytics?.averageAttendance ?? 0) >= 75 ? 'up' : 'down'}
                trendValue={`${analytics?.averageAttendance ?? 0}%`}
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <StatCard
                title="Total Present"
                value={analytics?.presentCount ?? 0}
                icon={<Icon.CheckCircle size={17} />}
                iconBg="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <StatCard
                title="Total Absent"
                value={analytics?.absentCount ?? 0}
                icon={<Icon.XCircle size={17} />}
                iconBg="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
              />
            </motion.div>
          </motion.div>
        )}

        {/* ── Main charts ── */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Trend area chart */}
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Attendance Trend</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daily present vs absent</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />Present</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Absent</span>
              </div>
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={analytics?.trend ?? []} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="opacity-[0.04]" />
                  <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="present" stroke="#4f46e5" fill="url(#ag1)" strokeWidth={2} name="Present" dot={false} />
                  <Area type="monotone" dataKey="absent" stroke="#dc2626" fill="url(#ag2)" strokeWidth={2} name="Absent" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Pie chart */}
          <Card className="p-5">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Overall Split</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Present vs Absent ratio</p>
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={65} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={chartStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-3">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i] }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── Subject charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart */}
          <Card className="p-5">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Subject-wise Attendance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Average rate per subject</p>
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics?.subjectWise ?? []} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="opacity-[0.04]" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="subjectName" tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} contentStyle={chartStyle} />
                  <Bar dataKey="averageAttendance" name="Attendance" radius={[0, 4, 4, 0]}>
                    {(analytics?.subjectWise ?? []).map((entry, i) => (
                      <Cell key={i} fill={entry.averageAttendance >= 75 ? '#4f46e5' : entry.averageAttendance >= 50 ? '#d97706' : '#dc2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Radar chart or subject table */}
          {subjectRadar.length > 2 ? (
            <Card className="p-5">
              <div className="mb-5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Radar Analysis</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Subject coverage overview</p>
              </div>
              {loading ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={subjectRadar}>
                    <PolarGrid stroke="currentColor" className="opacity-10 dark:opacity-5 text-slate-400 dark:text-slate-600" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" />
                    <Radar name="Attendance" dataKey="attendance" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} />
                    <Tooltip contentStyle={chartStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </Card>
          ) : (
            /* Subject summary table */
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Subject Summary</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Per-subject breakdown</p>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    ))
                  : (analytics?.subjectWise ?? []).length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-xs text-slate-400">No subject data available</p>
                      </div>
                    ) : (
                      (analytics?.subjectWise ?? []).map((s) => {
                        const variant = s.averageAttendance >= 75 ? 'success' : s.averageAttendance >= 50 ? 'warning' : 'danger';
                        return (
                          <div key={s.subjectName} className="px-5 py-3 flex items-center gap-3">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 min-w-0 truncate">
                              {s.subjectName}
                            </p>
                            <div className="w-20">
                              <ProgressBar value={s.averageAttendance} size="xs" />
                            </div>
                            <Badge variant={variant} size="sm">{s.averageAttendance}%</Badge>
                          </div>
                        );
                      })
                    )
                }
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
