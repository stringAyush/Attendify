// ============================================================
// Attendify — Shared TypeScript Types
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export enum UserRole {
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  EXCUSED = 'EXCUSED',
}

export enum AttendanceMode {
  MANUAL = 'MANUAL',
  QR = 'QR',
  PIN = 'PIN',
}

export enum NotificationType {
  PENDING_ATTENDANCE = 'PENDING_ATTENDANCE',
  LOW_ATTENDANCE = 'LOW_ATTENDANCE',
  SCHEDULE_REMINDER = 'SCHEDULE_REMINDER',
  SYSTEM = 'SYSTEM',
}

export enum SyncStatus {
  SYNCED = 'SYNCED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

// ─── Core Entities ───────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
  institutionId: string | null;
  employeeId: string | null;
  department: string | null;
  qualification: string | null;
  phone: string | null;
  user: User;
  institution: Institution | null;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  section: string | null;
  academicYear: string;
  semester: string | null;
  teacherId: string;
  institutionId: string | null;
  totalStudents?: number;
  subjects?: Subject[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  classId: string;
  teacherId: string;
  schedule: SubjectSchedule[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SubjectSchedule {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  classId: string;
  enrollmentDate: string;
  isActive: boolean;
  attendancePercentage?: number;
  totalPresent?: number;
  totalAbsent?: number;
  totalLate?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AttendanceSession {
  id: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  mode: AttendanceMode;
  qrCode: string | null;
  pin: string | null;
  notes: string | null;
  isFinalized: boolean;
  records?: AttendanceRecord[];
  subject?: Subject;
  class?: Class;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  markedAt: string;
  notes: string | null;
  student?: Student;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Analytics Types ─────────────────────────────────────────

export interface AttendanceAnalytics {
  totalSessions: number;
  averageAttendance: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  trend: TrendDataPoint[];
  subjectWise: SubjectAnalytics[];
  topAbsentees: StudentAnalyticsSummary[];
  lowAttendanceStudents: StudentAnalyticsSummary[];
}

export interface TrendDataPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  totalSessions: number;
  averageAttendance: number;
}

export interface StudentAnalyticsSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  attendancePercentage: number;
  totalPresent: number;
  totalAbsent: number;
}

export interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  recentSessions: AttendanceSession[];
  monthlyTrend: TrendDataPoint[];
  subjectWiseAnalytics: SubjectAnalytics[];
  lowAttendanceStudents: StudentAnalyticsSummary[];
}

// ─── API Types ───────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, string[]>;
  statusCode: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Auth Types ──────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser extends User {
  teacher?: Teacher;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  institutionName?: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// ─── Form Types ──────────────────────────────────────────────

export interface CreateClassForm {
  name: string;
  section?: string;
  academicYear: string;
  semester?: string;
}

export interface CreateSubjectForm {
  name: string;
  code?: string;
  classId: string;
  schedule?: SubjectSchedule[];
}

export interface CreateStudentForm {
  name: string;
  rollNumber: string;
  email?: string;
  phone?: string;
  classId: string;
}

export interface MarkAttendanceForm {
  sessionId: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
}

export interface CreateSessionForm {
  subjectId: string;
  classId: string;
  date: string;
  startTime?: string;
  mode?: AttendanceMode;
  notes?: string;
}

// ─── Offline / Sync Types ────────────────────────────────────

export interface SyncQueueItem {
  id: string;
  type: 'MARK_ATTENDANCE' | 'UPDATE_ATTENDANCE' | 'CREATE_SESSION';
  payload: Record<string, unknown>;
  status: SyncStatus;
  createdAt: string;
  retryCount: number;
  error?: string;
}

export interface OfflineAttendanceSession extends AttendanceSession {
  syncStatus: SyncStatus;
}

// ─── Report Types ─────────────────────────────────────────────

export interface ReportFilter {
  classId?: string;
  subjectId?: string;
  studentId?: string;
  startDate: string;
  endDate: string;
}

export interface StudentReport {
  student: Student;
  class: Class;
  sessions: {
    session: AttendanceSession;
    record: AttendanceRecord;
  }[];
  summary: {
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    percentage: number;
  };
}
