'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Skeleton, Select, useToast } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { attendanceApi, classApi, AttendanceAnalytics, ClassItem } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from 'recharts';

const CHART_COLORS = ['#4f46e5', '#dc2626', '#d97706', '#059669', '#7c3aed'];

const KPI_ICONS = [
  <Icon.ClipboardCheck size={15} key="sessions" />,
  <Icon.BarChart2 size={15} key="avg" />,
  <Icon.CheckCircle size={15} key="present" />,
  <Icon.XCircle size={15} key="absent" />,
];

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
        { name: 'Absent', value: analytics.absentCount },
      ]
    : [];

  const subjectRadar = analytics?.subjectWise.map((s) => ({
    subject: s.subjectName.slice(0, 8),
    attendance: s.averageAttendance,
  })) ?? [];

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section ?? ''}`.trim() })),
  ];

  const kpis = [
    { label: 'Total Sessions', value: analytics?.totalSessions ?? 0 },
    { label: 'Avg. Attendance', value: `${analytics?.averageAttendance ?? 0}%` },
    { label: 'Total Present', value: analytics?.presentCount ?? 0 },
    { label: 'Total Absent', value: analytics?.absentCount ?? 0 },
  ];

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-5">
        {/* Page header */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Attendance insights across classes and subjects</p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide">Class</label>
              <select
                value={filter.classId}
                onChange={(e) => setFilter(f => ({ ...f, classId: e.target.value }))}
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 w-full"
              >
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section ?? ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide">From</label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter(f => ({ ...f, startDate: e.target.value }))}
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide">To</label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter(f => ({ ...f, endDate: e.target.value }))}
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={loadAnalytics} size="sm" icon={<Icon.RefreshCw size={13} />}>Apply</Button>
              <Button
                variant="secondary" size="sm"
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            : kpis.map((kpi, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      {KPI_ICONS[i]}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{kpi.value}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{kpi.label}</p>
                    </div>
                  </div>
                </Card>
              ))
          }
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Attendance Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily present vs absent over selected period</p>
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={analytics?.trend ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="opacity-5" />
                  <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '6px 10px' }} />
                  <Area type="monotone" dataKey="present" stroke="#4f46e5" fill="url(#ag1)" strokeWidth={1.75} name="Present" dot={false} />
                  <Area type="monotone" dataKey="absent" stroke="#dc2626" fill="url(#ag2)" strokeWidth={1.75} name="Absent" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Overall Split</h3>
              <p className="text-xs text-slate-400 mt-0.5">Present vs Absent ratio</p>
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="42%" innerRadius={52} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '6px 10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Subject charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Subject-wise Attendance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Average attendance rate per subject</p>
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics?.subjectWise ?? []} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="opacity-5" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="subjectName" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '6px 10px' }} />
                  <Bar dataKey="averageAttendance" name="Attendance" radius={[0, 4, 4, 0]}>
                    {(analytics?.subjectWise ?? []).map((entry, i) => (
                      <Cell key={i} fill={entry.averageAttendance >= 75 ? '#4f46e5' : entry.averageAttendance >= 50 ? '#d97706' : '#dc2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {subjectRadar.length > 2 && (
            <Card className="p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Radar Analysis</h3>
                <p className="text-xs text-slate-400 mt-0.5">Subject coverage overview</p>
              </div>
              {loading ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={subjectRadar}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Radar name="Attendance" dataKey="attendance" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '6px 10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
