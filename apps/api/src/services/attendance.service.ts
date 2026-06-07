import { prisma } from '@/config/database';
import { createError } from '@/middleware/errorHandler';
import { getPaginationParams, buildPagination } from '@/utils/response';
import { AttendanceStatus } from '@prisma/client';
import { generateQrCode, generatePin } from '@/utils/crypto';

export const AttendanceService = {
  async createSession(
    teacherId: string,
    data: {
      subjectId: string;
      classId: string;
      date: string;
      startTime?: string;
      mode?: 'MANUAL' | 'QR' | 'PIN';
      notes?: string;
    }
  ) {
    // Verify teacher owns the subject and class
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, teacherId, classId: data.classId, deletedAt: null },
    });

    if (!subject) throw createError('Subject not found or unauthorized', 404);

    const sessionDate = new Date(data.date);

    // Prevent duplicate session for same subject+date
    const existing = await prisma.attendanceSession.findFirst({
      where: { subjectId: data.subjectId, date: sessionDate },
    });

    if (existing) {
      throw createError('Attendance session already exists for this date', 409);
    }

    const qrCode = data.mode === 'QR' ? generateQrCode() : null;
    const pin = data.mode === 'PIN' ? generatePin(6) : null;

    // Fetch all enrolled students to pre-populate records as ABSENT
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId: data.classId },
      include: { student: { select: { id: true } } },
    });

    return prisma.$transaction(async (tx) => {
      const session = await tx.attendanceSession.create({
        data: {
          subjectId: data.subjectId,
          classId: data.classId,
          teacherId,
          date: sessionDate,
          startTime: data.startTime ?? null,
          mode: data.mode ?? 'MANUAL',
          qrCode,
          pin,
          notes: data.notes ?? null,
        },
        include: {
          subject: { select: { name: true, code: true } },
          class: { select: { name: true, section: true } },
        },
      });

      // Pre-create absent records for all enrolled students
      if (enrollments.length > 0) {
        await tx.attendanceRecord.createMany({
          data: enrollments.map((e) => ({
            sessionId: session.id,
            studentId: e.student.id,
            status: 'ABSENT' as AttendanceStatus,
          })),
        });
      }

      return session;
    });
  },

  async getSessions(
    teacherId: string,
    query: {
      page?: number;
      limit?: number;
      classId?: string;
      subjectId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const { skip, take, page, limit } = getPaginationParams(query);

    const dateFilter = query.startDate && query.endDate
      ? {
          date: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        }
      : {};

    const where = {
      teacherId,
      ...(query.classId && { classId: query.classId }),
      ...(query.subjectId && { subjectId: query.subjectId }),
      ...dateFilter,
    };

    const [sessions, total] = await Promise.all([
      prisma.attendanceSession.findMany({
        where,
        skip,
        take,
        include: {
          subject: { select: { name: true, code: true } },
          class: { select: { name: true, section: true } },
          _count: { select: { records: true } },
          records: {
            select: { status: true },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.attendanceSession.count({ where }),
    ]);

    const sessionsWithStats = sessions.map((s) => {
      const total = s.records.length;
      const present = s.records.filter((r) => r.status === 'PRESENT').length;
      const absent = s.records.filter((r) => r.status === 'ABSENT').length;
      const late = s.records.filter((r) => r.status === 'LATE').length;

      const { records: _, ...rest } = s;
      return { ...rest, stats: { total, present, absent, late } };
    });

    return {
      sessions: sessionsWithStats,
      pagination: buildPagination(page, limit, total),
    };
  },

  async getSessionById(id: string, teacherId: string) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id, teacherId },
      include: {
        subject: true,
        class: true,
        records: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNumber: true,
                avatar: true,
              },
            },
          },
          orderBy: { student: { rollNumber: 'asc' } },
        },
      },
    });

    if (!session) throw createError('Session not found', 404);
    return session;
  },

  async markAttendance(
    teacherId: string,
    data: {
      sessionId: string;
      records: {
        studentId: string;
        status: AttendanceStatus;
        notes?: string;
      }[];
    }
  ) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: data.sessionId, teacherId },
    });

    if (!session) throw createError('Session not found', 404);
    if (session.isFinalized) throw createError('Session is already finalized', 400);

    // Upsert all records
    const updates = await prisma.$transaction(
      data.records.map((record) =>
        prisma.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: data.sessionId,
              studentId: record.studentId,
            },
          },
          create: {
            sessionId: data.sessionId,
            studentId: record.studentId,
            status: record.status,
            notes: record.notes ?? null,
            markedAt: new Date(),
          },
          update: {
            status: record.status,
            notes: record.notes ?? null,
            markedAt: new Date(),
          },
        })
      )
    );

    return updates;
  },

  async finalizeSession(id: string, teacherId: string) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id, teacherId },
    });

    if (!session) throw createError('Session not found', 404);

    return prisma.attendanceSession.update({
      where: { id },
      data: {
        isFinalized: true,
        endTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
      },
    });
  },

  async updateAttendanceRecord(
    id: string,
    teacherId: string,
    data: { status: AttendanceStatus; notes?: string }
  ) {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!record) throw createError('Attendance record not found', 404);
    if (record.session.teacherId !== teacherId)
      throw createError('Unauthorized', 403);

    return prisma.attendanceRecord.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes ?? null,
        markedAt: new Date(),
      },
    });
  },

  async getAttendanceAnalytics(
    teacherId: string,
    query: {
      classId?: string;
      subjectId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const dateFilter =
      query.startDate && query.endDate
        ? {
            date: {
              gte: new Date(query.startDate),
              lte: new Date(query.endDate),
            },
          }
        : {};

    const sessionWhere = {
      teacherId,
      ...(query.classId && { classId: query.classId }),
      ...(query.subjectId && { subjectId: query.subjectId }),
      ...dateFilter,
    };

    const sessions = await prisma.attendanceSession.findMany({
      where: sessionWhere,
      include: {
        records: { select: { status: true, studentId: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Build trend data
    const trend = sessions.map((s) => {
      const total = s.records.length;
      const present = s.records.filter((r) => r.status === 'PRESENT').length;
      const absent = s.records.filter((r) => r.status === 'ABSENT').length;
      const late = s.records.filter((r) => r.status === 'LATE').length;

      return {
        date: s.date.toISOString().split('T')[0],
        present,
        absent,
        late,
        percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    });

    // Subject-wise analytics
    const subjectMap = new Map<
      string,
      { name: string; sessions: number; totalRecords: number; presentRecords: number }
    >();

    sessions.forEach((s) => {
      const existing = subjectMap.get(s.subject.id) ?? {
        name: s.subject.name,
        sessions: 0,
        totalRecords: 0,
        presentRecords: 0,
      };

      existing.sessions++;
      existing.totalRecords += s.records.length;
      existing.presentRecords += s.records.filter(
        (r) => r.status === 'PRESENT' || r.status === 'LATE'
      ).length;

      subjectMap.set(s.subject.id, existing);
    });

    const subjectWise = Array.from(subjectMap.entries()).map(([subjectId, data]) => ({
      subjectId,
      subjectName: data.name,
      totalSessions: data.sessions,
      averageAttendance:
        data.totalRecords > 0
          ? Math.round((data.presentRecords / data.totalRecords) * 100)
          : 0,
    }));

    // Overall stats
    const allRecords = sessions.flatMap((s) => s.records);
    const totalPresent = allRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const totalAbsent = allRecords.filter((r) => r.status === 'ABSENT').length;

    return {
      totalSessions: sessions.length,
      averageAttendance:
        allRecords.length > 0
          ? Math.round((totalPresent / allRecords.length) * 100)
          : 0,
      presentCount: totalPresent,
      absentCount: totalAbsent,
      trend,
      subjectWise,
    };
  },

  async getDashboardStats(teacherId: string) {
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId, deletedAt: null },
      select: { id: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    const [
      totalClasses,
      totalStudents,
      totalSessions,
      recentSessions,
    ] = await Promise.all([
      prisma.class.count({ where: { teacherId, deletedAt: null } }),
      prisma.student.count({
        where: {
          classId: { in: classIds },
          deletedAt: null,
          isActive: true,
        },
      }),
      prisma.attendanceSession.count({ where: { teacherId } }),
      prisma.attendanceSession.findMany({
        where: { teacherId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true, section: true } },
          _count: { select: { records: true } },
          records: { select: { status: true } },
        },
      }),
    ]);

    // Monthly trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = await prisma.attendanceSession.findMany({
      where: { teacherId, date: { gte: thirtyDaysAgo } },
      include: { records: { select: { status: true } } },
      orderBy: { date: 'asc' },
    });

    const monthlyTrend = recentRecords.map((s) => {
      const total = s.records.length;
      const present = s.records.filter((r) => r.status === 'PRESENT').length;
      const absent = s.records.filter((r) => r.status === 'ABSENT').length;
      const late = s.records.filter((r) => r.status === 'LATE').length;

      return {
        date: s.date.toISOString().split('T')[0],
        present,
        absent,
        late,
        percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    });

    // Average attendance
    const allRecentRecords = recentRecords.flatMap((s) => s.records);
    const presentCount = allRecentRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const averageAttendance =
      allRecentRecords.length > 0
        ? Math.round((presentCount / allRecentRecords.length) * 100)
        : 0;

    const mappedRecentSessions = recentSessions.map((s) => {
      const total = s.records.length;
      const present = s.records.filter((r) => r.status === 'PRESENT').length;
      const absent = s.records.filter((r) => r.status === 'ABSENT').length;
      const late = s.records.filter((r) => r.status === 'LATE').length;
      const { records: _, ...rest } = s;
      return { ...rest, stats: { total, present, absent, late } };
    });

    // At-risk students (attendance percentage < 75%, excluding zero-session students)
    const activeStudents = await prisma.student.findMany({
      where: {
        classId: { in: classIds },
        deletedAt: null,
        isActive: true,
      },
      include: {
        attendanceRecords: {
          select: { status: true },
        },
        enrollments: {
          include: {
            class: {
              select: { name: true, section: true },
            },
          },
        },
      },
    });

    const atRiskStudents = activeStudents
      .map((student) => {
        const total = student.attendanceRecords.length;
        const present = student.attendanceRecords.filter(
          (r) => r.status === 'PRESENT' || r.status === 'LATE'
        ).length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        const activeEnrollment = student.enrollments.find((e) => e.classId === student.classId);
        const cls = activeEnrollment?.class;
        const className = cls ? (cls.name + (cls.section ? ` (${cls.section})` : '')) : 'Unknown Class';

        return {
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          attendanceRate: percentage,
          totalSessions: total,
          className,
        };
      })
      .filter((s) => s.totalSessions > 0 && s.attendanceRate < 75)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 5);

    return {
      totalClasses,
      totalStudents,
      totalSessions,
      averageAttendance,
      recentSessions: mappedRecentSessions,
      monthlyTrend,
      atRiskStudents,
    };
  },
};
