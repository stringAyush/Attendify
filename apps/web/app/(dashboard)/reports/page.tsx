'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Badge, Skeleton, useToast, StatCard, Select, Input, ProgressBar, Avatar } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { reportApi, classApi, ClassItem, ClassReport } from '@/lib/api';
import { getApiErrorMessage, downloadBlob, getAttendanceBg } from '@/lib/utils';

export default function ReportsPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [report, setReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [filter, setFilter] = useState({
    classId: '',
    startDate: (() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; })(),
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    classApi.list({ limit: 100 }).then((r) => setClasses(r.data as ClassItem[])).catch(() => {});
  }, []);

  const generateReport = async () => {
    if (!filter.classId) { toast('error', 'Please select a class'); return; }
    setLoading(true);
    try {
      const res = await reportApi.getClassReport(filter.classId, { startDate: filter.startDate, endDate: filter.endDate });
      setReport(res.data as ClassReport);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!filter.classId) return;
    setExporting('csv');
    try {
      const res = await reportApi.exportCsv({ classId: filter.classId, startDate: filter.startDate, endDate: filter.endDate });
      downloadBlob(new Blob([res.data as BlobPart], { type: 'text/csv' }), `attendance_report_${Date.now()}.csv`);
      toast('success', 'CSV downloaded');
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!filter.classId) return;
    setExporting('pdf');
    try {
      const res = await reportApi.exportPdf({ classId: filter.classId, startDate: filter.startDate, endDate: filter.endDate });
      downloadBlob(new Blob([res.data as BlobPart], { type: 'application/pdf' }), `attendance_report_${Date.now()}.pdf`);
      toast('success', 'PDF downloaded');
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setExporting(null);
    }
  };

  const avgAttendance = report && report.studentSummaries.length > 0
    ? Math.round(report.studentSummaries.reduce((s, st) => s + st.attendancePercentage, 0) / report.studentSummaries.length)
    : 0;

  const lowAttendance = report ? report.studentSummaries.filter((s) => s.attendancePercentage < 75).length : 0;

  const classOptions = [
    { value: '', label: 'Select class...' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` · ${c.section}` : ''}` })),
  ];

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate and export attendance reports by class and date range
          </p>
        </div>

        {/* ── Filter card ── */}
        <Card className="p-5">
          <p className="section-label mb-4">Report Parameters</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Class *"
              value={filter.classId}
              onChange={(e) => setFilter((f) => ({ ...f, classId: e.target.value }))}
              options={classOptions}
            />
            <Input
              label="From Date"
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label="To Date"
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div className="flex gap-2.5 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/60 flex-wrap">
            <Button onClick={generateReport} loading={loading} icon={<Icon.FileText size={14} />}>
              Generate Report
            </Button>
            {report && (
              <>
                <Button
                  variant="outline"
                  onClick={handleExportCsv}
                  loading={exporting === 'csv'}
                  icon={<Icon.Download size={14} />}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportPdf}
                  loading={exporting === 'pdf'}
                  icon={<Icon.Download size={14} />}
                >
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* ── Loading state ── */}
        {loading && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-72 rounded-xl" />
          </div>
        )}

        {/* ── Report output ── */}
        {report && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {/* Report header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">Report</p>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">
                  {report.class.name}{report.class.section ? ` · ${report.class.section}` : ''}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {filter.startDate} → {filter.endDate}
                </p>
              </div>
              <Badge variant={avgAttendance >= 75 ? 'success' : avgAttendance >= 50 ? 'warning' : 'danger'} size="md">
                {avgAttendance}% avg
              </Badge>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <StatCard
                title="Students"
                value={report.studentSummaries.length}
                icon={<Icon.Users size={16} />}
                iconBg="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
              />
              <StatCard
                title="Sessions"
                value={report.sessions.length}
                icon={<Icon.ClipboardCheck size={16} />}
                iconBg="bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400"
              />
              <StatCard
                title="Avg. Attendance"
                value={`${avgAttendance}%`}
                icon={<Icon.BarChart2 size={16} />}
                iconBg={avgAttendance >= 75
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'}
                trend={avgAttendance >= 75 ? 'up' : 'down'}
                trendValue={`${avgAttendance}%`}
              />
              <StatCard
                title="At-Risk"
                value={lowAttendance}
                icon={<Icon.AlertTriangle size={16} />}
                iconBg={lowAttendance === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'}
              />
            </div>

            {/* Student summary table */}
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Student Summary</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {report.studentSummaries.length} students · {report.sessions.length} sessions
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30">
                      {['Roll No.', 'Student Name', 'Sessions', 'Present', 'Absent', 'Late', 'Attendance Rate'].map((h) => (
                        <th key={h} className="text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.studentSummaries
                      .sort((a, b) => a.attendancePercentage - b.attendancePercentage)
                      .map((s) => {
                        const variant = s.attendancePercentage >= 85 ? 'success' : s.attendancePercentage >= 75 ? 'indigo' : s.attendancePercentage >= 50 ? 'warning' : 'danger';
                        return (
                          <tr key={s.studentId} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-5 py-3">
                              <Badge variant="default" size="sm">{s.rollNumber}</Badge>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={s.studentName} size="xs" className="flex-shrink-0" />
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{s.studentName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400 tabular-nums">{s.totalSessions}</td>
                            <td className="px-5 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{s.present}</td>
                            <td className="px-5 py-3 text-sm font-bold text-red-500 dark:text-red-400 tabular-nums">{s.absent}</td>
                            <td className="px-5 py-3 text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">{s.late}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-14 hidden sm:block">
                                  <ProgressBar value={s.attendancePercentage} size="xs" />
                                </div>
                                <Badge variant={variant} size="sm">{s.attendancePercentage}%</Badge>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {/* Export footer */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-900/30">
                <Button variant="outline" size="sm" onClick={handleExportCsv} loading={exporting === 'csv'} icon={<Icon.Download size={13} />}>
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPdf} loading={exporting === 'pdf'} icon={<Icon.Download size={13} />}>
                  Export PDF
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Placeholder when no report ── */}
        {!report && !loading && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <Icon.FileText size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No report generated yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">
              Select a class and date range above, then click Generate Report.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
