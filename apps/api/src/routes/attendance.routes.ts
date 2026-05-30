import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { validate, validateQuery } from '@/middleware/validate';
import {
  createSessionSchema,
  markAttendanceSchema,
  updateAttendanceRecordSchema,
  paginationSchema,
} from '@/validators/schemas';
import { AttendanceService } from '@/services/attendance.service';
import { ApiSuccessResponse } from '@/utils/response';
import { prisma } from '@/config/database';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

async function getTeacherId(userId: string): Promise<string> {
  let teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    teacher = await prisma.teacher.create({ data: { userId } });
  }
  return teacher.id;
}

// GET /api/attendance/dashboard
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const stats = await AttendanceService.getDashboardStats(teacherId);
    res.json(ApiSuccessResponse(stats));
  })
);

// GET /api/attendance/sessions
router.get(
  '/sessions',
  validateQuery(
    paginationSchema.extend({
      classId: z.string().optional(),
      subjectId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const result = await AttendanceService.getSessions(teacherId, req.query as {
      page?: number;
      limit?: number;
      classId?: string;
      subjectId?: string;
      startDate?: string;
      endDate?: string;
    });
    res.json(ApiSuccessResponse(result.sessions, undefined, result.pagination));
  })
);

// POST /api/attendance/sessions
router.post(
  '/sessions',
  validate(createSessionSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const session = await AttendanceService.createSession(teacherId, req.body);
    res.status(201).json(ApiSuccessResponse(session, 'Attendance session created'));
  })
);

// GET /api/attendance/sessions/:id
router.get(
  '/sessions/:id',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const session = await AttendanceService.getSessionById(String(req.params.id), teacherId);
    res.json(ApiSuccessResponse(session));
  })
);

// PUT /api/attendance/sessions/:id/finalize
router.put(
  '/sessions/:id/finalize',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const session = await AttendanceService.finalizeSession(String(req.params.id), teacherId);
    res.json(ApiSuccessResponse(session, 'Session finalized'));
  })
);

// POST /api/attendance/mark
router.post(
  '/mark',
  validate(markAttendanceSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const records = await AttendanceService.markAttendance(teacherId, req.body);
    res.json(ApiSuccessResponse(records, 'Attendance marked successfully'));
  })
);

// PUT /api/attendance/records/:id
router.put(
  '/records/:id',
  validate(updateAttendanceRecordSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const record = await AttendanceService.updateAttendanceRecord(
      String(req.params.id),
      teacherId,
      req.body
    );
    res.json(ApiSuccessResponse(record, 'Record updated'));
  })
);

// GET /api/attendance/analytics
router.get(
  '/analytics',
  validateQuery(
    z.object({
      classId: z.string().optional(),
      subjectId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const analytics = await AttendanceService.getAttendanceAnalytics(teacherId, req.query as {
      classId?: string;
      subjectId?: string;
      startDate?: string;
      endDate?: string;
    });
    res.json(ApiSuccessResponse(analytics));
  })
);

export { router as attendanceRouter };
