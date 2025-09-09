import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.resolve(__dirname, '../public/Curriculum-Guideline-BBA-63x-65x-V1.6 (6) (1).csv');
  const csvRaw = fs.readFileSync(filePath, 'utf-8');
  const records = parse(csvRaw, { skip_empty_lines: true });

  // Find the header row
  const headerIdx = records.findIndex((row: any) => row[0] === 'Course Code');
  if (headerIdx === -1) throw new Error('Header row not found');

  // Extract course rows (skip header and any empty/summary rows)
  const courseRows = records.slice(headerIdx + 1).filter((row: any) => row[0] && row[1] && row[2]);

  // Upsert faculty, department, curriculum
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
  // You may need to update this compound unique constraint to match your schema
  const curriculum = await prisma.curriculum.upsert({
    where: {
      year_startId_endId_departmentId: {
        year: '2021',
        startId: '63x',
        endId: '65x',
        departmentId: department.id,
      },
    },
    update: {},
    create: {
      name: 'BBA 63x-65x',
      year: '2021',
      version: '1.0',
      description: 'BBA DIY (142 Credits)',
      startId: '63x',
      endId: '65x',
      departmentId: department.id,
      facultyId: faculty.id,
      isActive: true,
      createdById: 'SUPERADMIN_ID', // <-- Replace with actual superadmin id
    },
  });

  for (const row of courseRows) {
    const [code, title, credits, , , type] = row;
    if (!code || !title || !credits) continue;
    const course = await prisma.course.upsert({
      where: { code },
      update: { name: title, credits: Number(credits), isActive: true, creditHours: `${credits}-0-${Number(credits)*2}` },
      create: { code, name: title, credits: Number(credits), isActive: true, creditHours: `${credits}-0-${Number(credits)*2}` },
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

  console.log('✅ BBA 63x-65x seeding completed');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
