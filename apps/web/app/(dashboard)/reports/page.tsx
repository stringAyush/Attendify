'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Badge, Skeleton, useToast } from '@/components/ui';
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
      const res = await reportApi.getClassReport(filter.classId, {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
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

  const avgAttendance = report
    ? report.studentSummaries.length > 0
      ? Math.round(report.studentSummaries.reduce((s, st) => s + st.attendancePercentage, 0) / report.studentSummaries.length)
      : 0
    : 0;

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance Reports</h2>
          <p className="text-slate-500 text-sm mt-0.5">Generate and export detailed attendance reports</p>
        </div>

        {/* Filter Card */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Report Filters</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Class *</label>
              <select
                value={filter.classId}
                onChange={(e) => setFilter(f => ({ ...f, classId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section ?? ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">From Date</label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">To Date</label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={generateReport} loading={loading} icon={<span>📊</span>}>
              Generate Report
            </Button>
            {report && (
              <>
                <Button variant="secondary" onClick={handleExportCsv} loading={exporting === 'csv'} icon={<span>📄</span>}>
                  Export CSV
                </Button>
                <Button variant="secondary" onClick={handleExportPdf} loading={exporting === 'pdf'} icon={<span>📑</span>}>
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Report Output */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
          </div>
        )}

        {report && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: report.studentSummaries.length, icon: '👥' },
                { label: 'Sessions', value: report.sessions.length, icon: '📋' },
                { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: '📊' },
                { label: 'Low Attendance', value: report.studentSummaries.filter(s => s.attendancePercentage < 75).length, icon: '⚠️' },
              ].map((kpi, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{kpi.icon}</span>
                    <div>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</p>
                      <p className="text-xs text-slate-400">{kpi.label}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Report Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  {report.class.name} {report.class.section} — Student Summary
                </h3>
                <span className="text-xs text-slate-400">
                  {filter.startDate} to {filter.endDate}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      {['Roll No.', 'Student Name', 'Sessions', 'Present', 'Absent', 'Late', 'Attendance %'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {report.studentSummaries.map((s, i) => (
                      <motion.tr
                        key={s.studentId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Badge variant="default">{s.rollNumber}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">{s.studentName}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.totalSessions}</td>
                        <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{s.present}</td>
                        <td className="px-4 py-3 text-sm text-red-500 font-medium">{s.absent}</td>
                        <td className="px-4 py-3 text-sm text-amber-600 font-medium">{s.late}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${getAttendanceBg(s.attendancePercentage)}`}>
                            {s.attendancePercentage}%
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
