'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/shared/Layout';
import { Card, Button, Input, Select, Badge, EmptyState, Modal, Skeleton, useToast, Avatar, ProgressBar } from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { studentApi, classApi, StudentItem, ClassItem } from '@/lib/api';
import { getApiErrorMessage, getAttendanceBg, formatDate } from '@/lib/utils';
import Link from 'next/link';

const studentSchema = z.object({
  name: z.string().min(2, 'Name required'),
  rollNumber: z.string().min(1, 'Roll number required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  classId: z.string().min(1, 'Select a class'),
});
type StudentForm = z.infer<typeof studentSchema>;

export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [importClassId, setImportClassId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  });

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentApi.list({
        page,
        limit: 20,
        search: search || undefined,
        classId: filterClass || undefined,
      });
      setStudents(res.data as StudentItem[]);
      if (res.pagination) setTotalPages(res.pagination.totalPages);
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, search, filterClass, toast]);

  useEffect(() => {
    classApi.list({ limit: 100 }).then((r) => setClasses(r.data as ClassItem[])).catch(() => {});
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('import') === 'true') {
        setImportOpen(true);
      } else if (params.get('create') === 'true' || params.get('add') === 'true') {
        setCreateOpen(true);
      }
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleCreate = async (data: StudentForm) => {
    setSubmitting(true);
    try {
      await studentApi.create({
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });
      toast('success', 'Student added successfully');
      reset();
      setCreateOpen(false);
      loadStudents();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student? All attendance records will be preserved.')) return;
    try {
      await studentApi.delete(id);
      toast('success', 'Student removed');
      loadStudents();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  const handleImport = async () => {
    if (!importFile || !importClassId) {
      toast('error', 'Please select a file and class');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('classId', importClassId);
      const res = await studentApi.bulkImport(formData);
      const result = (res as { data: { created: number; skipped: number; errors: unknown[] } }).data;
      toast('success', `Imported ${result.created} students (${result.skipped} skipped)`);
      setImportOpen(false);
      setImportFile(null);
      setImportClassId('');
      loadStudents();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section ?? ''}`.trim() })),
  ];

  return (
    <DashboardLayout title="Students">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Students</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{students.length} students enrolled</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} icon={<Icon.Upload size={16} />}>
              Import CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)} icon={<Icon.Plus size={16} />}>
              Add Student
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search by name, roll number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px]"
            leftIcon={<Icon.Search size={16} />}
          />
          <Select
            options={classOptions}
            value={filterClass}
            onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
            className="w-48"
          />
        </div>

        {/* Student Table Card */}
        <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-wider uppercase">
                  <th className="text-left px-6 py-3.5">Student Info</th>
                  <th className="text-left px-4 py-3.5 hidden sm:table-cell">Roll No.</th>
                  <th className="text-left px-4 py-3.5 hidden md:table-cell">Class</th>
                  <th className="text-left px-4 py-3.5">Attendance Rate</th>
                  <th className="text-left px-4 py-3.5 hidden lg:table-cell">Enrolled</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-9 w-48" /></td>
                      <td className="px-4 py-4 hidden sm:table-cell"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-4 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-4 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-4" />
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState
                        icon={<Icon.Users size={32} className="text-slate-400 dark:text-slate-500" />}
                        title="No students found"
                        description={search ? 'Try adjusting your search criteria' : 'Add students to your roster to get started'}
                        action={!search && <Button onClick={() => setCreateOpen(true)}>Add Student</Button>}
                      />
                    </td>
                  </tr>
                ) : (
                  students.map((student, i) => {
                    const pct = student.attendancePercentage ?? 0;
                    return (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.015 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={student.name} src={student.avatar} size="sm" />
                            <div className="min-w-0">
                              <Link
                                href={`/students/detail?id=${student.id}`}
                                className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-655 dark:hover:text-indigo-400 transition-colors truncate block"
                              >
                                {student.name}
                              </Link>
                              {student.email && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate font-medium">{student.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <Badge variant="default">{student.rollNumber}</Badge>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-sm font-semibold text-slate-705 dark:text-slate-350">
                            {classes.find((c) => c.id === student.classId)?.name ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-16 hidden sm:block">
                              <ProgressBar value={pct} />
                            </div>
                            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${getAttendanceBg(pct)}`}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{formatDate(student.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/students/detail?id=${student.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <Icon.Eye size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Icon.Trash2 size={16} />
                            </button>
                          </div>
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

      {/* Add Student Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Add Student">
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Input label="Full Name" placeholder="Student's full name" error={errors.name?.message} {...register('name')} />
          <Input label="Roll Number" placeholder="e.g., 101" error={errors.rollNumber?.message} {...register('rollNumber')} />
          <Select
            label="Class"
            options={classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section ?? ''}`.trim() }))}
            placeholder="Select Class"
            error={errors.classId?.message}
            {...register('classId')}
          />
          <Input label="Email (optional)" type="email" placeholder="student@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Phone (optional)" placeholder="+91 98765 43210" {...register('phone')} />
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">Add Student</Button>
          </div>
        </form>
      </Modal>

      {/* Import CSV Modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Students via CSV" description="Upload a CSV file with columns: name, rollNumber, email (optional), phone (optional)">
        <div className="space-y-4">
          <Select
            label="Target Class *"
            options={classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section ?? ''}`.trim() }))}
            placeholder="Select class"
            value={importClassId}
            onChange={(e) => setImportClassId(e.target.value)}
          />
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all"
          >
            <Icon.Upload size={32} className="text-indigo-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {importFile ? importFile.name : 'Click to select CSV file'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Maximum file size: 5MB</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-500 font-mono leading-relaxed">
            name,rollNumber,email,phone<br />
            John Doe,101,john@example.com,9876543210<br />
            Jane Smith,102,,
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={submitting} onClick={handleImport}>Import CSV</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
