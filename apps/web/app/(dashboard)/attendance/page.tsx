'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/shared/Layout';
import {
  Card, Button, Badge, Skeleton, useToast, Avatar, ProgressBar, ProgressRing,
  Modal, Select, Input, FilterChip, AttendanceChip, PageHeader, Tabs, ConfirmDialog,
} from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import {
  attendanceApi, classApi,
  AttendanceSessionItem, ClassItem, AttendanceSessionWithRecords,
} from '@/lib/api';
import { useAttendanceStore } from '@/lib/store/attendance.store';
import { getApiErrorMessage, formatDate } from '@/lib/utils';
import Link from 'next/link';

type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';

// ─── Session Summary Card ─────────────────────────────────────
function SessionSummaryOverlay({
  session,
  totals,
  onClose,
}: {
  session: AttendanceSessionWithRecords;
  totals: { present: number; absent: number; late: number; halfDay: number; total: number };
  onClose: () => void;
}) {
  const pct = totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <ProgressRing value={pct} size={80} strokeWidth={6} />
          </div>
          <h2 className="text-xl font-extrabold">{session.subject?.name}</h2>
          <p className="text-indigo-200 text-sm mt-1">{session.class?.name} · {formatDate(session.date)}</p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
              <Icon.CheckCircle size={12} />
              Session Finalized
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
          {[
            { label: 'Present', value: totals.present, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Absent',  value: totals.absent,  color: 'text-red-600 dark:text-red-400' },
            { label: 'Late',    value: totals.late,    color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Half',    value: totals.halfDay, color: 'text-sky-600 dark:text-sky-400' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-4">
              <span className={`text-2xl font-extrabold tabular-nums ${s.color}`}>{s.value}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Back to Sessions
          </Button>
          <Link href="/reports" className="flex-1">
            <Button className="w-full" icon={<Icon.Download size={14} />}>
              Export Report
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mark Attendance View ─────────────────────────────────────
function MarkAttendanceView({
  session,
  onClose,
}: {
  session: AttendanceSessionWithRecords;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { attendanceMap, markStudent, markAll, saveAttendance, isDirty, isMarkingBulk, getTotals } =
    useAttendanceStore();
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AttStatus | 'ALL'>('ALL');

  const students = session.records.map((r) => r.student).filter(Boolean);

  // Init from existing records
  useEffect(() => {
    session.records.forEach((r) => {
      if (r.student) markStudent(r.student.id, r.status as AttStatus);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const totals = getTotals();
  const halfDayCount = Array.from(attendanceMap.values()).filter((r) => r.status === 'HALF_DAY').length;
  const markedCount = attendanceMap.size;
  const pct = totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0;

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (!student) return false;
      const matchesSearch = !searchQuery || student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' || (attendanceMap.get(student.id)?.status ?? 'ABSENT') === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, filterStatus, attendanceMap]);

  const handleSave = async () => {
    try {
      await saveAttendance();
      toast('success', 'Draft saved successfully');
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  const executeFinalize = async () => {
    setIsFinalizing(true);
    try {
      if (isDirty) await saveAttendance();
      await attendanceApi.finalizeSession(session.id);
      toast('success', 'Session finalized and locked');
      setShowFinalizeConfirm(false);
      setShowSummary(true);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setIsFinalizing(false);
    }
  };

  const filterTabs = [
    { id: 'ALL',     label: 'All',     count: students.length },
    { id: 'PRESENT', label: 'Present', count: totals.present },
    { id: 'ABSENT',  label: 'Absent',  count: totals.absent },
    { id: 'LATE',    label: 'Late',    count: totals.late },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* ── Session info bar ── */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Left: subject info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40 flex items-center justify-center flex-shrink-0">
                <Icon.ClipboardCheck size={17} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 truncate">{session.subject?.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {session.class?.name} · {formatDate(session.date)}
                </p>
              </div>
            </div>

            {/* Right: status badges + progress ring */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <Badge variant="success" dot>{totals.present} P</Badge>
                <Badge variant="danger" dot>{totals.absent} A</Badge>
                <Badge variant="warning" dot>{totals.late} L</Badge>
              </div>
              <ProgressRing value={pct} size={40} strokeWidth={3.5} />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              <span>Presence Rate</span>
              <span className="tabular-nums">
                {markedCount} / {students.length} marked
              </span>
            </div>
            <ProgressBar value={pct} size="sm" />
          </div>

          {/* Mark-all row */}
          <div className="flex items-center gap-3 mt-3.5 pt-3 border-t border-slate-50 dark:border-slate-800/60 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Mark all:</span>
            <div className="flex gap-2">
              {(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'] as AttStatus[]).map((s) => (
                <AttendanceChip
                  key={s}
                  status={s}
                  selected={false}
                  compact
                  disabled={session.isFinalized}
                  onClick={() => markAll(s, students.filter(Boolean).map((st) => st!.id))}
                />
              ))}
            </div>
            {!session.isFinalized && (
              <div className="ml-auto flex gap-2">
                {isDirty && (
                  <Button size="sm" variant="outline" onClick={handleSave} loading={isMarkingBulk}>
                    Save Draft
                  </Button>
                )}
                <Button size="sm" onClick={() => setShowFinalizeConfirm(true)}>
                  <Icon.CheckCircle size={13} />
                  Finalize
                </Button>
              </div>
            )}
            {session.isFinalized && (
              <Badge variant="purple" className="ml-auto">
                <Icon.Lock size={10} />
                Finalized
              </Badge>
            )}
          </div>
        </Card>

        {/* ── Search + Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Icon.Search size={15} />}
            className="flex-1"
          />
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {filterTabs.map((tab) => (
              <FilterChip
                key={tab.id}
                label={tab.label}
                active={filterStatus === tab.id}
                onClick={() => setFilterStatus(tab.id as AttStatus | 'ALL')}
                count={tab.count}
              />
            ))}
          </div>
        </div>

        {/* ── Student list ── */}
        <Card className="overflow-hidden">
          <AnimatePresence mode="popLayout">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Icon.Search size={22} className="text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No students found</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search or filter</p>
              </div>
            ) : (
              filteredStudents.map((student, i) => {
                if (!student) return null;
                const currentStatus = (attendanceMap.get(student.id)?.status ?? 'ABSENT') as AttStatus;

                return (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: i < 20 ? i * 0.012 : 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Student Info (Avatar + Name + Roll) */}
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <Avatar name={student.name} size="sm" className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug break-words">
                          {student.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          Roll: {student.rollNumber ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* Status chips */}
                    <div className="grid grid-cols-4 gap-2 w-full sm:flex sm:w-auto sm:gap-1.5 flex-shrink-0">
                      {(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'] as AttStatus[]).map((s) => (
                        <AttendanceChip
                          key={s}
                          status={s}
                          selected={currentStatus === s}
                          disabled={session.isFinalized}
                          onClick={() => markStudent(student.id, s)}
                          className="w-full sm:w-auto"
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* ── Sticky save bar ── */}
      <AnimatePresence>
        {isDirty && !session.isFinalized && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-sm"
          >
            <div className="bg-slate-950 dark:bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">
              <span className="text-xs font-semibold text-slate-400 flex-1">Unsaved changes</span>
              <Button size="sm" variant="ghost" onClick={handleSave} loading={isMarkingBulk}
                className="text-slate-300 hover:text-white hover:bg-slate-800">
                Save
              </Button>
              <Button size="sm" onClick={() => setShowFinalizeConfirm(true)}>
                Finalize
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Finalize confirm ── */}
      <ConfirmDialog
        open={showFinalizeConfirm}
        onClose={() => setShowFinalizeConfirm(false)}
        onConfirm={executeFinalize}
        loading={isFinalizing}
        title="Finalize Attendance?"
        description={`This will permanently lock the session. ${totals.total} students · ${pct}% attendance rate.`}
        confirmLabel="Yes, Finalize"
        confirmVariant="primary"
      />

      {/* ── Session Summary overlay ── */}
      <AnimatePresence>
        {showSummary && (
          <SessionSummaryOverlay
            session={session}
            totals={{ ...totals, halfDay: halfDayCount }}
            onClose={() => { setShowSummary(false); onClose(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Session Card ─────────────────────────────────────────────
function SessionCard({
  session,
  index,
  onClick,
}: {
  session: AttendanceSessionItem;
  index: number;
  onClick: () => void;
}) {
  const pct = session.stats?.total
    ? Math.round((session.stats.present / session.stats.total) * 100)
    : 0;

  const statusVariant = pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger';

  const createdTime = session.createdAt
    ? new Date(session.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        clickable
        onClick={onClick}
        className="p-4 group"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <Icon.ClipboardCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex gap-1.5">
            {session.isFinalized && <Badge variant="purple" size="sm">Locked</Badge>}
            <Badge variant={statusVariant} size="sm">{pct}%</Badge>
          </div>
        </div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
          {session.subject?.name}
        </h3>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold uppercase tracking-wide truncate">
          {session.class?.name}{session.class?.section ? ` · ${session.class.section}` : ''}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-[11px] text-slate-400">{formatDate(session.date)}</p>
          {createdTime && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Icon.Clock size={10} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
              {createdTime}
            </span>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/40">
          <ProgressBar value={pct} size="xs" />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
            {session.stats?.present ?? 0} / {session.stats?.total ?? 0} present
          </p>
        </div>
      </Card>
    </motion.div>
  );
}


// ─── Create Session Modal ─────────────────────────────────────
function CreateSessionModal({
  open,
  onClose,
  classes,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  classes: ClassItem[];
  onCreated: (sessionId: string) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    classId: '', subjectId: '', date: new Date().toISOString().split('T')[0], notes: '',
  });
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (form.classId) {
      classApi.getSubjects(form.classId)
        .then((r) => setSubjects(r.data as { id: string; name: string }[]))
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [form.classId]);

  const handleCreate = async () => {
    if (!form.classId || !form.subjectId || !form.date) {
      toast('error', 'Please fill all required fields');
      return;
    }
    setCreating(true);
    try {
      const res = await attendanceApi.createSession({
        classId: form.classId,
        subjectId: form.subjectId,
        date: form.date,
        mode: 'MANUAL',
        notes: form.notes || undefined,
      });
      onClose();
      toast('success', 'Session created');
      onCreated((res.data as AttendanceSessionItem).id);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setForm({ classId: '', subjectId: '', date: new Date().toISOString().split('T')[0], notes: '' });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Attendance Session"
      description="Select class, subject, and date to create a session"
      size="md"
    >
      <div className="space-y-4">
        <Select
          label="Class *"
          value={form.classId}
          onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value, subjectId: '' }))}
          options={[
            { value: '', label: 'Select a class...' },
            ...classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` · ${c.section}` : ''}` })),
          ]}
        />
        <Select
          label="Subject *"
          value={form.subjectId}
          onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
          disabled={!subjects.length}
          options={[
            { value: '', label: subjects.length ? 'Select a subject...' : 'Select a class first' },
            ...subjects.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        {form.classId && !subjects.length && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
            <Icon.AlertTriangle size={13} /> No subjects found. Add subjects to this class first.
          </p>
        )}
        <Input
          label="Date *"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
        <Input
          label="Notes"
          placeholder="Optional notes for this session"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>Cancel</Button>
          <Button
            className="flex-1"
            loading={creating}
            onClick={handleCreate}
            disabled={!form.classId || !form.subjectId || !form.date}
          >
            <Icon.Zap size={14} />
            Create Session
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Attendance Page ─────────────────────────────────────
export default function AttendancePage() {
  const { toast } = useToast();
  const { initSession } = useAttendanceStore();
  const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<AttendanceSessionWithRecords | null>(null);
  const [filterClass, setFilterClass] = useState('');
  const [newSessionModal, setNewSessionModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'week' | 'finalized'>('all');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getSessions({ classId: filterClass || undefined, limit: 40 });
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
      if (params.get('create') === 'true') setNewSessionModal(true);
    }
  }, [loadSessions]);

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

  const filteredSessions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return sessions.filter((s) => {
      if (activeFilter === 'today') return s.date.startsWith(today);
      if (activeFilter === 'week') return s.date >= weekAgo;
      if (activeFilter === 'finalized') return s.isFinalized;
      return true;
    });
  }, [sessions, activeFilter]);

  const filterChips = [
    { id: 'all',       label: 'All Sessions', count: sessions.length },
    { id: 'today',     label: 'Today' },
    { id: 'week',      label: 'This Week' },
    { id: 'finalized', label: 'Finalized', count: sessions.filter((s) => s.isFinalized).length },
  ];

  // ── Mark Attendance view ──
  if (activeSession) {
    return (
      <DashboardLayout title="Mark Attendance">
        <div className="space-y-5">
          <PageHeader
            title="Mark Attendance"
            subtitle={`${activeSession.subject?.name} · ${activeSession.class?.name}`}
            onBack={() => { setActiveSession(null); loadSessions(); }}
          />
          <MarkAttendanceView
            session={activeSession}
            onClose={() => { setActiveSession(null); loadSessions(); }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Attendance">
      <div className="space-y-6">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Attendance Sessions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage and take class attendance
            </p>
          </div>
          <Button onClick={() => setNewSessionModal(true)} icon={<Icon.Plus size={15} />}>
            New Session
          </Button>
        </div>

        {/* ── Filter row ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Class filter */}
          {classes.length > 0 && (
            <div className="w-full sm:w-48 flex-shrink-0">
              <Select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                options={[
                  { value: '', label: 'All Classes' },
                  ...classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` · ${c.section}` : ''}` })),
                ]}
              />
            </div>
          )}
          {/* Status filter chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {filterChips.map((chip) => (
              <FilterChip
                key={chip.id}
                label={chip.label}
                active={activeFilter === chip.id}
                onClick={() => setActiveFilter(chip.id as typeof activeFilter)}
                count={chip.count}
              />
            ))}
          </div>
        </div>

        {/* ── Sessions grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : filteredSessions.length === 0 ? (
          <Card className="py-16 text-center">
            <div className="max-w-xs mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                <Icon.ClipboardCheck size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No sessions found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
                {activeFilter === 'all'
                  ? 'Create your first attendance session to get started.'
                  : 'No sessions match this filter.'}
              </p>
              <Button onClick={() => setNewSessionModal(true)} icon={<Icon.Plus size={15} />}>
                Create Session
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session, i) => (
              <SessionCard
                key={session.id}
                session={session}
                index={i}
                onClick={() => openSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create session modal ── */}
      <CreateSessionModal
        open={newSessionModal}
        onClose={() => setNewSessionModal(false)}
        classes={classes}
        onCreated={(id) => openSession(id)}
      />
    </DashboardLayout>
  );
}
