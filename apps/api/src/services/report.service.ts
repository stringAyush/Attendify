import { prisma } from '@/config/database';
import { createError } from '@/middleware/errorHandler';
import PDFDocument from 'pdfkit';
import { format } from 'fast-csv';
import { Response } from 'express';

export const ReportService = {
  async generateStudentReport(
    studentId: string,
    teacherId: string,
    filter: { startDate: string; endDate: string }
  ) {
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId, deletedAt: null },
      select: { id: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    const student = await prisma.student.findFirst({
      where: { id: studentId, classId: { in: classIds }, deletedAt: null },
      include: { enrollments: { include: { class: true } } },
    });

    if (!student) throw createError('Student not found', 404);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId,
        session: {
          date: {
            gte: new Date(filter.startDate),
            lte: new Date(filter.endDate),
          },
        },
      },
      include: {
        session: {
          include: {
            subject: { select: { name: true, code: true } },
            class: { select: { name: true, section: true } },
          },
        },
      },
      orderBy: { session: { date: 'desc' } },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const halfDay = records.filter((r) => r.status === 'HALF_DAY').length;

    return {
      student,
      records,
      summary: {
        totalSessions: total,
        present,
        absent,
        late,
        halfDay,
        percentage:
          total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      },
      period: { startDate: filter.startDate, endDate: filter.endDate },
    };
  },

  async generateClassReport(
    classId: string,
    teacherId: string,
    filter: { startDate: string; endDate: string; subjectId?: string }
  ) {
    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId, deletedAt: null },
      include: { subjects: { where: { deletedAt: null } } },
    });

    if (!cls) throw createError('Class not found', 404);

    const students = await prisma.student.findMany({
      where: { classId, deletedAt: null, isActive: true },
      orderBy: { rollNumber: 'asc' },
    });

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId,
        teacherId,
        date: {
          gte: new Date(filter.startDate),
          lte: new Date(filter.endDate),
        },
        ...(filter.subjectId && { subjectId: filter.subjectId }),
      },
      include: {
        records: {
          select: { studentId: true, status: true },
        },
        subject: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const studentSummaries = students.map((student) => {
      const studentRecords = sessions.flatMap((s) =>
        s.records.filter((r) => r.studentId === student.id)
      );

      const total = studentRecords.length;
      const present = studentRecords.filter((r) => r.status === 'PRESENT').length;
      const absent = studentRecords.filter((r) => r.status === 'ABSENT').length;
      const late = studentRecords.filter((r) => r.status === 'LATE').length;

      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        totalSessions: total,
        present,
        absent,
        late,
        attendancePercentage:
          total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    });

    return {
      class: cls,
      sessions,
      studentSummaries,
      period: { startDate: filter.startDate, endDate: filter.endDate },
    };
  },

  async exportToCsv(
    data: {
      rollNumber: string;
      studentName: string;
      totalSessions: number;
      present: number;
      absent: number;
      late: number;
      attendancePercentage: number;
    }[],
    res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance_report_${Date.now()}.csv"`
    );

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    for (const row of data) {
      csvStream.write({
        'Roll No.': row.rollNumber,
        'Student Name': row.studentName,
        'Total Sessions': row.totalSessions,
        Present: row.present,
        Absent: row.absent,
        Late: row.late,
        'Attendance %': `${row.attendancePercentage}%`,
      });
    }

    csvStream.end();
  },

  async exportToPdf(
    reportData: {
      className: string;
      period: { startDate: string; endDate: string };
      studentSummaries: {
        rollNumber: string;
        studentName: string;
        totalSessions: number;
        present: number;
        absent: number;
        attendancePercentage: number;
      }[];
    },
    res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance_report_${Date.now()}.pdf"`
    );

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Header
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#6366f1')
      .text('Attendify', { align: 'center' });

    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#64748b')
      .text('Attendance Report', { align: 'center' });

    doc.moveDown();

    // Report info
    doc
      .fontSize(12)
      .fillColor('#1e293b')
      .text(`Class: ${reportData.className}`, 50, doc.y)
      .text(
        `Period: ${reportData.period.startDate} to ${reportData.period.endDate}`
      );

    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    const colWidths = [70, 180, 70, 60, 60, 80];
    const headers = ['Roll No.', 'Student Name', 'Sessions', 'Present', 'Absent', 'Attendance'];

    doc.rect(50, tableTop - 5, 500, 25).fill('#6366f1');
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');

    let xPos = 55;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop, { width: colWidths[i] });
      xPos += colWidths[i];
    });

    doc.moveDown(0.5);

    // Table rows
    reportData.studentSummaries.forEach((student, index) => {
      const rowY = doc.y;
      const isEven = index % 2 === 0;

      if (isEven) {
        doc.rect(50, rowY - 3, 500, 20).fill('#f8fafc');
      }

      const color =
        student.attendancePercentage >= 75 ? '#16a34a' : '#ef4444';

      doc.fillColor('#1e293b').font('Helvetica').fontSize(9);

      let x = 55;
      const values = [
        student.rollNumber,
        student.studentName,
        String(student.totalSessions),
        String(student.present),
        String(student.absent),
        `${student.attendancePercentage}%`,
      ];

      values.forEach((val, i) => {
        if (i === values.length - 1) {
          doc.fillColor(color).font('Helvetica-Bold');
        }
        doc.text(val, x, rowY, { width: colWidths[i] });
        x += colWidths[i];
      });

      doc.fillColor('#1e293b').font('Helvetica');
      doc.moveDown(0.3);
    });

    doc.end();
  },
};
