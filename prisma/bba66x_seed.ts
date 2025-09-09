import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const filePath = path.resolve(__dirname, '../public/Curriculum-Guideline-BBA-66x-Only-V1.0.csv');
  const csvRaw = fs.readFileSync(filePath, 'utf-8');
  const records = parse(csvRaw, { skip_empty_lines: true });

  // Find the header row
  const headerIdx = records.findIndex((row: any) => row[0] === 'Course Code');
  if (headerIdx === -1) throw new Error('Header row not found');

  // Extract course rows (skip header and any empty/summary rows)
  const courseRows = records.slice(headerIdx + 1).filter((row: any) => row[0] && row[1] && row[2]);

  // Upsert faculty, department
  const faculty = await prisma.faculty.upsert({
    where: { code: 'MSME' },
    update: {},
    create: { name: 'Martin de Tours School of Management and Economics', code: 'MSME' },
  });
  const department = await prisma.department.upsert({
    where: { code_facultyId: { code: 'BBA', facultyId: faculty.id } },
    update: {},
    create: { name: 'Business Administration', code: 'BBA', facultyId: faculty.id },
  });
  // Find superadmin user
  const superadmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!superadmin) throw new Error('No SUPER_ADMIN user found. Please seed a superadmin first.');
  // Upsert curriculum with real superadmin id
  const curriculum = await prisma.curriculum.upsert({
    where: {
      year_startId_endId_departmentId: {
        year: '2024',
        startId: '66x',
        endId: '66x',
        departmentId: department.id,
      },
    },
    update: {
      name: 'BBA 66x Only',
      version: '1.0',
      description: 'BBA DIY (142 Credits)',
      facultyId: faculty.id,
      isActive: true,
      createdById: superadmin.id,
    },
    create: {
      name: 'BBA 66x Only',
      year: '2024',
      version: '1.0',
      description: 'BBA DIY (142 Credits)',
      startId: '66x',
      endId: '66x',
      departmentId: department.id,
      facultyId: faculty.id,
      isActive: true,
      createdById: superadmin.id,
    },
  });

  for (const row of courseRows) {
    const [code, title, credits, , , type] = row;
    // Skip header or invalid rows
    if (!code || !title || !credits || code === 'Course Code' || title === 'Course Title' || credits === 'Credits') continue;
    const creditsNum = Number(credits);
    if (isNaN(creditsNum)) continue;
    const course = await prisma.course.upsert({
      where: { code },
      update: { name: title, credits: creditsNum, isActive: true, creditHours: `${creditsNum}-0-${creditsNum*2}` },
      create: { code, name: title, credits: creditsNum, isActive: true, creditHours: `${creditsNum}-0-${creditsNum*2}` },
    });
    await prisma.curriculumCourse.upsert({
      where: { curriculumId_courseId: { curriculumId: curriculum.id, courseId: course.id } },
      update: {},
      create: {
        curriculumId: curriculum.id,
        courseId: course.id,
        isRequired: true,
        position: 0,
        // Optionally, you can map type to a category field if your schema supports it
      },
    });
  }

  console.log('✅ BBA 66x Only seeding completed');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
