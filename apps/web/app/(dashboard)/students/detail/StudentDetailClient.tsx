'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Badge, Skeleton, Avatar, ProgressBar, useToast } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { studentApi, StudentItem, AttendanceRecord } from '@/lib/api';
import { getApiErrorMessage, formatDate, getAttendanceBg } from '@/lib/utils';

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'default' }> = {
  PRESENT:  { label: 'Present',  variant: 'success' },
  ABSENT:   { label: 'Absent',   variant: 'danger' },
  LATE:     { label: 'Late',     variant: 'warning' },
  HALF_DAY: { label: 'Half Day', variant: 'info' },
  EXCUSED:  { label: 'Excused',  variant: 'default' },
};

interface AttendanceSummary {
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export default function StudentDetailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const studentId = searchParams.get('id') || '';

  const [student, setStudent] = useState<StudentItem | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [studentRes, attendanceRes] = await Promise.all([
          studentApi.get(studentId),
          studentApi.getAttendance(studentId, { page, limit: 15 }),
        ]);
        setStudent(studentRes.data as StudentItem);
        const hist = attendanceRes.data as {
          student: StudentItem;
          records: AttendanceRecord[];
          summary: AttendanceSummary;
          pagination: { totalPages: number };
        };
        setRecords(hist.records);
        setSummary(hist.summary);
        setTotalPages(hist.pagination.totalPages);
      } catch (e) {
        toast('error', getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId, page, toast]);

  const handleDelete = async () => {
    if (!studentId || !confirm(`Remove ${student?.name} from all records? Attendance history is preserved.`)) return;
    try {
      await studentApi.delete(studentId);
      toast('success', 'Student removed');
      router.push('/students');
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  if (!studentId) {
    return (
      <DashboardLayout title="Student Profile">
        <Card className="p-6 text-center max-w-md mx-auto space-y-4">
          <p className="text-slate-500">No student ID provided.</p>
          <Link href="/students" className="mt-4 inline-block">
            <Button size="sm">Go back to Students</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Profile">
      <div className="space-y-6 max-w-4xl">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
        >
          <Icon.ArrowLeft size={16} />
          Back to Students
        </button>

        {/* Profile Card */}
        {loading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : student && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                <Avatar name={student.name} src={student.avatar} size="xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-550 tracking-tight">{student.name}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Roll #{student.rollNumber}</p>
                      {student.email && <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 font-medium">{student.email}</p>}
                      {student.phone && <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">{student.phone}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={student.isActive ? 'success' : 'danger'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="danger" size="sm" onClick={handleDelete}>Remove Student</Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
                    Enrolled {formatDate(student.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Sessions', value: summary.totalSessions, icon: <Icon.Clipboard size={18} /> },
              { label: 'Present', value: summary.present, icon: <Icon.CheckCircle className="text-emerald-600 dark:text-emerald-400" size={18} /> },
              { label: 'Absent', value: summary.absent, icon: <Icon.XCircle className="text-red-650 dark:text-red-400" size={18} /> },
              { label: 'Late', value: summary.late, icon: <Icon.Clock className="text-amber-600 dark:text-amber-400" size={18} /> },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}>
                <Card className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{stat.value}</p>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Attendance % Card */}
        {summary && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Overall Attendance</h3>
              <span className={`text-sm font-extrabold px-3 py-1 rounded-full ${getAttendanceBg(summary.percentage)}`}>
                {summary.percentage}%
              </span>
            </div>
            <ProgressBar value={summary.percentage} />
            {summary.percentage < 75 && (
              <p className="text-xs text-red-600 dark:text-red-450 mt-3 flex items-center gap-1.5 font-bold">
                <Icon.AlertTriangle size={14} />
                <span>Below 75% threshold — student may face attendance shortage</span>
              </p>
            )}
          </Card>
        )}

        {/* Attendance Records */}
        <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Attendance History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-wider uppercase">
                  <th className="text-left px-6 py-3.5">Date</th>
                  <th className="text-left px-4 py-3.5">Subject</th>
                  <th className="text-left px-4 py-3.5">Status</th>
                  <th className="text-left px-4 py-3.5 hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3.5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3.5 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-slate-400">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  records.map((rec, i) => {
                    const badge = STATUS_BADGE[rec.status] ?? STATUS_BADGE.ABSENT;
                    return (
                      <motion.tr
                        key={rec.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.015 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-6 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                          {formatDate(rec.markedAt)}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          —
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-400 dark:text-slate-500 hidden sm:table-cell">
                          {rec.notes ?? '—'}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <Icon.ChevronLeft size={16} />
              </Button>
              <span className="text-xs font-semibold text-slate-500">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <Icon.ChevronRight size={16} />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
