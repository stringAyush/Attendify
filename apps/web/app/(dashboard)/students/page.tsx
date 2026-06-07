'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/shared/Layout';
import {
  Card, Button, Input, Select, Badge, EmptyState, Modal,
  Skeleton, useToast, Avatar, ProgressBar, ConfirmDialog,
} from '@/components/ui';
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

// ─── Student table row ────────────────────────────────────────
function StudentRow({
  student,
  classes,
  index,
  onDelete,
}: {
  student: StudentItem;
  classes: ClassItem[];
  index: number;
  onDelete: (id: string) => void;
}) {
  const pct = student.attendancePercentage ?? 0;
  const variant = pct >= 85 ? 'success' : pct >= 75 ? 'indigo' : pct >= 50 ? 'warning' : 'danger';
  const className = classes.find((c) => c.id === student.classId)?.name ?? '—';

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.015, 0.3) }}
      className="group border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
    >
      {/* Student info */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} src={student.avatar} size="sm" className="flex-shrink-0" />
          <div className="min-w-0">
            <Link
              href={`/students/detail?id=${student.id}`}
              className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block leading-tight"
            >
              {student.name}
            </Link>
            {student.email && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{student.email}</p>
            )}
          </div>
        </div>
      </td>
      {/* Roll no */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <Badge variant="default" size="sm">{student.rollNumber}</Badge>
      </td>
      {/* Class */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{className}</span>
      </td>
      {/* Attendance */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-16 hidden sm:block">
            <ProgressBar value={pct} size="xs" />
          </div>
          <Badge variant={variant} size="sm">{pct}%</Badge>
        </div>
      </td>
      {/* Enrolled date */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(student.createdAt)}</span>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          <Link
            href={`/students/detail?id=${student.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors"
            title="View student"
          >
            <Icon.Eye size={14} />
          </Link>
          <button
            onClick={() => onDelete(student.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            title="Remove student"
          >
            <Icon.Trash2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── CSV Dropzone ─────────────────────────────────────────────
function CsvDropzone({
  file,
  onFileChange,
}: {
  file: File | null;
  onFileChange: (f: File | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) onFileChange(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 ${
        dragging
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
          : file
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/30'
      }`}
    >
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
            <Icon.CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{file.name}</p>
          <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
          <button
            onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
            className="text-xs text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icon.Upload size={18} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Drop CSV here or click to browse
          </p>
          <p className="text-xs text-slate-400">Only .csv files · Max 5MB</p>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

// ─── Main Students Page ───────────────────────────────────────
export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [importClassId, setImportClassId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  });

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentApi.list({
        page, limit: 25,
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
      if (params.get('import') === 'true') setImportOpen(true);
      else if (params.get('create') === 'true' || params.get('add') === 'true') setCreateOpen(true);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleCreate = async (data: StudentForm) => {
    setSubmitting(true);
    try {
      await studentApi.create({ ...data, email: data.email || undefined, phone: data.phone || undefined });
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
    try {
      await studentApi.delete(id);
      toast('success', 'Student removed');
      setDeleteConfirm(null);
      loadStudents();
    } catch (e) {
      toast('error', getApiErrorMessage(e));
    }
  };

  const handleImport = async () => {
    if (!importFile || !importClassId) { toast('error', 'Select a class and CSV file'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('classId', importClassId);
      const res = await studentApi.bulkImport(formData);
      const result = (res as { data: { created: number; skipped: number } }).data;
      toast('success', `Imported ${result.created} students · ${result.skipped} skipped`);
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
    ...classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` · ${c.section}` : ''}` })),
  ];

  return (
    <DashboardLayout title="Students">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Students</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {loading ? 'Loading…' : `${students.length} students enrolled`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} icon={<Icon.Upload size={14} />}>
              Import CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)} icon={<Icon.Plus size={14} />}>
              Add Student
            </Button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <Input
            placeholder="Search by name, roll number or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            leftIcon={<Icon.Search size={15} />}
            className="flex-1"
          />
          <div className="w-full sm:w-44 flex-shrink-0">
            <Select
              options={classOptions}
              value={filterClass}
              onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* ── Student table ── */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30">
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:table-cell">Roll No.</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">Class</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Attendance</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden lg:table-cell">Enrolled</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800/40">
                      <td className="px-5 py-3"><Skeleton className="h-9 w-40" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-14" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState
                        icon={<Icon.Users size={20} />}
                        title="No students found"
                        description={search ? 'Try different search terms or clear filters.' : 'Add students to your roster to get started.'}
                        action={!search && (
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setImportOpen(true)} icon={<Icon.Upload size={13} />}>Import CSV</Button>
                            <Button onClick={() => setCreateOpen(true)} icon={<Icon.Plus size={13} />}>Add Student</Button>
                          </div>
                        )}
                      />
                    </td>
                  </tr>
                ) : (
                  students.map((student, i) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      classes={classes}
                      index={i}
                      onDelete={(id) => setDeleteConfirm(id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                icon={<Icon.ChevronLeft size={14} />}>
                Prev
              </Button>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                iconRight={<Icon.ChevronRight size={14} />}>
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* ── Add Student Modal ── */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Add Student" description="Enroll a new student">
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Input label="Full Name *" placeholder="Student's full name" error={errors.name?.message} {...register('name')} />
          <Input label="Roll Number *" placeholder="e.g., 101" error={errors.rollNumber?.message} {...register('rollNumber')} />
          <Select
            label="Class *"
            options={classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` · ${c.section}` : ''}` }))}
            placeholder="Select Class"
            error={errors.classId?.message}
            {...register('classId')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" placeholder="student@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Phone" placeholder="+91 98765 43210" {...register('phone')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">Add Student</Button>
          </div>
        </form>
      </Modal>

      {/* ── Import CSV Modal ── */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportFile(null); setImportClassId(''); }}
        title="Import Students via CSV"
        description="Upload a CSV with columns: name, rollNumber, email (optional), phone (optional)"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Target Class *"
            options={classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` · ${c.section}` : ''}` }))}
            placeholder="Select class"
            value={importClassId}
            onChange={(e) => setImportClassId(e.target.value)}
          />
          <CsvDropzone file={importFile} onFileChange={setImportFile} />
          {/* CSV format hint */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Expected format</p>
            <pre className="text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed overflow-x-auto">
              {`name,rollNumber,email,phone\nJohn Doe,101,john@email.com,9876543210\nJane Smith,102,,`}
            </pre>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={submitting} onClick={handleImport} disabled={!importFile || !importClassId}
              icon={<Icon.Upload size={14} />}>
              Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Remove Student?"
        description="The student will be removed from the roster. All existing attendance records are preserved."
        confirmLabel="Remove Student"
      />
    </DashboardLayout>
  );
}
