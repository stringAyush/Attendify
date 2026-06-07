'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Input, Select, Badge, EmptyState, Modal, Skeleton, useToast, ConfirmDialog } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { classApi, ClassItem, SubjectItem } from '@/lib/api';
import { getApiErrorMessage, getAcademicYears } from '@/lib/utils';
import Link from 'next/link';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  section: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().optional(),
});

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().optional(),
});

type ClassForm = z.infer<typeof classSchema>;
type SubjectForm = z.infer<typeof subjectSchema>;

// ─── Class Card ───────────────────────────────────────────────
function ClassCard({
  cls,
  index,
  onManageSubjects,
  onDelete,
}: {
  cls: ClassItem;
  index: number;
  onManageSubjects: (cls: ClassItem) => void;
  onDelete: (id: string) => void;
}) {
  const initials = cls.name.slice(0, 2).toUpperCase();
  const COLORS = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  ];
  const colorClass = COLORS[cls.name.charCodeAt(0) % COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="p-5 flex flex-col h-full group card-hover">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${colorClass}`}>
            {initials}
          </div>
          {/* Actions — reveal on hover */}
          <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={() => onManageSubjects(cls)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors"
              title="Manage subjects"
            >
              <Icon.BookOpen size={15} />
            </button>
            <button
              onClick={() => onDelete(cls.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              title="Delete class"
            >
              <Icon.Trash2 size={15} />
            </button>
          </div>
        </div>

        <Link href={`/classes/detail?id=${cls.id}`} className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
            {cls.name}
            {cls.section && <span className="text-slate-400 dark:text-slate-500 font-normal"> · {cls.section}</span>}
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            {cls.academicYear}{cls.semester ? ` · ${cls.semester}` : ''}
          </p>
        </Link>

        <div className="flex gap-1.5 mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex-wrap">
          <Badge variant="info" dot size="sm">
            {cls._count?.enrollments ?? 0} students
          </Badge>
          <Badge variant="default" size="sm">
            {cls.subjects?.length ?? 0} subjects
          </Badge>
          <Badge variant="purple" size="sm">
            {cls._count?.sessions ?? 0} sessions
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Subject row in modal ─────────────────────────────────────
function SubjectRow({
  subject,
  onDelete,
}: {
  subject: SubjectItem;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
          <Icon.BookOpen size={13} className="text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{subject.name}</p>
          {subject.code && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{subject.code}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="default" size="sm">{subject._count?.sessions ?? 0} sessions</Badge>
        <button
          onClick={() => onDelete(subject.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors md:opacity-0 md:group-hover:opacity-100"
        >
          <Icon.Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Classes Page ────────────────────────────────────────
export default function ClassesPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [subjectModal, setSubjectModal] = useState<{ classId: string; className: string; subjects: SubjectItem[] } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const academicYears = getAcademicYears();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
    defaultValues: { academicYear: academicYears[0] },
  });

  const {
    register: registerSubject,
    handleSubmit: handleSubjectSubmit,
    reset: resetSubject,
    formState: { errors: subjectErrors },
  } = useForm<SubjectForm>({ resolver: zodResolver(subjectSchema) });

  const loadClasses = useCallback(async () => {
    try {
      const res = await classApi.list({ search, limit: 50 });
      setClasses(res.data as ClassItem[]);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    loadClasses();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('create') === 'true') setCreateOpen(true);
    }
  }, [loadClasses]);

  const handleCreate = async (data: ClassForm) => {
    setSubmitting(true);
    try {
      await classApi.create(data);
      toast('success', 'Class created successfully');
      reset();
      setCreateOpen(false);
      loadClasses();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await classApi.delete(id);
      toast('success', 'Class deleted');
      setDeleteConfirm(null);
      loadClasses();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  const openSubjectModal = async (cls: ClassItem) => {
    try {
      const res = await classApi.getSubjects(cls.id);
      setSubjectModal({ classId: cls.id, className: cls.name, subjects: res.data as SubjectItem[] });
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  const handleAddSubject = async (data: SubjectForm) => {
    if (!subjectModal) return;
    setSubmitting(true);
    try {
      await classApi.createSubject({ ...data, classId: subjectModal.classId });
      toast('success', 'Subject added');
      resetSubject();
      const res = await classApi.getSubjects(subjectModal.classId);
      setSubjectModal({ ...subjectModal, subjects: res.data as SubjectItem[] });
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!subjectModal) return;
    try {
      await classApi.deleteSubject(subjectId);
      toast('success', 'Subject deleted');
      const res = await classApi.getSubjects(subjectModal.classId);
      setSubjectModal({ ...subjectModal, subjects: res.data as SubjectItem[] });
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  return (
    <DashboardLayout title="Classes">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">My Classes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your classes and subjects</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} icon={<Icon.Plus size={15} />}>
            Create Class
          </Button>
        </div>

        {/* ── Search ── */}
        <Input
          placeholder="Search classes by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Icon.Search size={15} />}
        />

        {/* ── Classes grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon={<Icon.BookOpen size={22} />}
            title="No classes yet"
            description="Create your first class to start managing attendance sessions."
            action={<Button onClick={() => setCreateOpen(true)} icon={<Icon.Plus size={14} />}>Create Class</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls, i) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                index={i}
                onManageSubjects={openSubjectModal}
                onDelete={(id) => setDeleteConfirm(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Class Modal ── */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); reset(); }}
        title="Create New Class"
        description="Add a new class to manage attendance"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Input
            label="Class Name *"
            placeholder="e.g., Grade 10, BCA Sem 3"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Section (optional)"
            placeholder="e.g., A, B, Morning"
            error={errors.section?.message}
            {...register('section')}
          />
          <Select
            label="Academic Year *"
            options={academicYears.map((y) => ({ value: y, label: y }))}
            error={errors.academicYear?.message}
            {...register('academicYear')}
          />
          <Input
            label="Semester (optional)"
            placeholder="e.g., First Semester"
            error={errors.semester?.message}
            {...register('semester')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setCreateOpen(false); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              Create Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Subject Management Modal ── */}
      <Modal
        open={!!subjectModal}
        onClose={() => { setSubjectModal(null); resetSubject(); }}
        title={`Subjects — ${subjectModal?.className ?? ''}`}
        description="Add and remove subjects for this class"
        size="md"
      >
        <div className="space-y-4">
          {/* Add form */}
          <form onSubmit={handleSubjectSubmit(handleAddSubject)} className="flex gap-2.5">
            <Input
              placeholder="Subject name..."
              error={subjectErrors.name?.message}
              {...registerSubject('name')}
              className="flex-1"
            />
            <Input placeholder="Code (opt.)" {...registerSubject('code')} className="w-28" />
            <Button type="submit" loading={submitting} size="md">Add</Button>
          </form>
          {/* Subject list */}
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {subjectModal?.subjects.length === 0 ? (
              <div className="text-center py-8">
                <Icon.BookOpen size={20} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No subjects yet. Add one above.</p>
              </div>
            ) : (
              subjectModal?.subjects.map((s) => (
                <SubjectRow key={s.id} subject={s} onDelete={handleDeleteSubject} />
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Class?"
        description="This will remove the class and all associated data. This cannot be undone."
        confirmLabel="Delete Class"
      />
    </DashboardLayout>
  );
}
