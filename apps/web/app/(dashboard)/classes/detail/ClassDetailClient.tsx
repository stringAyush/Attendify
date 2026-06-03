'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Badge, Skeleton, useToast, EmptyState, Input, Modal } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { classApi, ClassItem, SubjectItem, AttendanceSessionItem } from '@/lib/api';
import { attendanceApi } from '@/lib/api';
import { getApiErrorMessage, formatDate } from '@/lib/utils';

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().optional(),
});

type SubjectForm = z.infer<typeof subjectSchema>;

export default function ClassDetailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = searchParams.get('id') || '';

  const [cls, setCls] = useState<ClassItem | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register: registerSubject,
    handleSubmit: handleSubjectSubmit,
    reset: resetSubject,
    formState: { errors: subjectErrors },
  } = useForm<SubjectForm>({ resolver: zodResolver(subjectSchema) });

  const handleAddSubject = async (data: SubjectForm) => {
    if (!classId) return;
    setSubmitting(true);
    try {
      await classApi.createSubject({ ...data, classId });
      toast('success', 'Subject added');
      resetSubject();
      const res = await classApi.getSubjects(classId);
      setSubjects(res.data as SubjectItem[]);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!classId || !confirm('Delete this subject?')) return;
    try {
      await classApi.deleteSubject(subjectId);
      toast('success', 'Subject deleted');
      const res = await classApi.getSubjects(classId);
      setSubjects(res.data as SubjectItem[]);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [classRes, subjectRes, sessionRes] = await Promise.all([
          classApi.get(classId),
          classApi.getSubjects(classId),
          attendanceApi.getSessions({ classId, limit: 10 }),
        ]);
        setCls(classRes.data as ClassItem);
        setSubjects(subjectRes.data as SubjectItem[]);
        setSessions(sessionRes.data as AttendanceSessionItem[]);
      } catch (e) {
        toast('error', getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId, toast]);

  const handleDelete = async () => {
    if (!classId || !confirm('Delete this class and all its data? This cannot be undone.')) return;
    try {
      await classApi.delete(classId);
      toast('success', 'Class deleted');
      router.push('/classes');
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  if (!classId) {
    return (
      <DashboardLayout title="Class Details">
        <Card className="p-6 text-center max-w-md mx-auto space-y-4">
          <p className="text-slate-500">No class ID provided.</p>
          <Link href="/classes" className="mt-4 inline-block">
            <Button size="sm">Go back to Classes</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={cls?.name ?? 'Class'}>
      <div className="space-y-6 max-w-5xl">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
        >
          <Icon.ArrowLeft size={16} />
          Back to Classes
        </button>

        {/* Header Card */}
        {loading ? (
          <Skeleton className="h-36 rounded-2xl" />
        ) : cls && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-650 dark:text-indigo-400 font-bold text-base shadow-xs">
                    {cls.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                      {cls.name} {cls.section && <span className="text-slate-400 dark:text-slate-500 font-normal">· {cls.section}</span>}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{cls.academicYear} {cls.semester && `· ${cls.semester}`}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/attendance?classId=${cls.id}`}>
                    <Button size="sm" icon={<Icon.ClipboardCheck size={16} />}>
                      Take Attendance
                    </Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={handleDelete}>Delete Class</Button>
                </div>
              </div>

              <div className="flex gap-1.5 mt-5 pt-4 border-t border-slate-50 dark:border-slate-800/40 flex-wrap">
                <Badge variant="info">{cls._count?.enrollments ?? 0} students</Badge>
                <Badge variant="purple">{cls._count?.sessions ?? 0} sessions</Badge>
                <Badge variant="default">{subjects.length} subjects</Badge>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Two-column: Subjects + Recent Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subjects */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Subjects</h3>
                <Badge variant="default">{subjects.length}</Badge>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setSubjectModalOpen(true)}>
                Manage Subjects
              </Button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No subjects added yet</p>
            ) : (
              <div className="space-y-2">
                {subjects.map((subject, i) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{subject.name}</p>
                      {subject.code && <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mt-0.5">{subject.code}</p>}
                    </div>
                    <Badge variant="default">{subject._count?.sessions ?? 0} sessions</Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Sessions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Recent Sessions</h3>
              <Link href={`/attendance?classId=${classId}`} className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={<Icon.Clipboard size={24} className="text-slate-400 dark:text-slate-500" />}
                title="No sessions yet"
                description="Take attendance to see sessions here"
              />
            ) : (
              <div className="space-y-2">
                {sessions.map((session, i) => {
                  const pct = session.stats?.total
                    ? Math.round((session.stats.present / session.stats.total) * 100)
                    : 0;
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.025 }}
                    >
                      <Link
                        href={`/attendance`}
                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                            {session.subject?.name}
                          </p>
                          <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mt-0.5">{formatDate(session.date)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>
                            {pct}%
                          </Badge>
                          {session.isFinalized && <Badge variant="purple">Final</Badge>}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Students quick link */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Students in this class</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{cls?._count?.enrollments ?? 0} enrolled students</p>
            </div>
            <Link href={`/students?classId=${classId}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-660 dark:text-indigo-400 hover:underline">
              <span>View Students</span>
              <Icon.ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      </div>

      {/* Subject Management Modal */}
      <Modal
        open={subjectModalOpen}
        onClose={() => { setSubjectModalOpen(false); resetSubject(); }}
        title="Manage Subjects"
        description="Add and manage subjects for this class"
        size="lg"
      >
        <div className="space-y-4">
          {/* Add Subject Form */}
          <form onSubmit={handleSubjectSubmit(handleAddSubject)} className="flex gap-3">
            <Input
              placeholder="Subject name"
              error={subjectErrors.name?.message}
              {...registerSubject('name')}
              className="flex-1"
            />
            <Input placeholder="Code (opt.)" {...registerSubject('code')} className="w-28" />
            <Button type="submit" loading={submitting} size="md">Add</Button>
          </form>

          {/* Subject List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {subjects.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No subjects added yet</p>
            ) : (
              subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100/50 dark:border-slate-800">
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                    {s.code && <span className="text-xs text-slate-400 ml-2">({s.code})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{s._count?.sessions ?? 0} sessions</Badge>
                    <button
                      onClick={() => handleDeleteSubject(s.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Icon.Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
