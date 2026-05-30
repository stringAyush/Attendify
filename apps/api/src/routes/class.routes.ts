import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { validate, validateQuery } from '@/middleware/validate';
import {
  createClassSchema,
  updateClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
  paginationSchema,
} from '@/validators/schemas';
import { ClassService } from '@/services/class.service';
import { ApiSuccessResponse } from '@/utils/response';
import { prisma } from '@/config/database';

const router = Router();
router.use(authenticate);

async function getTeacherId(userId: string): Promise<string> {
  let teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    teacher = await prisma.teacher.create({ data: { userId } });
  }
  return teacher.id;
}

// ─── Subject routes MUST come before /:id to avoid Express
// matching "subjects" as the :id parameter ────────────────────

// POST /api/classes/subjects/create
router.post(
  '/subjects/create',
  validate(createSubjectSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const subject = await ClassService.createSubject(teacherId, req.body);
    res.status(201).json(ApiSuccessResponse(subject, 'Subject created'));
  })
);

// PUT /api/classes/subjects/:id
router.put(
  '/subjects/:id',
  validate(updateSubjectSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const subject = await ClassService.updateSubject(String(req.params.id), teacherId, req.body);
    res.json(ApiSuccessResponse(subject, 'Subject updated'));
  })
);

// DELETE /api/classes/subjects/:id
router.delete(
  '/subjects/:id',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    await ClassService.deleteSubject(String(req.params.id), teacherId);
    res.json(ApiSuccessResponse(null, 'Subject deleted'));
  })
);

// ─── Class routes ─────────────────────────────────────────────

// GET /api/classes
router.get(
  '/',
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const result = await ClassService.getClasses(teacherId, req.query as {
      page?: number;
      limit?: number;
      search?: string;
    });
    res.json(ApiSuccessResponse(result.classes, undefined, result.pagination));
  })
);

// POST /api/classes
router.post(
  '/',
  validate(createClassSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const cls = await ClassService.createClass(teacherId, req.body);
    res.status(201).json(ApiSuccessResponse(cls, 'Class created successfully'));
  })
);

// GET /api/classes/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const cls = await ClassService.getClassById(String(req.params.id), teacherId);
    res.json(ApiSuccessResponse(cls));
  })
);

// PUT /api/classes/:id
router.put(
  '/:id',
  validate(updateClassSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const cls = await ClassService.updateClass(String(req.params.id), teacherId, req.body);
    res.json(ApiSuccessResponse(cls, 'Class updated successfully'));
  })
);

// DELETE /api/classes/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    await ClassService.deleteClass(String(req.params.id), teacherId);
    res.json(ApiSuccessResponse(null, 'Class deleted successfully'));
  })
);

// GET /api/classes/:id/subjects
router.get(
  '/:id/subjects',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const subjects = await ClassService.getSubjectsByClass(String(req.params.id), teacherId);
    res.json(ApiSuccessResponse(subjects));
  })
);

export { router as classRouter };
