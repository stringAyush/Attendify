import { prisma } from '@/config/database';
import { createError } from '@/middleware/errorHandler';
import { getPaginationParams, buildPagination } from '@/utils/response';

export const ClassService = {
  async createClass(
    teacherId: string,
    data: {
      name: string;
      section?: string;
      academicYear: string;
      semester?: string;
    }
  ) {
    return prisma.class.create({
      data: {
        ...data,
        teacherId,
      },
      include: {
        subjects: { where: { deletedAt: null } },
        _count: { select: { enrollments: true } },
      },
    });
  },

  async getClasses(
    teacherId: string,
    query: { page?: number; limit?: number; search?: string }
  ) {
    const { skip, take, page, limit } = getPaginationParams(query);

    const where = {
      teacherId,
      deletedAt: null,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { section: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take,
        include: {
          subjects: { where: { deletedAt: null }, select: { id: true, name: true } },
          _count: { select: { enrollments: true, sessions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.class.count({ where }),
    ]);

    return { classes, pagination: buildPagination(page, limit, total) };
  },

  async getClassById(id: string, teacherId: string) {
    const cls = await prisma.class.findFirst({
      where: { id, teacherId, deletedAt: null },
      include: {
        subjects: {
          where: { deletedAt: null },
          include: { _count: { select: { sessions: true } } },
        },
        enrollments: {
          include: {
            student: { select: { id: true, name: true, rollNumber: true, avatar: true } },
          },
        },
        _count: { select: { enrollments: true, sessions: true } },
      },
    });

    if (!cls) throw createError('Class not found', 404);
    return cls;
  },

  async updateClass(
    id: string,
    teacherId: string,
    data: Partial<{
      name: string;
      section: string;
      academicYear: string;
      semester: string;
    }>
  ) {
    const cls = await prisma.class.findFirst({
      where: { id, teacherId, deletedAt: null },
    });

    if (!cls) throw createError('Class not found', 404);

    return prisma.class.update({
      where: { id },
      data,
      include: { subjects: { where: { deletedAt: null } } },
    });
  },

  async deleteClass(id: string, teacherId: string): Promise<void> {
    const cls = await prisma.class.findFirst({
      where: { id, teacherId, deletedAt: null },
    });

    if (!cls) throw createError('Class not found', 404);

    await prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async createSubject(
    teacherId: string,
    data: {
      name: string;
      code?: string;
      classId: string;
      schedule?: object[];
    }
  ) {
    const cls = await prisma.class.findFirst({
      where: { id: data.classId, teacherId, deletedAt: null },
    });

    if (!cls) throw createError('Class not found', 404);

    return prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
        classId: data.classId,
        teacherId,
        schedule: data.schedule ?? [],
      },
    });
  },

  async getSubjectsByClass(classId: string, teacherId: string) {
    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId, deletedAt: null },
    });

    if (!cls) throw createError('Class not found', 404);

    return prisma.subject.findMany({
      where: { classId, deletedAt: null },
      include: {
        _count: { select: { sessions: true } },
      },
      orderBy: { name: 'asc' },
    });
  },

  async updateSubject(
    id: string,
    teacherId: string,
    data: Partial<{
      name: string;
      code: string;
      schedule: object[];
    }>
  ) {
    const subject = await prisma.subject.findFirst({
      where: { id, teacherId, deletedAt: null },
    });

    if (!subject) throw createError('Subject not found', 404);

    return prisma.subject.update({ where: { id }, data });
  },

  async deleteSubject(id: string, teacherId: string): Promise<void> {
    const subject = await prisma.subject.findFirst({
      where: { id, teacherId, deletedAt: null },
    });

    if (!subject) throw createError('Subject not found', 404);

    await prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
