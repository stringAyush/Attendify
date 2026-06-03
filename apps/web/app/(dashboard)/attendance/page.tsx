'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Badge, Skeleton, useToast, Avatar, ProgressBar, Modal, Select, Input } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { attendanceApi, classApi, AttendanceSessionItem, ClassItem, AttendanceSessionWithRecords } from '@/lib/api';
import { useAttendanceStore } from '@/lib/store/attendance.store';
import { getApiErrorMessage, formatDate } from '@/lib/utils';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'P', color: 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-600 dark:border-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  { value: 'ABSENT', label: 'A', color: 'bg-red-600 border-red-600 text-white dark:bg-red-650 dark:border-red-650', bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400' },
  { value: 'LATE', label: 'L', color: 'bg-amber-600 border-amber-600 text-white dark:bg-amber-600 dark:border-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' },
  { value: 'HALF_DAY', label: 'H', color: 'bg-sky-600 border-sky-600 text-white dark:bg-sky-600 dark:border-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/30 text-sky-700 dark:text-sky-400' },
];

// ─── Mark Attendance View ─────────────────────────────────────
function MarkAttendanceView({ session, onClose }: { session: AttendanceSessionWithRecords; onClose: () => void }) {
  const { toast } = useToast();
  const { attendanceMap, markStudent, markAll, saveAttendance, isDirty, isMarkingBulk, getTotals } = useAttendanceStore();
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
      toast('success', 'Draft attendance saved');
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
      toast('success', 'Attendance session finalized and locked');
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
      {/* Session Info card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{session.subject?.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{session.class?.name} · {formatDate(session.date)}</p>
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

        {/* Attendance progress bar */}
        <div className="mt-5">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Presence Rate</span>
            <span>{totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0}%</span>
          </div>
          <ProgressBar
            value={totals.total > 0 ? (totals.present / totals.total) * 100 : 0}
          />
        </div>

        {/* Bulk quick actions */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mark All As:</span>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                disabled={session.isFinalized}
                onClick={() => markAll(s.value as 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY', students.map((st) => st!.id))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${s.bg} ${
                  session.isFinalized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xs'
                }`}
              >
                {s.label === 'P' ? 'Present' : s.label === 'A' ? 'Absent' : s.label === 'L' ? 'Late' : 'Half Day'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {students.map((student, i) => {
            if (!student) return null;
            const currentStatus = attendanceMap.get(student.id)?.status ?? 'ABSENT';

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015 }}
              >
                <Card className="p-5 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-3.5 mb-4">
                    <Avatar name={student.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{student.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Roll: {student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        disabled={session.isFinalized}
                        onClick={() => markStudent(student.id, opt.value as 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY')}
                        className={`h-10 rounded-lg text-sm font-extrabold border transition-all active:scale-95 duration-100 ${
                          currentStatus === opt.value
                            ? `${opt.color} shadow-sm`
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        } ${session.isFinalized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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

      {/* Save Draft Floating Bar */}
      {isDirty && !session.isFinalized && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 bg-slate-950 dark:bg-slate-900 text-white rounded-xl px-5 py-3.5 flex items-center gap-4 shadow-xl z-30 border border-slate-800"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unsaved changes</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleSave} loading={isMarkingBulk} className="bg-slate-800 text-white hover:bg-slate-700 border-none">
              Save Draft
            </Button>
            <Button size="sm" onClick={handleFinalize} loading={isMarkingBulk || isFinalizing}>
              Finalize
            </Button>
          </div>
        </motion.div>
      )}

      {/* Finalize Confirmation Modal */}
      <Modal
        open={showFinalizeConfirm}
        onClose={() => setShowFinalizeConfirm(false)}
        title="Lock Attendance Session"
        description="Are you sure you want to finalize this session?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Once finalized, student attendance records will be locked permanently. No further changes can be made.
          </p>
          <div className="flex justify-end gap-3 pt-2">
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
      toast('error', 'Please select class, subject, and date');
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
      toast('success', 'Attendance session created');
      await openSession(session.id);
      loadSessions();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section ?? ''}`.trim() })),
  ];

  if (activeSession) {
    return (
      <DashboardLayout title="Mark Attendance">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveSession(null); loadSessions(); }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <Icon.ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Mark Attendance</h2>
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
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Attendance Sessions</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and take class attendance</p>
          </div>
          <Button onClick={() => setNewSessionModal(true)} icon={<Icon.Plus size={16} />}>
            New Session
          </Button>
        </div>

        {/* Filters Panel */}
        <Card className="p-4 max-w-sm">
          <Select
            label="Filter by Class"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            options={classOptions}
          />
        </Card>

        {/* Sessions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="py-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <Icon.ClipboardCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No sessions recorded</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create an attendance session to start tracking presence.</p>
              </div>
              <Button onClick={() => setNewSessionModal(true)}>Create Session</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, i) => {
              const pct = session.stats
                ? session.stats.total > 0
                  ? Math.round((session.stats.present / session.stats.total) * 100)
                  : 0
                : 0;
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                >
                  <Card className="p-5 hover:shadow-md transition-all duration-150 cursor-pointer group" clickable onClick={() => openSession(session.id)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                        <Icon.ClipboardCheck size={18} />
                      </div>
                      <div className="flex gap-1.5">
                        {session.isFinalized && <Badge variant="purple">Finalized</Badge>}
                        <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>{pct}%</Badge>
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                      {session.subject?.name}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-semibold uppercase tracking-wider">{session.class?.name} {session.class?.section ? `· Sec ${session.class.section}` : ''}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(session.date)}</p>
                    <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/40">
                      <ProgressBar value={pct} />
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                        {session.stats?.present ?? 0} of {session.stats?.total ?? 0} students present
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
      <Modal
        open={newSessionModal}
        onClose={() => setNewSessionModal(false)}
        title="Create Attendance Session"
      >
        <div className="space-y-4">
          <Select
            label="Class *"
            value={sessionForm.classId}
            onChange={(e) => setSessionForm(f => ({ ...f, classId: e.target.value, subjectId: '' }))}
            options={[
              { value: '', label: 'Select Class' },
              ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section ?? ''}`.trim() }))
            ]}
          />
          <Select
            label="Subject *"
            value={sessionForm.subjectId}
            onChange={(e) => setSessionForm(f => ({ ...f, subjectId: e.target.value }))}
            options={[
              { value: '', label: 'Select Subject' },
              ...subjects.map((s) => ({ value: s.id, label: s.name }))
            ]}
            disabled={!subjects.length}
          />
          {sessionForm.classId && !subjects.length && (
            <p className="text-xs text-amber-600 font-semibold">No subjects registered for this class. Add subjects first.</p>
          )}
          <Input
            label="Date *"
            type="date"
            value={sessionForm.date}
            onChange={(e) => setSessionForm(f => ({ ...f, date: e.target.value }))}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1.5 tracking-wide">Method Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'MANUAL', label: 'Manual', Icon: Icon.PenLine },
                { value: 'QR',     label: 'QR Code', Icon: Icon.QrCode },
                { value: 'PIN',    label: 'PIN Code', Icon: Icon.Lock },
              ] as const).map(({ value, label, Icon: ModeIcon }) => (
                <button
                  key={value}
                  onClick={() => setSessionForm(f => ({ ...f, mode: value }))}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    sessionForm.mode === value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <ModeIcon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" className="flex-1" onClick={() => setNewSessionModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={creating} onClick={handleCreateSession}>Create Session</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
