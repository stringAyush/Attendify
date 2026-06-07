import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { validateQuery } from '@/middleware/validate';
import { reportFilterSchema } from '@/validators/schemas';
import { ReportService } from '@/services/report.service';
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

// GET /api/reports/student/:id
router.get(
  '/student/:id',
  validateQuery(reportFilterSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const report = await ReportService.generateStudentReport(
      String(req.params.id),
      teacherId,
      {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      }
    );
    res.json(ApiSuccessResponse(report));
  })
);

// GET /api/reports/class/:id
router.get(
  '/class/:id',
  validateQuery(reportFilterSchema),
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const report = await ReportService.generateClassReport(
      String(req.params.id),
      teacherId,
      {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        subjectId: req.query.subjectId as string | undefined,
      }
    );
    res.json(ApiSuccessResponse(report));
  })
);

// POST /api/reports/export/csv
router.post(
  '/export/csv',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const { classId, startDate, endDate, subjectId } = req.body as {
      classId: string;
      startDate: string;
      endDate: string;
      subjectId?: string;
    };

    const report = await ReportService.generateClassReport(classId, teacherId, {
      startDate,
      endDate,
      subjectId,
    });

    await ReportService.exportToCsv(report.studentSummaries, res);
  })
);

// POST /api/reports/export/pdf
router.post(
  '/export/pdf',
  asyncHandler(async (req, res) => {
    const teacherId = await getTeacherId(req.user!.userId);
    const { classId, startDate, endDate, subjectId } = req.body as {
      classId: string;
      startDate: string;
      endDate: string;
      subjectId?: string;
    };

    const report = await ReportService.generateClassReport(classId, teacherId, {
      startDate,
      endDate,
      subjectId,
    });

    // Fetch teacher display name for the PDF header
    const userRecord = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { name: true },
    });

    await ReportService.exportToPdf(
      {
        className: report.class.name,
        classSection: report.class.section ?? undefined,
        teacherName: userRecord?.name ?? undefined,
        period: { startDate, endDate },
        studentSummaries: report.studentSummaries,
      },
      res
    );
  })
);

export { router as reportRouter };
