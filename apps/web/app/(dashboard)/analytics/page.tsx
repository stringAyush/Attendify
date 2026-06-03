'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Skeleton, Select, Input, useToast } from '@/components/ui';
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
  <Icon.ClipboardCheck size={16} className="text-indigo-650 dark:text-indigo-400" key="sessions" />,
  <Icon.BarChart2 size={16} className="text-emerald-650 dark:text-emerald-400" key="avg" />,
  <Icon.CheckCircle size={16} className="text-sky-650 dark:text-sky-400" key="present" />,
  <Icon.XCircle size={16} className="text-red-650 dark:text-red-400" key="absent" />,
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
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Attendance insights across classes and subjects</p>
        </div>

        {/* Filters */}
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <Select
              label="Class"
              value={filter.classId}
              onChange={(e) => setFilter(f => ({ ...f, classId: e.target.value }))}
              options={classOptions}
            />
            <Input
              label="From"
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter(f => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label="To"
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter(f => ({ ...f, endDate: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button onClick={loadAnalytics} className="flex-1" icon={<Icon.RefreshCw size={14} />}>Apply</Button>
              <Button
                variant="secondary"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            : kpis.map((kpi, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                      {KPI_ICONS[i]}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{kpi.value}</p>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{kpi.label}</p>
                    </div>
                  </div>
                </Card>
              ))
          }
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Attendance Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily present vs absent over selected period</p>
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
                  <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="opacity-[0.03]" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-400 dark:text-slate-500 font-medium"
                    axisLine={false}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-400 dark:text-slate-500 font-medium"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                      padding: '8px 12px',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="present" stroke="#4f46e5" fill="url(#ag1)" strokeWidth={1.75} name="Present" dot={false} />
                  <Area type="monotone" dataKey="absent" stroke="#dc2626" fill="url(#ag2)" strokeWidth={1.75} name="Absent" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Overall Split</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Present vs Absent ratio</p>
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="42%" innerRadius={52} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                      padding: '8px 12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Subject charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Subject-wise Attendance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average attendance rate per subject</p>
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics?.subjectWise ?? []} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="opacity-[0.03]" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-400 dark:text-slate-500 font-medium"
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <YAxis
                    type="category"
                    dataKey="subjectName"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-400 dark:text-slate-500 font-medium"
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Attendance']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                      padding: '8px 12px',
                    }}
                  />
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
              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Radar Analysis</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Subject coverage overview</p>
              </div>
              {loading ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={subjectRadar}>
                    <PolarGrid stroke="currentColor" className="opacity-10 dark:opacity-5 text-slate-400 dark:text-slate-600" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      className="text-slate-400 dark:text-slate-500 font-medium"
                    />
                    <Radar name="Attendance" dataKey="attendance" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                        fontSize: '12px',
                        color: 'hsl(var(--foreground))',
                        padding: '8px 12px',
                      }}
                    />
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
