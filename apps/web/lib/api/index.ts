import { apiGet, apiPost, apiPut, apiDelete, apiUpload, apiClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: 'TEACHER' | 'ADMIN';
  teacher?: {
    id: string;
    institutionId: string | null;
    institution: { id: string; name: string } | null;
  };
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  signup: (data: {
    name: string;
    email: string;
    password: string;
    institutionName?: string;
  }) => apiPost<AuthResult>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    apiPost<AuthResult>('/auth/login', data),

  googleAuth: (code: string, redirectUri: string) => apiPost<AuthResult>('/auth/google', { code, redirectUri }),

  refresh: (refreshToken: string) =>
    apiPost<AuthResult>('/auth/refresh', { refreshToken }),

  logout: () => apiPost<null>('/auth/logout'),

  forgotPassword: (email: string) =>
    apiPost<null>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiPost<null>('/auth/reset-password', { token, password }),

  me: () => apiGet<AuthUser>('/auth/me'),
};

// ─── Classes ──────────────────────────────────────────────────
export const classApi = {
  list: (params?: Record<string, unknown>) =>
    apiGet<ClassItem[]>('/classes', params),

  create: (data: {
    name: string;
    section?: string;
    academicYear: string;
    semester?: string;
  }) => apiPost<ClassItem>('/classes', data),

  get: (id: string) => apiGet<ClassItem>(`/classes/${id}`),

  update: (
    id: string,
    data: Partial<{ name: string; section: string; academicYear: string; semester: string }>
  ) => apiPut<ClassItem>(`/classes/${id}`, data),

  delete: (id: string) => apiDelete<null>(`/classes/${id}`),

  getSubjects: (classId: string) =>
    apiGet<SubjectItem[]>(`/classes/${classId}/subjects`),

  createSubject: (data: {
    name: string;
    code?: string;
    classId: string;
  }) => apiPost<SubjectItem>('/classes/subjects/create', data),

  updateSubject: (id: string, data: Partial<{ name: string; code: string }>) =>
    apiPut<SubjectItem>(`/classes/subjects/${id}`, data),

  deleteSubject: (id: string) => apiDelete<null>(`/classes/subjects/${id}`),
};

// ─── Students ─────────────────────────────────────────────────
export const studentApi = {
  list: (params?: Record<string, unknown>) =>
    apiGet<StudentItem[]>('/students', params),

  create: (data: {
    name: string;
    rollNumber: string;
    email?: string;
    phone?: string;
    classId: string;
  }) => apiPost<StudentItem>('/students', data),

  get: (id: string) => apiGet<StudentItem>(`/students/${id}`),

  update: (id: string, data: Partial<StudentItem>) =>
    apiPut<StudentItem>(`/students/${id}`, data),

  delete: (id: string) => apiDelete<null>(`/students/${id}`),

  getAttendance: (id: string, params?: Record<string, unknown>) =>
    apiGet<StudentAttendanceHistory>(`/students/${id}/attendance`, params),

  bulkImport: (formData: FormData) =>
    apiUpload<BulkImportResult>('/students/bulk-import', formData),
};

// ─── Attendance ───────────────────────────────────────────────
export const attendanceApi = {
  dashboard: () => apiGet<DashboardStats>('/attendance/dashboard'),

  getSessions: (params?: Record<string, unknown>) =>
    apiGet<AttendanceSessionItem[]>('/attendance/sessions', params),

  createSession: (data: {
    subjectId: string;
    classId: string;
    date: string;
    mode?: string;
    notes?: string;
  }) => apiPost<AttendanceSessionItem>('/attendance/sessions', data),

  getSession: (id: string) =>
    apiGet<AttendanceSessionWithRecords>(`/attendance/sessions/${id}`),

  finalizeSession: (id: string) =>
    apiPut<AttendanceSessionItem>(`/attendance/sessions/${id}/finalize`),

  markAttendance: (data: {
    sessionId: string;
    records: { studentId: string; status: string; notes?: string }[];
  }) => apiPost<AttendanceRecord[]>('/attendance/mark', data),

  updateRecord: (id: string, data: { status: string; notes?: string }) =>
    apiPut<AttendanceRecord>(`/attendance/records/${id}`, data),

  getAnalytics: (params?: Record<string, unknown>) =>
    apiGet<AttendanceAnalytics>('/attendance/analytics', params),
};

// ─── Reports ──────────────────────────────────────────────────
export const reportApi = {
  getStudentReport: (studentId: string, params: Record<string, unknown>) =>
    apiGet<StudentReport>(`/reports/student/${studentId}`, params),

  getClassReport: (classId: string, params: Record<string, unknown>) =>
    apiGet<ClassReport>(`/reports/class/${classId}`, params),

  exportCsv: (data: {
    classId: string;
    startDate: string;
    endDate: string;
    subjectId?: string;
  }) => apiClient.post('/reports/export/csv', data, { responseType: 'blob' }),

  exportPdf: (data: {
    classId: string;
    startDate: string;
    endDate: string;
    subjectId?: string;
  }) => apiClient.post('/reports/export/pdf', data, { responseType: 'blob' }),
};

// Note: paginated endpoints return ApiResponse<T[]> where pagination
// is at res.pagination (top-level on the response, not nested in res.data)

// ─── Type Definitions ─────────────────────────────────────────

export interface ClassItem {
  id: string;
  name: string;
  section: string | null;
  academicYear: string;
  semester: string | null;
  subjects?: SubjectItem[];
  _count?: { enrollments: number; sessions: number };
  createdAt: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string | null;
  classId: string;
  schedule: ScheduleSlot[];
  _count?: { sessions: number };
}

export interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface StudentItem {
  id: string;
  name: string;
  rollNumber: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  classId: string;
  isActive: boolean;
  attendancePercentage?: number;
  totalSessions?: number;
  class?: { name: string; section: string | null };
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED';
  notes: string | null;
  markedAt: string;
  student?: StudentItem;
}

export interface AttendanceSessionItem {
  id: string;
  subjectId: string;
  classId: string;
  date: string;
  mode: 'MANUAL' | 'QR' | 'PIN';
  isFinalized: boolean;
  notes: string | null;
  createdAt?: string;
  subject?: { name: string; code: string | null };
  class?: { name: string; section: string | null };
  _count?: { records: number };
  stats?: { total: number; present: number; absent: number; late: number };
}

export interface AttendanceSessionWithRecords extends AttendanceSessionItem {
  records: AttendanceRecord[];
}

export interface AtRiskStudent {
  id: string;
  name: string;
  rollNumber: string;
  attendanceRate: number;
  totalSessions: number;
  className: string;
}

export interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  recentSessions: AttendanceSessionItem[];
  monthlyTrend: { date: string; present: number; absent: number; late: number; percentage: number }[];
  atRiskStudents?: AtRiskStudent[];
}

export interface AttendanceAnalytics {
  totalSessions: number;
  averageAttendance: number;
  presentCount: number;
  absentCount: number;
  trend: { date: string; present: number; absent: number; late: number; percentage: number }[];
  subjectWise: { subjectId: string; subjectName: string; totalSessions: number; averageAttendance: number }[];
}

export interface StudentAttendanceHistory {
  student: StudentItem;
  records: AttendanceRecord[];
  summary: {
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export interface StudentReport {
  student: StudentItem;
  records: AttendanceRecord[];
  summary: {
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    percentage: number;
  };
  period: { startDate: string; endDate: string };
}

export interface ClassReport {
  class: ClassItem;
  sessions: AttendanceSessionItem[];
  studentSummaries: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
  }[];
  period: { startDate: string; endDate: string };
}
