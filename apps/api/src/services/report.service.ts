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
      classSection?: string;
      teacherName?: string;
      period: { startDate: string; endDate: string };
      studentSummaries: {
        rollNumber: string;
        studentName: string;
        totalSessions: number;
        present: number;
        absent: number;
        late?: number;
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

    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    doc.pipe(res);

    const PAGE_WIDTH = 595.28;
    const CONTENT_WIDTH = PAGE_WIDTH - 96;
    const LEFT = 48;

    // ── Color palette ──────────────────────────────────────────────
    const COLORS = {
      primary:    '#4f46e5', // indigo-600
      heading:    '#0f172a', // slate-900
      subheading: '#334155', // slate-700
      body:       '#475569', // slate-600
      muted:      '#94a3b8', // slate-400
      border:     '#e2e8f0', // slate-200
      rowAlt:     '#f8fafc', // slate-50
      success:    '#16a34a', // green-600
      warning:    '#d97706', // amber-600
      danger:     '#dc2626', // red-600
      white:      '#ffffff',
    };

    // ── Header band ─────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_WIDTH, 80).fill(COLORS.primary);

    // App name
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('Attendify', LEFT, 22);

    // Tagline
    doc
      .fillColor('#c7d2fe') // indigo-200
      .font('Helvetica')
      .fontSize(8.5)
      .text('Attendance Management System', LEFT, 44);

    // Report title on right
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('ATTENDANCE REPORT', 0, 28, { align: 'right', width: PAGE_WIDTH - LEFT });

    doc.moveDown(0);

    // ── Info section ─────────────────────────────────────────────────
    const INFO_TOP = 100;
    const className = reportData.classSection
      ? `${reportData.className} — ${reportData.classSection}`
      : reportData.className;

    doc
      .fillColor(COLORS.heading)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(className, LEFT, INFO_TOP);

    if (reportData.teacherName) {
      doc
        .fillColor(COLORS.body)
        .font('Helvetica')
        .fontSize(9.5)
        .text(`Teacher: ${reportData.teacherName}`, LEFT, doc.y + 4);
    }

    const formattedStart = new Date(reportData.period.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedEnd   = new Date(reportData.period.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    doc
      .fillColor(COLORS.body)
      .font('Helvetica')
      .fontSize(9.5)
      .text(`Period: ${formattedStart} – ${formattedEnd}`, LEFT, doc.y + 2);

    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(8)
      .text(`Generated: ${new Date().toLocaleString('en-IN')}`, LEFT, doc.y + 2);

    // ── Summary stats box ─────────────────────────────────────────────
    const summaries = reportData.studentSummaries;
    const totalStudents = summaries.length;
    const avgAttendance = totalStudents > 0
      ? Math.round(summaries.reduce((s, st) => s + st.attendancePercentage, 0) / totalStudents)
      : 0;
    const atRisk = summaries.filter((s) => s.attendancePercentage < 75).length;
    const onTrack = summaries.filter((s) => s.attendancePercentage >= 75).length;

    const BOX_TOP = doc.y + 16;
    const BOX_H = 52;
    const statCols = [
      { label: 'Total Students', value: String(totalStudents) },
      { label: 'Avg. Attendance', value: `${avgAttendance}%` },
      { label: 'On Track (≥75%)', value: String(onTrack) },
      { label: 'At Risk (<75%)', value: String(atRisk) },
    ];
    const colW = CONTENT_WIDTH / statCols.length;

    // Box background
    doc.roundedRect(LEFT, BOX_TOP, CONTENT_WIDTH, BOX_H, 6).fill(COLORS.rowAlt);
    doc.roundedRect(LEFT, BOX_TOP, CONTENT_WIDTH, BOX_H, 6).strokeColor(COLORS.border).lineWidth(0.5).stroke();

    statCols.forEach((col, i) => {
      const xOff = LEFT + i * colW + 12;
      doc
        .fillColor(COLORS.primary)
        .font('Helvetica-Bold')
        .fontSize(16)
        .text(col.value, xOff, BOX_TOP + 10, { width: colW - 12 });
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica')
        .fontSize(7.5)
        .text(col.label.toUpperCase(), xOff, BOX_TOP + 32, { width: colW - 12 });
    });

    // ── Table ─────────────────────────────────────────────────────────
    const TABLE_TOP = BOX_TOP + BOX_H + 20;
    const COL_WIDTHS  = [52, 170, 58, 52, 52, 52, 68];
    const HEADERS     = ['Roll No.', 'Student Name', 'Sessions', 'Present', 'Absent', 'Late', 'Attendance'];
    const ROW_H = 20;

    // Table header background
    doc.rect(LEFT, TABLE_TOP, CONTENT_WIDTH, 22).fill(COLORS.heading);

    let xPos = LEFT + 6;
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(7.5);
    HEADERS.forEach((h, i) => {
      doc.text(h, xPos, TABLE_TOP + 7, { width: COL_WIDTHS[i] - 4 });
      xPos += COL_WIDTHS[i];
    });

    // Table rows
    let rowY = TABLE_TOP + 22;
    const sorted = [...summaries].sort((a, b) => b.attendancePercentage - a.attendancePercentage);

    sorted.forEach((student, idx) => {
      // Check page overflow
      if (rowY + ROW_H > 800) {
        doc.addPage();
        rowY = 48;
      }

      // Alternating row bg
      if (idx % 2 === 1) {
        doc.rect(LEFT, rowY, CONTENT_WIDTH, ROW_H).fill(COLORS.rowAlt);
      }

      const attColor =
        student.attendancePercentage >= 75 ? COLORS.success :
        student.attendancePercentage >= 50 ? COLORS.warning :
        COLORS.danger;

      const values = [
        student.rollNumber ?? '—',
        student.studentName,
        String(student.totalSessions),
        String(student.present),
        String(student.absent),
        String(student.late ?? 0),
        `${student.attendancePercentage}%`,
      ];

      let x = LEFT + 6;
      values.forEach((val, i) => {
        const isAtt = i === values.length - 1;
        doc
          .fillColor(isAtt ? attColor : i === 1 ? COLORS.heading : COLORS.body)
          .font(isAtt ? 'Helvetica-Bold' : i === 1 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8);
        doc.text(val, x, rowY + 6, { width: COL_WIDTHS[i] - 4 });
        x += COL_WIDTHS[i];
      });

      // Bottom border for each row
      doc.strokeColor(COLORS.border).lineWidth(0.3)
        .moveTo(LEFT, rowY + ROW_H)
        .lineTo(LEFT + CONTENT_WIDTH, rowY + ROW_H)
        .stroke();

      rowY += ROW_H;
    });

    // ── Footer ────────────────────────────────────────────────────────
    const FOOTER_Y = 810;
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .moveTo(LEFT, FOOTER_Y)
      .lineTo(LEFT + CONTENT_WIDTH, FOOTER_Y)
      .stroke();

    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(7.5)
      .text('Generated by Attendify — Confidential', LEFT, FOOTER_Y + 6, { width: CONTENT_WIDTH });

    doc
      .fillColor(COLORS.muted)
      .fontSize(7.5)
      .text(`Page 1`, 0, FOOTER_Y + 6, { align: 'right', width: PAGE_WIDTH - LEFT });

    doc.end();
  },
};
