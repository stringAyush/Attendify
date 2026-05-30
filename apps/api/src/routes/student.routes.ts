import { Router } from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { validate, validateQuery } from '@/middleware/validate';
import {
  createStudentSchema,
  updateStudentSchema,
  paginationSchema,
} from '@/validators/schemas';
import { StudentService } from '@/services/student.service';
import { ApiSuccessResponse } from '@/utils/response';
import { prisma } from '@/config/database';
import { z } from 'zod';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

async function getTeacherId(userId: string): Promise<string> {
  let teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    teacher = await prisma.teacher.create({ data: { userId } });
  }
  return teacher.id;
}

// GET /api/students
router.get(
  '/',
  validateQuery(
    paginationSchema.extend({
      classId: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const result = await StudentService.getStudents(teacherId, req.query as {
      page?: number;
      limit?: number;
      search?: string;
      classId?: string;
    });
    res.json(ApiSuccessResponse(result.students, undefined, result.pagination));
  })
);

// POST /api/students
router.post(
  '/',
  validate(createStudentSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const student = await StudentService.createStudent(teacherId, req.body);
    res.status(201).json(ApiSuccessResponse(student, 'Student created successfully'));
  })
);

// GET /api/students/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const student = await StudentService.getStudentById(String(req.params.id), teacherId);
    res.json(ApiSuccessResponse(student));
  })
);

// PUT /api/students/:id
router.put(
  '/:id',
  validate(updateStudentSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const student = await StudentService.updateStudent(String(req.params.id), teacherId, req.body);
    res.json(ApiSuccessResponse(student, 'Student updated successfully'));
  })
);

// DELETE /api/students/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    await StudentService.deleteStudent(String(req.params.id), teacherId);
    res.json(ApiSuccessResponse(null, 'Student deleted successfully'));
  })
);

// GET /api/students/:id/attendance
router.get(
  '/:id/attendance',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const result = await StudentService.getStudentAttendanceHistory(
      String(req.params.id),
      teacherId,
      {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      }
    );
    res.json(ApiSuccessResponse(result, undefined, result.pagination));
  })
);

// POST /api/students/bulk-import
router.post(
  '/bulk-import',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const { classId } = req.body as { classId: string };

    if (!req.file) {
      res.status(400).json({ success: false, error: 'CSV file is required' });
      return;
    }

    if (!classId) {
      res.status(400).json({ success: false, error: 'classId is required' });
      return;
    }

    const rows: { name: string; rollNumber: string; email?: string; phone?: string }[] = [];

    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(req.file!.buffer);
      stream
        .pipe(csvParser({ headers: true }))
        .on('data', (row: Record<string, string>) => {
          if (row.name && row.rollNumber) {
            rows.push({
              name: row.name,
              rollNumber: row.rollNumber,
              email: row.email || undefined,
              phone: row.phone || undefined,
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const result = await StudentService.bulkImport(teacherId, classId, rows);
    res.json(ApiSuccessResponse(result, `Imported ${result.created} students`));
  })
);

export { router as studentRouter };
