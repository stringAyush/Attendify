'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Skeleton, Badge, Select, useToast } from '@/components/ui';
import { attendanceApi, classApi, AttendanceAnalytics, ClassItem } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from 'recharts';

const COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

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

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h2>
          <p className="text-slate-500 text-sm mt-0.5">Attendance insights and trends</p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Class</label>
              <select
                value={filter.classId}
                onChange={(e) => setFilter(f => ({ ...f, classId: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section ?? ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter(f => ({ ...f, startDate: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter(f => ({ ...f, endDate: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <Button onClick={loadAnalytics} size="sm">Apply</Button>
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
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : (
            [
              { label: 'Total Sessions', value: analytics?.totalSessions ?? 0, icon: '📋', color: 'text-indigo-600 bg-indigo-50' },
              { label: 'Avg. Attendance', value: `${analytics?.averageAttendance ?? 0}%`, icon: '📊', color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Total Present', value: analytics?.presentCount ?? 0, icon: '✅', color: 'text-sky-600 bg-sky-50' },
              { label: 'Total Absent', value: analytics?.absentCount ?? 0, icon: '❌', color: 'text-red-600 bg-red-50' },
            ].map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${kpi.color}`}>
                      {kpi.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</p>
                      <p className="text-xs text-slate-400">{kpi.label}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trend */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Attendance Trend</h3>
            {loading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={analytics?.trend ?? []}>
                  <defs>
                    <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 11 }} stroke="#e2e8f0" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#e2e8f0" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="present" stroke="#6366f1" fill="url(#ag1)" strokeWidth={2} name="Present" />
                  <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="url(#ag2)" strokeWidth={2} name="Absent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Pie */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Overall Split</h3>
            {loading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Subject-wise Bar Chart + Radar */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Subject-wise Attendance</h3>
            {loading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics?.subjectWise ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#e2e8f0" unit="%" />
                  <YAxis type="category" dataKey="subjectName" tick={{ fontSize: 11 }} stroke="#e2e8f0" width={90} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="averageAttendance" name="Attendance" radius={[0, 6, 6, 0]}>
                    {(analytics?.subjectWise ?? []).map((entry, i) => (
                      <Cell key={i} fill={entry.averageAttendance >= 75 ? '#6366f1' : entry.averageAttendance >= 50 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {subjectRadar.length > 2 && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Radar Analysis</h3>
              {loading ? <Skeleton className="h-56" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={subjectRadar}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <Radar name="Attendance" dataKey="attendance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    <Tooltip />
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
