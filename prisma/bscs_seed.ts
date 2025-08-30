import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type XlsxRow = {
  'Course Code': string;
  'Course Title': string;
  'Credits': number | string;
  'Course Description'?: string;
  'Crd Hour'?: string;
  [key: string]: any;
};

async function ensureFacultyAndDepartment() {
  const faculty = await prisma.faculty.upsert({
    where: { code: 'VMES' },
    update: {},
    create: {
      name: 'Vincent Mary School of Engineering, Science and Technology',
      code: 'VMES',
    },
  });

  const department = await prisma.department.upsert({
    where: {
      code_facultyId: {
        code: 'CS',
        facultyId: faculty.id,
      },
    },
    update: {},
    create: {
      name: 'Computer Science',
      code: 'CS',
      facultyId: faculty.id,
    },
  });

  return { faculty, department };
}

async function ensureSuperAdmin(facultyId: string, departmentId: string) {
  const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (existing) return existing;

  const password = await bcrypt.hash('superadmin123', 10);
  const data = {
    email: 'superadmin@edutrack.com',
    password,
    name: 'Super Administrator',
    role: 'SUPER_ADMIN',
    facultyId,
    departmentId,
  } as const;
  console.log('🔐 Creating SUPER_ADMIN with data:', data);
  return prisma.user.create({ data });
}

function parseXlsx(filePath: string) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`XLSX not found at ${abs}`);
  const wb = XLSX.readFile(abs);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<XlsxRow>(sheet, { defval: '' });

  return rows
    .map((r) => {
      const code = String(r['Course Code']).trim();
      const name = String(r['Course Title']).trim();
      const creditsRaw = r['Credits'];
      const credits = typeof creditsRaw === 'number' ? creditsRaw : parseInt(String(creditsRaw).trim() || '0', 10);
      const description = String(r['Course Description'] || '').trim() || null;
      let creditHours = String(r['Crd Hour'] || '').trim();
      if (!creditHours) {
        const c = Number.isFinite(credits) && credits > 0 ? credits : 3;
        creditHours = `${c}-0-${c * 2}`;
      }
      if (!code || !name || !Number.isFinite(credits)) return null;
      return { code, name, credits, creditHours, description };
    })
    .filter(Boolean) as Array<{ code: string; name: string; credits: number; creditHours: string; description: string | null }>;
}

async function upsertCourses(courses: Array<{ code: string; name: string; credits: number; creditHours: string; description: string | null }>) {
  const created: Array<{ id: string; code: string }> = [];
  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        credits: c.credits,
        creditHours: c.creditHours,
        description: c.description,
        isActive: true,
      },
      create: {
        code: c.code,
        name: c.name,
        credits: c.credits,
        creditHours: c.creditHours,
        description: c.description,
        isActive: true,
      },
    });
    created.push({ id: course.id, code: course.code });
  }
  return created;
}

async function getOrCreateCurriculum(facultyId: string, departmentId: string, adminId: string) {
  const year = '2022';
  const startId = '653';
  const endId = '66x';

  const existing = await prisma.curriculum.findFirst({
    where: { year, startId, endId, departmentId },
  });
  if (existing) return existing;

  return prisma.curriculum.create({
    data: {
      name: 'BSCS2022',
      year,
      version: '1.0',
      description: 'Bachelor of Science in Computer Science (2022 curriculum)',
      startId,
      endId,
      departmentId,
      facultyId,
      createdById: adminId,
      isActive: true,
    },
  });
}

async function main() {
  console.log('🚀 Starting BSCS XLSX seed');

  const { faculty, department } = await ensureFacultyAndDepartment();
  const admin = await ensureSuperAdmin(faculty.id, department.id);

  // Read from the XLSX file (even though extension is .csv)
  const rows = parseXlsx('public/bscs2022.csv');
  console.log(`📄 Parsed ${rows.length} rows`);

  const upserted = await upsertCourses(rows);
  console.log(`📚 Upserted ${upserted.length} courses`);

  const curriculum = await getOrCreateCurriculum(faculty.id, department.id, admin.id);
  console.log(`🎓 Curriculum ready: ${curriculum.name} ${curriculum.year}`);

  let position = 1;
  for (const c of upserted) {
    await prisma.curriculumCourse.upsert({
      where: {
        curriculumId_courseId: { curriculumId: curriculum.id, courseId: c.id },
      },
      update: {},
      create: {
        curriculumId: curriculum.id,
        courseId: c.id,
        isRequired: true,
        position: position++,
      },
    });
  }
  console.log(`🔗 Assigned ${position - 1} courses to curriculum`);

  console.log('✅ BSCS seeding completed');
}

main()
  .catch((e) => {
    console.error('❌ Error during BSCS seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
});