'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { attendanceApi } from '@/lib/api';

interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED';
  notes?: string;
}

interface AttendanceState {
  // Current session
  currentSessionId: string | null;
  attendanceMap: Map<string, AttendanceRecord>;
  isMarkingBulk: boolean;
  isDirty: boolean;

  // Actions
  initSession: (sessionId: string) => void;
  markStudent: (
    studentId: string,
    status: AttendanceRecord['status'],
    notes?: string
  ) => void;
  markAll: (status: AttendanceRecord['status'], studentIds: string[]) => void;
  saveAttendance: () => Promise<void>;
  resetSession: () => void;
  getStudentStatus: (studentId: string) => AttendanceRecord['status'] | null;
  getTotals: () => { present: number; absent: number; late: number; total: number };
}

export const useAttendanceStore = create<AttendanceState>()(
  devtools(
    (set, get) => ({
      currentSessionId: null,
      attendanceMap: new Map(),
      isMarkingBulk: false,
      isDirty: false,

      initSession: (sessionId) => {
        set({
          currentSessionId: sessionId,
          attendanceMap: new Map(),
          isDirty: false,
        });
      },

      markStudent: (studentId, status, notes) => {
        const map = new Map(get().attendanceMap);
        map.set(studentId, { studentId, status, notes });
        set({ attendanceMap: map, isDirty: true });
      },

      markAll: (status, studentIds) => {
        const map = new Map(get().attendanceMap);
        studentIds.forEach((id) => {
          map.set(id, { studentId: id, status });
        });
        set({ attendanceMap: map, isDirty: true });
      },

      saveAttendance: async () => {
        const { currentSessionId, attendanceMap } = get();
        if (!currentSessionId) throw new Error('No active session');

        set({ isMarkingBulk: true });
        try {
          const records = Array.from(attendanceMap.values());
          await attendanceApi.markAttendance({
            sessionId: currentSessionId,
            records,
          });
          set({ isDirty: false });
        } finally {
          set({ isMarkingBulk: false });
        }
      },

      resetSession: () => {
        set({
          currentSessionId: null,
          attendanceMap: new Map(),
          isDirty: false,
        });
      },

      getStudentStatus: (studentId) => {
        return get().attendanceMap.get(studentId)?.status ?? null;
      },

      getTotals: () => {
        const records = Array.from(get().attendanceMap.values());
        return {
          present: records.filter((r) => r.status === 'PRESENT').length,
          absent: records.filter((r) => r.status === 'ABSENT').length,
          late: records.filter((r) => r.status === 'LATE').length,
          total: records.length,
        };
      },
    }),
    { name: 'AttendanceStore' }
  )
);
