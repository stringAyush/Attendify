'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Input, Select, Badge, EmptyState, Modal, Skeleton, useToast } from '@/components/ui';
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

export default function ClassesPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [subjectModal, setSubjectModal] = useState<{ classId: string; subjects: SubjectItem[] } | null>(null);
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
      if (params.get('create') === 'true') {
        setCreateOpen(true);
      }
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
    if (!confirm('Delete this class? This action cannot be undone.')) return;
    try {
      await classApi.delete(id);
      toast('success', 'Class deleted');
      loadClasses();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  const openSubjectModal = async (cls: ClassItem) => {
    try {
      const res = await classApi.getSubjects(cls.id);
      setSubjectModal({ classId: cls.id, subjects: res.data as SubjectItem[] });
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
    if (!confirm('Delete this subject?')) return;
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Classes</h2>
            <p className="text-slate-500 text-sm mt-0.5">Manage your classes and subjects</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} icon={<span className="text-lg">+</span>}>
            Create Class
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
        />

        {/* Classes Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            title="No classes yet"
            description="Create your first class to start managing attendance"
            action={<Button onClick={() => setCreateOpen(true)}>Create Class</Button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-indigo-900/30">
                      {cls.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openSubjectModal(cls)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        title="Manage subjects"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete class"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>

                  <Link href={`/classes/detail?id=${cls.id}`}>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors">
                      {cls.name} {cls.section && <span className="text-slate-400">· {cls.section}</span>}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">{cls.academicYear} {cls.semester && `· ${cls.semester}`}</p>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="info">{cls._count?.enrollments ?? 0} students</Badge>
                    <Badge variant="purple">{cls._count?.sessions ?? 0} sessions</Badge>
                    <Badge variant="default">{cls.subjects?.length ?? 0} subjects</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Create New Class" description="Add a new class to manage attendance">
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Input label="Class Name" placeholder="e.g., Grade 10, BCA Sem 3" error={errors.name?.message} {...register('name')} />
          <Input label="Section (optional)" placeholder="e.g., A, B, Morning" error={errors.section?.message} {...register('section')} />
          <Select
            label="Academic Year"
            options={academicYears.map((y) => ({ value: y, label: y }))}
            error={errors.academicYear?.message}
            {...register('academicYear')}
          />
          <Input label="Semester (optional)" placeholder="e.g., First Semester" error={errors.semester?.message} {...register('semester')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">Create Class</Button>
          </div>
        </form>
      </Modal>

      {/* Subject Management Modal */}
      <Modal
        open={!!subjectModal}
        onClose={() => { setSubjectModal(null); resetSubject(); }}
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
            {subjectModal?.subjects.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No subjects added yet</p>
            ) : (
              subjectModal?.subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</span>
                    {s.code && <span className="text-xs text-slate-400 ml-2">({s.code})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{s._count?.sessions ?? 0} sessions</Badge>
                    <button
                      onClick={() => handleDeleteSubject(s.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
