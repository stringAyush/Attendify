import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@attendify.app' },
    update: {},
    create: {
      email: 'admin@attendify.app',
      name: 'Attendify Admin',
      password: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create demo institution
  const institution = await prisma.institution.upsert({
    where: { id: 'demo-institution-id' },
    update: {},
    create: {
      id: 'demo-institution-id',
      name: 'Demo School of Technology',
      email: 'admin@demoschool.edu',
      phone: '+91-9876543210',
      address: '123 Education Street, Knowledge City, 400001',
    },
  });
  console.log('✅ Institution created:', institution.name);

  // Create demo teacher
  const teacherPassword = await bcrypt.hash('Teacher@123', 12);
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@demoschool.edu' },
    update: {},
    create: {
      email: 'teacher@demoschool.edu',
      name: 'Prof. Sarah Johnson',
      password: teacherPassword,
      role: 'TEACHER',
      isEmailVerified: true,
      teacher: {
        create: {
          institutionId: institution.id,
          employeeId: 'EMP001',
          department: 'Computer Science',
          qualification: 'M.Tech Computer Science',
          phone: '+91-9876543211',
        },
      },
    },
    include: { teacher: true },
  });
  console.log('✅ Teacher created:', teacherUser.email);

  const teacher = teacherUser.teacher!;

  // Create demo class
  const demoClass = await prisma.class.upsert({
    where: { id: 'demo-class-id' },
    update: {},
    create: {
      id: 'demo-class-id',
      name: 'BCA',
      section: 'Section A',
      academicYear: '2025-2026',
      semester: 'Semester 3',
      teacherId: teacher.id,
      institutionId: institution.id,
    },
  });
  console.log('✅ Class created:', demoClass.name);

  // Create subjects
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { id: 'subj-dsa' },
      update: {},
      create: {
        id: 'subj-dsa',
        name: 'Data Structures & Algorithms',
        code: 'CS301',
        classId: demoClass.id,
        teacherId: teacher.id,
        schedule: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '10:00' },
        ],
      },
    }),
    prisma.subject.upsert({
      where: { id: 'subj-dbms' },
      update: {},
      create: {
        id: 'subj-dbms',
        name: 'Database Management Systems',
        code: 'CS302',
        classId: demoClass.id,
        teacherId: teacher.id,
        schedule: [
          { dayOfWeek: 2, startTime: '11:00', endTime: '12:00' },
          { dayOfWeek: 4, startTime: '11:00', endTime: '12:00' },
        ],
      },
    }),
    prisma.subject.upsert({
      where: { id: 'subj-web' },
      update: {},
      create: {
        id: 'subj-web',
        name: 'Web Development',
        code: 'CS303',
        classId: demoClass.id,
        teacherId: teacher.id,
      },
    }),
  ]);
  console.log(`✅ ${subjects.length} subjects created`);

  // Create demo students
  const studentData = [
    { name: 'Arjun Sharma', rollNumber: '101', email: 'arjun@student.edu' },
    { name: 'Priya Patel', rollNumber: '102', email: 'priya@student.edu' },
    { name: 'Rahul Verma', rollNumber: '103', email: 'rahul@student.edu' },
    { name: 'Sneha Gupta', rollNumber: '104', email: 'sneha@student.edu' },
    { name: 'Kiran Kumar', rollNumber: '105', email: 'kiran@student.edu' },
    { name: 'Divya Nair', rollNumber: '106', email: 'divya@student.edu' },
    { name: 'Amit Singh', rollNumber: '107', email: 'amit@student.edu' },
    { name: 'Pooja Reddy', rollNumber: '108', email: 'pooja@student.edu' },
    { name: 'Vikram Joshi', rollNumber: '109', email: 'vikram@student.edu' },
    { name: 'Ananya Krishnan', rollNumber: '110', email: 'ananya@student.edu' },
  ];

  const students = [];
  for (const data of studentData) {
    const existing = await prisma.student.findFirst({
      where: { rollNumber: data.rollNumber, classId: demoClass.id },
    });

    if (!existing) {
      const student = await prisma.student.create({
        data: {
          name: data.name,
          rollNumber: data.rollNumber,
          email: data.email,
          classId: demoClass.id,
        },
      });
      await prisma.classEnrollment.create({
        data: { classId: demoClass.id, studentId: student.id },
      });
      students.push(student);
    } else {
      students.push(existing);
    }
  }
  console.log(`✅ ${students.length} students created`);

  // Create attendance sessions for last 7 days
  const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'PRESENT', 'LATE', 'PRESENT', 'PRESENT', 'ABSENT', 'PRESENT'] as const;

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

    for (const subject of subjects.slice(0, 2)) {
      const existing = await prisma.attendanceSession.findFirst({
        where: { subjectId: subject.id, date: { equals: new Date(date.toISOString().split('T')[0]) } },
      });

      if (!existing) {
        const session = await prisma.attendanceSession.create({
          data: {
            subjectId: subject.id,
            classId: demoClass.id,
            teacherId: teacher.id,
            date: new Date(date.toISOString().split('T')[0]),
            mode: 'MANUAL',
            isFinalized: i > 0,
          },
        });

        await prisma.attendanceRecord.createMany({
          data: students.map((student, idx) => ({
            sessionId: session.id,
            studentId: student.id,
            status: statuses[idx % statuses.length],
          })),
        });
      }
    }
  }

  console.log('✅ Attendance sessions seeded');
  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Demo accounts:');
  console.log('  Teacher: teacher@demoschool.edu / Teacher@123');
  console.log('  Admin:   admin@attendify.app / Admin@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
