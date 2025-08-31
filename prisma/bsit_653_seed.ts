// Seed script for BSIT 2022 (653) curriculum from CSV
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  // Find superadmin user
  const superadmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!superadmin) throw new Error('No SUPER_ADMIN user found. Please seed a superadmin first.');

  // Upsert faculty, department
  const faculty = await prisma.faculty.upsert({
    where: { code: 'VMES' },
    update: {},
    create: { name: 'Vincent Mary School of Engineering, Science and Technology', code: 'VMES' },
  });
  const department = await prisma.department.upsert({
    where: { code_facultyId: { code: 'IT', facultyId: faculty.id } },
    update: {},
    create: { name: 'Information Technology', code: 'IT', facultyId: faculty.id },
  });

  // Upsert curriculum
  const curriculum = await prisma.curriculum.upsert({
    where: {
      year_startId_endId_departmentId: {
        year: '2022',
        startId: '653',
        endId: '653',
  departmentId: department.id,
      },
    },
    update: {},
    create: {
      name: 'BSIT 2022',
      year: '2022',
      version: '1.0',
      description: 'Bachelor of Science Program in Information Technology (BSIT)',
      startId: '653',
      endId: '653',
      departmentId: department.id,
      facultyId: faculty.id,
      isActive: true,
      createdById: superadmin.id,
    },
  });

  // Read and parse CSV
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const csvPath = path.join(__dirname, '../public/BSIT_2022(653).csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, { skip_empty_lines: true });

  // Find the header row
  let headerIdx = records.findIndex((row: string[]) => row[1] === 'COURSE NO.');
  if (headerIdx === -1) throw new Error('Header row not found in CSV.');
  let courseRows = records.slice(headerIdx + 1);

  // Flatten and filter course rows
  let courses = [];
  for (const row of courseRows) {
    if (row[1] && row[2] && row[3]) {
      // Remove extra spaces and handle course code
      const code = row[1].replace(/\s+/g, '').trim();
      const title = row[2].trim();
      const credits = Number(row[3]);
      if (!isNaN(credits)) {
        courses.push({ code, title, credits });
      }
    }
  }

  // Upsert courses
  for (const course of courses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: {},
      create: {
        code: course.code,
        name: course.title,
        credits: course.credits,
        creditHours: String(course.credits),
        // Optionally add description, isActive, etc.
      },
    });
  }

  console.log('✅ BSIT 2022 (653) seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
