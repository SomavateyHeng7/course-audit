
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const filePath = path.resolve(__dirname, '../public/BSCS_2022(651-652).csv');
  const csvRaw = fs.readFileSync(filePath, 'utf-8');
  const records = parse(csvRaw, { skip_empty_lines: false });

  // Find the header row for courses
  const headerIdx = records.findIndex((row: any) => String(row[1]).toUpperCase() === 'COURSE NO.');
  if (headerIdx === -1) throw new Error('Header row not found');

  // Extract course rows (skip header and any empty/summary rows)
  const courseRows: any[] = [];
  for (let i = headerIdx + 1; i < records.length; i++) {
    const row = records[i];
    // Stop if we hit a section header or empty row
    if (!row[1] || String(row[1]).toUpperCase().includes('FREE ELECTIVE')) break;
    // Only push rows with a course number and title
    if (row[1] && row[2] && row[3]) {
      courseRows.push(row);
    }
  }

  // Upsert faculty, department
  const faculty = await prisma.faculty.upsert({
    where: { code: 'VMES' },
    update: {},
    create: { name: 'Vincent Mary School of Engineering, Science and Technology', code: 'VMES' },
  });
  const department = await prisma.department.upsert({
    where: { code_facultyId: { code: 'CS', facultyId: faculty.id } },
    update: {},
    create: { name: 'Computer Science', code: 'CS', facultyId: faculty.id },
  });

  // Find superadmin user
  const superadmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!superadmin) throw new Error('No SUPER_ADMIN user found. Please seed a superadmin first.');

  // Upsert curriculum
  const curriculum = await prisma.curriculum.upsert({
    where: {
      year_startId_endId_departmentId: {
        year: '2021',
        startId: '651',
        endId: '652',
        departmentId: department.id,
      },
    },
    update: {},
    create: {
      name: 'BSCS 2021',
      year: '2021',
      version: '1.0',
      description: 'Bachelor of Science Program in Computer Science (BSCS)',
      startId: '651',
      endId: '652',
      departmentId: department.id,
      facultyId: faculty.id,
      isActive: true,
      createdById: superadmin.id,
    },
  });

  for (const row of courseRows) {
    const code = String(row[1]).trim();
    const title = String(row[2]).trim();
    const credits = Number(row[3]);
    if (!code || !title || !credits) continue;
    const course = await prisma.course.upsert({
      where: { code },
      update: { name: title, credits, isActive: true, creditHours: `${credits}-0-${credits*2}` },
      create: { code, name: title, credits, isActive: true, creditHours: `${credits}-0-${credits*2}` },
    });
    await prisma.curriculumCourse.upsert({
      where: { curriculumId_courseId: { curriculumId: curriculum.id, courseId: course.id } },
      update: {},
      create: {
        curriculumId: curriculum.id,
        courseId: course.id,
        isRequired: true,
        position: 0,
      },
    });
  }

  console.log('✅ BSCS 2021 (651-652) seeding completed');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
