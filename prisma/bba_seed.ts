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
  // Get actual superadmin user
  const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!superAdmin) throw new Error('No SUPER_ADMIN user found. Please seed a superadmin first.');

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
      createdById: superAdmin.id,
    },
  });

  let position = 0;
  for (const row of courseRows) {
    const [code, title, credits, , , type] = row;
    const parsedCredits = parseInt(credits, 10);
    if (!code || !title || isNaN(parsedCredits)) continue;
    const course = await prisma.course.upsert({
      where: { code },
      update: { name: title, credits: parsedCredits, isActive: true, creditHours: `${parsedCredits}-0-${parsedCredits*2}` },
      create: { code, name: title, credits: parsedCredits, isActive: true, creditHours: `${parsedCredits}-0-${parsedCredits*2}` },
    });
    await prisma.curriculumCourse.upsert({
      where: { curriculumId_courseId: { curriculumId: curriculum.id, courseId: course.id } },
      update: {},
      create: {
        curriculumId: curriculum.id,
        courseId: course.id,
        isRequired: true,
        position,
        // Optionally, you can map type to a category field if your schema supports it
      },
    });
    position++;
  }

  console.log('✅ BBA 63x-65x seeding completed');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
