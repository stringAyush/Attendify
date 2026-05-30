import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  institutionName: z.string().min(2).max(200).optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100),
  section: z.string().max(20).optional(),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  semester: z.string().max(50).optional(),
});

export const updateClassSchema = createClassSchema.partial();

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  code: z.string().max(20).optional(),
  classId: z.string().min(1, 'Class ID is required'),
  schedule: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format'),
        endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format'),
      })
    )
    .optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createStudentSchema = z.object({
  name: z.string().min(2, 'Student name is required').max(100),
  rollNumber: z.string().min(1, 'Roll number is required').max(20),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  classId: z.string().min(1, 'Class ID is required'),
});

export const updateStudentSchema = createStudentSchema.partial();

export const createSessionSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format')
    .optional(),
  mode: z.enum(['MANUAL', 'QR', 'PIN']).default('MANUAL'),
  notes: z.string().max(500).optional(),
});

export const markAttendanceSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED']),
        notes: z.string().max(200).optional(),
      })
    )
    .min(1, 'At least one attendance record is required'),
});

export const updateAttendanceRecordSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED']),
  notes: z.string().max(200).optional(),
});

export const reportFilterSchema = z.object({
  classId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 20)),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
