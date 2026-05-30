import { prisma } from '@/config/database';
import { createError } from '@/middleware/errorHandler';
import { getPaginationParams, buildPagination } from '@/utils/response';

export const StudentService = {
  async createStudent(
    teacherId: string,
    data: {
      name: string;
      rollNumber: string;
      email?: string;
      phone?: string;
      classId: string;
    }
  ) {
    // Verify teacher owns this class
    const cls = await prisma.class.findFirst({
      where: { id: data.classId, teacherId, deletedAt: null },
    });

    if (!cls) throw createError('Class not found or unauthorized', 404);

    // Check for duplicate roll number in same class
    const existing = await prisma.student.findFirst({
      where: { rollNumber: data.rollNumber, classId: data.classId, deletedAt: null },
    });

    if (existing) throw createError('Roll number already exists in this class', 409);

    const student = await prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: {
          name: data.name,
          rollNumber: data.rollNumber,
          email: data.email || null,
          phone: data.phone || null,
          classId: data.classId,
        },
      });

      await tx.classEnrollment.create({
        data: { classId: data.classId, studentId: newStudent.id },
      });

      return newStudent;
    });

    return student;
  },

  async getStudents(
    teacherId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      classId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const { skip, take, page, limit } = getPaginationParams(query);

    // Get all class IDs belonging to this teacher
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId, deletedAt: null },
      select: { id: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    const where = {
      classId: query.classId
        ? (classIds.includes(query.classId) ? query.classId : '__none__')
        : { in: classIds },
      deletedAt: null,
      isActive: true,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { rollNumber: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const sortField = query.sortBy ?? 'rollNumber';
    const validSortFields = ['name', 'rollNumber', 'createdAt', 'enrollmentDate'];
    const orderBy = validSortFields.includes(sortField)
      ? { [sortField]: query.sortOrder ?? 'asc' }
      : { rollNumber: 'asc' as const };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          attendanceRecords: {
            select: { status: true },
          },
          enrollments: {
            include: { class: { select: { name: true, section: true } } },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    // Compute attendance percentage
    const studentsWithStats = students.map((s) => {
      const total = s.attendanceRecords.length;
      const present = s.attendanceRecords.filter(
        (r) => r.status === 'PRESENT' || r.status === 'LATE'
      ).length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      const { attendanceRecords: _, ...rest } = s;
      return { ...rest, attendancePercentage: percentage, totalSessions: total };
    });

    return {
      students: studentsWithStats,
      pagination: buildPagination(page, limit, total),
    };
  },

  async getStudentById(id: string, teacherId: string) {
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId, deletedAt: null },
      select: { id: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    const student = await prisma.student.findFirst({
      where: { id, classId: { in: classIds }, deletedAt: null },
      include: {
        enrollments: {
          include: { class: { include: { subjects: { where: { deletedAt: null } } } } },
        },
      },
    });

    if (!student) throw createError('Student not found', 404);
    return student;
  },

  async updateStudent(
    id: string,
    teacherId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      classId: string;
      isActive: boolean;
    }>
  ) {
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId, deletedAt: null },
      select: { id: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    const student = await prisma.student.findFirst({
      where: { id, classId: { in: classIds }, deletedAt: null },
    });

    if (!student) throw createError('Student not found', 404);

    return prisma.student.update({ where: { id }, data });
  },

  async deleteStudent(id: string, teacherId: string): Promise<void> {
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId, deletedAt: null },
      select: { id: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    const student = await prisma.student.findFirst({
      where: { id, classId: { in: classIds }, deletedAt: null },
    });

    if (!student) throw createError('Student not found', 404);

    await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async bulkImport(
    teacherId: string,
    classId: string,
    rows: { name: string; rollNumber: string; email?: string; phone?: string }[]
  ) {
    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId, deletedAt: null },
    });

    if (!cls) throw createError('Class not found or unauthorized', 404);

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as { row: number; message: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const existing = await prisma.student.findFirst({
          where: { rollNumber: row.rollNumber, classId, deletedAt: null },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          const student = await tx.student.create({
            data: {
              name: row.name,
              rollNumber: row.rollNumber,
              email: row.email || null,
              phone: row.phone || null,
              classId,
            },
          });
          await tx.classEnrollment.create({
            data: { classId, studentId: student.id },
          });
        });

        results.created++;
      } catch {
        results.errors.push({ row: i + 1, message: `Failed to import student` });
      }
    }

    return results;
  },

  async getStudentAttendanceHistory(
    id: string,
    teacherId: string,
    query: { page?: number; limit?: number; startDate?: string; endDate?: string }
  ) {
    const { skip, take, page, limit } = getPaginationParams(query);

    const teacherClasses = await prisma.class.findMany({
      where: { teacherId, deletedAt: null },
      select: { id: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    const student = await prisma.student.findFirst({
      where: { id, classId: { in: classIds }, deletedAt: null },
    });

    if (!student) throw createError('Student not found', 404);

    const dateFilter = query.startDate && query.endDate
      ? {
          session: {
            date: {
              gte: new Date(query.startDate),
              lte: new Date(query.endDate),
            },
          },
        }
      : {};

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { studentId: id, ...dateFilter },
        skip,
        take,
        include: {
          session: {
            include: {
              subject: { select: { name: true, code: true } },
              class: { select: { name: true, section: true } },
            },
          },
        },
        orderBy: { session: { date: 'desc' } },
      }),
      prisma.attendanceRecord.count({
        where: { studentId: id, ...dateFilter },
      }),
    ]);

    const stats = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { studentId: id },
      _count: { status: true },
    });

    const totalRecords = stats.reduce((sum, s) => sum + s._count.status, 0);
    const presentCount =
      stats.find((s) => s.status === 'PRESENT')?._count.status ?? 0;
    const absentCount =
      stats.find((s) => s.status === 'ABSENT')?._count.status ?? 0;
    const lateCount =
      stats.find((s) => s.status === 'LATE')?._count.status ?? 0;

    return {
      student,
      records,
      summary: {
        totalSessions: totalRecords,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        percentage:
          totalRecords > 0
            ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
            : 0,
      },
      pagination: buildPagination(page, limit, total),
    };
  },
};
