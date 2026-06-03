'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Badge, Skeleton, useToast, Avatar, ProgressBar, Modal } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { attendanceApi, classApi, AttendanceSessionItem, ClassItem, AttendanceSessionWithRecords } from '@/lib/api';
import { useAttendanceStore } from '@/lib/store/attendance.store';
import { getApiErrorMessage, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'P', color: 'bg-emerald-500 text-white border-emerald-500', bg: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  { value: 'ABSENT', label: 'A', color: 'bg-red-500 text-white border-red-500', bg: 'bg-red-50 border-red-300 text-red-700' },
  { value: 'LATE', label: 'L', color: 'bg-amber-500 text-white border-amber-500', bg: 'bg-amber-50 border-amber-300 text-amber-700' },
  { value: 'HALF_DAY', label: 'H', color: 'bg-sky-500 text-white border-sky-500', bg: 'bg-sky-50 border-sky-300 text-sky-700' },
];

// ─── Mark Attendance View ─────────────────────────────────────
function MarkAttendanceView({ session, onClose }: { session: AttendanceSessionWithRecords; onClose: () => void }) {
  const { toast } = useToast();
  const { attendanceMap, markStudent, markAll, saveAttendance, isDirty, isMarkingBulk, getTotals } = useAttendanceStore();
  const router = useRouter();
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const students = session.records.map((r) => r.student).filter(Boolean);

  // Init from existing records
  useEffect(() => {
    session.records.forEach((r) => {
      if (r.student) markStudent(r.student.id, r.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED');
    });
  }, [session.id]);

  const handleSave = async () => {
    try {
      await saveAttendance();
      toast('success', 'Attendance saved successfully');
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  const handleFinalize = async () => {
    setShowFinalizeConfirm(true);
  };

  const executeFinalize = async () => {
    setIsFinalizing(true);
    try {
      if (isDirty) {
        await saveAttendance();
      }
      await attendanceApi.finalizeSession(session.id);
      toast('success', 'Session finalized');
      setShowFinalizeConfirm(false);
      onClose();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setIsFinalizing(false);
    }
  };

  const totals = getTotals();

  return (
    <div className="space-y-6">
      {/* Session Info */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{session.subject?.name}</h3>
            <p className="text-sm text-slate-500">{session.class?.name} · {formatDate(session.date)}</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Badge variant="success">{totals.present} Present</Badge>
            <Badge variant="danger">{totals.absent} Absent</Badge>
            <Badge variant="warning">{totals.late} Late</Badge>
            {!session.isFinalized && (
              <Button size="sm" onClick={handleFinalize} loading={isMarkingBulk || isFinalizing} className="ml-2">
                Finalize Session
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <ProgressBar
            value={totals.total > 0 ? (totals.present / totals.total) * 100 : 0}
            showLabel
          />
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="text-xs text-slate-400 self-center">Mark all as:</span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              disabled={session.isFinalized}
              onClick={() => markAll(s.value as 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY', students.map((st) => st!.id))}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border-2 transition-all ${s.bg} ${
                session.isFinalized ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {s.label === 'P' ? 'Present' : s.label === 'A' ? 'Absent' : s.label === 'L' ? 'Late' : 'Half Day'}
            </button>
          ))}
        </div>
      </Card>

      {/* Student Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {students.map((student, i) => {
            if (!student) return null;
            const currentStatus = attendanceMap.get(student.id)?.status ?? 'ABSENT';

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={student.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{student.name}</p>
                      <p className="text-xs text-slate-400">Roll: {student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        disabled={session.isFinalized}
                        onClick={() => markStudent(student.id, opt.value as 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY')}
                        className={`py-2 rounded-xl text-xs font-bold border-2 transition-all duration-100 ${
                          currentStatus === opt.value ? opt.color : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                        } ${session.isFinalized ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Save Bar */}
      {isDirty && !session.isFinalized && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl z-30 border border-slate-700"
        >
          <span className="text-sm font-medium">Unsaved changes</span>
          <Button size="sm" variant="secondary" onClick={handleSave} loading={isMarkingBulk} className="bg-white text-slate-900 hover:bg-slate-100">
            Save Draft
          </Button>
          <Button size="sm" onClick={handleFinalize} loading={isMarkingBulk || isFinalizing}>
            Save & Finalize
          </Button>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <Modal
        open={showFinalizeConfirm}
        onClose={() => setShowFinalizeConfirm(false)}
        title="Finalize Attendance Session"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Are you sure you want to finalize this session? Once finalized, student attendance records will be locked and no further edits will be allowed.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setShowFinalizeConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={executeFinalize} loading={isMarkingBulk || isFinalizing}>
              Yes, Finalize
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Sessions List ────────────────────────────────────────────
export default function AttendancePage() {
  const { toast } = useToast();
  const { initSession } = useAttendanceStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<AttendanceSessionWithRecords | null>(null);
  const [filterClass, setFilterClass] = useState('');
  const [newSessionModal, setNewSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    classId: '', subjectId: '', date: new Date().toISOString().split('T')[0], mode: 'MANUAL', notes: ''
  });
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getSessions({
        classId: filterClass || undefined,
        limit: 30,
      });
      setSessions(res.data as AttendanceSessionItem[]);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filterClass, toast]);

  useEffect(() => {
    classApi.list({ limit: 100 }).then((r) => setClasses(r.data as ClassItem[])).catch(() => {});
    loadSessions();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('create') === 'true') {
        setNewSessionModal(true);
      }
    }
  }, [loadSessions]);

  useEffect(() => {
    if (sessionForm.classId) {
      classApi.getSubjects(sessionForm.classId)
        .then((r) => setSubjects(r.data as { id: string; name: string }[]))
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [sessionForm.classId]);

  const openSession = async (sessionId: string) => {
    try {
      const res = await attendanceApi.getSession(sessionId);
      const session = res.data as AttendanceSessionWithRecords;
      initSession(session.id);
      setActiveSession(session);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  const handleCreateSession = async () => {
    if (!sessionForm.classId || !sessionForm.subjectId || !sessionForm.date) {
      toast('error', 'Please fill all required fields');
      return;
    }
    setCreating(true);
    try {
      const res = await attendanceApi.createSession({
        classId: sessionForm.classId,
        subjectId: sessionForm.subjectId,
        date: sessionForm.date,
        mode: sessionForm.mode as 'MANUAL' | 'QR' | 'PIN',
        notes: sessionForm.notes || undefined,
      });
      const session = res.data as AttendanceSessionItem;
      setNewSessionModal(false);
      toast('success', 'Session created! Taking attendance now...');
      await openSession(session.id);
      loadSessions();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  if (activeSession) {
    return (
      <DashboardLayout title="Mark Attendance">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveSession(null); loadSessions(); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <Icon.ArrowLeft size={16} />
            </button>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Mark Attendance</h2>
          </div>
          <MarkAttendanceView session={activeSession} onClose={() => { setActiveSession(null); loadSessions(); }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Attendance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance Sessions</h2>
            <p className="text-slate-500 text-sm">Manage and take class attendance</p>
          </div>
          <Button onClick={() => setNewSessionModal(true)} icon={<span className="text-lg">+</span>}>
            New Session
          </Button>
        </div>

        {/* Filter */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.section ?? ''}</option>
          ))}
        </select>

        {/* Sessions Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="py-16 text-center">
            <p className="text-slate-400 text-sm">No sessions found. Create one to start taking attendance.</p>
            <Button className="mt-4" onClick={() => setNewSessionModal(true)}>Create Session</Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, i) => {
              const pct = session.stats
                ? session.stats.total > 0
                  ? Math.round((session.stats.present / session.stats.total) * 100)
                  : 0
                : 0;
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="p-5 hover:shadow-sm transition-all duration-150 cursor-pointer group" clickable onClick={() => openSession(session.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                        </svg>
                      </div>
                      <div className="flex gap-1">
                        {session.isFinalized && <Badge variant="purple">Final</Badge>}
                        <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>{pct}%</Badge>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                      {session.subject?.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{session.class?.name} {session.class?.section}</p>
                    <p className="text-xs text-slate-400">{formatDate(session.date)}</p>
                    <div className="mt-3">
                      <ProgressBar value={pct} />
                      <p className="text-xs text-slate-400 mt-1">
                        {session.stats?.present ?? 0}/{session.stats?.total ?? 0} present
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {newSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNewSessionModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Create Attendance Session</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Class *</label>
                <select
                  value={sessionForm.classId}
                  onChange={(e) => setSessionForm(f => ({ ...f, classId: e.target.value, subjectId: '' }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section ?? ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
                <select
                  value={sessionForm.subjectId}
                  onChange={(e) => setSessionForm(f => ({ ...f, subjectId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  disabled={!subjects.length}
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {sessionForm.classId && !subjects.length && (
                  <p className="text-xs text-amber-500 mt-1">No subjects found. Add subjects to this class first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date *</label>
                <input
                  type="date"
                  value={sessionForm.date}
                  onChange={(e) => setSessionForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'MANUAL', label: 'Manual', Icon: Icon.PenLine },
                    { value: 'QR',     label: 'QR Code', Icon: Icon.QrCode },
                    { value: 'PIN',    label: 'PIN',     Icon: Icon.Lock },
                  ] as const).map(({ value, label, Icon: ModeIcon }) => (
                    <button
                      key={value}
                      onClick={() => setSessionForm(f => ({ ...f, mode: value }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                        sessionForm.mode === value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <ModeIcon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setNewSessionModal(false)}>Cancel</Button>
              <Button className="flex-1" loading={creating} onClick={handleCreateSession}>Create & Mark</Button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
