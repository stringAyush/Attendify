'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Badge, Skeleton, useToast } from '@/components/ui';
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

  const reportKpis = report ? [
    { label: 'Total Students', value: report.studentSummaries.length, icon: <Icon.Users size={14} /> },
    { label: 'Sessions', value: report.sessions.length, icon: <Icon.ClipboardCheck size={14} /> },
    { label: 'Avg. Attendance', value: `${avgAttendance}%`, icon: <Icon.BarChart2 size={14} /> },
    {
      label: 'Low Attendance',
      value: report.studentSummaries.filter(s => s.attendancePercentage < 75).length,
      icon: <Icon.AlertTriangle size={14} />,
    },
  ] : [];

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-5">
        {/* Page header */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reports</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Generate and export attendance reports by class and date range</p>
        </div>

        {/* Filter card */}
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Report Parameters</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide">Class <span className="text-red-400">*</span></label>
              <select
                value={filter.classId}
                onChange={(e) => setFilter(f => ({ ...f, classId: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20"
              >
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section ?? ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide">From Date</label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter(f => ({ ...f, startDate: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide">To Date</label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter(f => ({ ...f, endDate: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button
              onClick={generateReport}
              loading={loading}
              icon={<Icon.FileText size={14} />}
            >
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

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        )}

        {/* Report output */}
        {report && !loading && (
          <div className="space-y-4">
            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {reportKpis.map((kpi, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      {kpi.icon}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{kpi.value}</p>
                      <p className="text-[11px] text-slate-400">{kpi.label}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {report.class.name} {report.class.section} — Student Summary
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{filter.startDate} to {filter.endDate}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      {['Roll No.', 'Student Name', 'Sessions', 'Present', 'Absent', 'Late', 'Attendance'].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {report.studentSummaries.map((s) => (
                      <tr
                        key={s.studentId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <Badge variant="default">{s.rollNumber}</Badge>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">{s.studentName}</td>
                        <td className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400 tabular-nums">{s.totalSessions}</td>
                        <td className="px-5 py-3 text-sm font-medium text-emerald-600 tabular-nums">{s.present}</td>
                        <td className="px-5 py-3 text-sm font-medium text-red-500 tabular-nums">{s.absent}</td>
                        <td className="px-5 py-3 text-sm font-medium text-amber-600 tabular-nums">{s.late}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${getAttendanceBg(s.attendancePercentage)}`}>
                            {s.attendancePercentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
