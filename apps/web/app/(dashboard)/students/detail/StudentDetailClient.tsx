'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Badge, Skeleton, Avatar, ProgressBar, useToast } from '@/components/ui';
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
        <Card className="p-6 text-center">
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
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Students
        </button>

        {/* Profile Card */}
        {loading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : student && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                <Avatar name={student.name} src={student.avatar} size="xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{student.name}</h2>
                      <p className="text-slate-500 text-sm mt-0.5">Roll #{student.rollNumber}</p>
                      {student.email && <p className="text-slate-400 text-xs mt-0.5">{student.email}</p>}
                      {student.phone && <p className="text-slate-400 text-xs">{student.phone}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={student.isActive ? 'success' : 'danger'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="danger" size="sm" onClick={handleDelete}>Remove</Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Enrolled {formatDate(student.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sessions', value: summary.totalSessions, color: 'text-slate-700', bg: 'bg-slate-50' },
              { label: 'Present', value: summary.present, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Absent', value: summary.absent, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Late', value: summary.late, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className={`p-4 ${stat.bg}`}>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Attendance % Card */}
        {summary && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Overall Attendance</h3>
              <span className={`text-lg font-bold px-3 py-1 rounded-full ${getAttendanceBg(summary.percentage)}`}>
                {summary.percentage}%
              </span>
            </div>
            <ProgressBar value={summary.percentage} showLabel={false} />
            {summary.percentage < 75 && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                ⚠️ Below 75% threshold — student may face attendance shortage
              </p>
            )}
          </Card>
        )}

        {/* Attendance Records */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Attendance History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Subject</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-slate-400">
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
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(rec.markedAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200">
                          —
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400 hidden sm:table-cell">
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
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
