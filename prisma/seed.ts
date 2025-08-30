// prisma/seed.ts
/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // --- Default Faculty ---
  const defaultFaculty = await prisma.faculty.upsert({
    where: { code: 'DEFAULT' }, // Faculty.code must be @unique
    update: {},
    create: { name: 'Default Faculty', code: 'DEFAULT' },
  });
  console.log('✅ Created default faculty:', defaultFaculty.name);

  // --- Default Department (under Default Faculty) ---
  // Requires @@unique([code, facultyId], name: "code_facultyId") on Department
  const defaultDepartment = await prisma.department.upsert({
    where: { code_facultyId: { code: 'DEFAULT_DEPT', facultyId: defaultFaculty.id } },
    update: {},
    create: { name: 'Default Department', code: 'DEFAULT_DEPT', facultyId: defaultFaculty.id },
  });
  console.log('✅ Created default department:', defaultDepartment.name);

  // --- Super Admin (PLAINTEXT password) ---
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@edutrack.com' }, // User.email must be @unique
    update: {
      password: 'superadmin123', // overwrite any old hashed value
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      facultyId: defaultFaculty.id,
      departmentId: defaultDepartment.id,
    },
    create: {
      email: 'superadmin@edutrack.com',
      password: 'superadmin123', // ⚠ plaintext for testing
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      facultyId: defaultFaculty.id,
      departmentId: defaultDepartment.id,
    },
  });
  console.log('✅ Created super admin user:', superAdmin.name);

  // --- Sample Faculties ---
  const faculties = [
    { name: 'Vincent Mary School of Science and Engineering', code: 'VMES' },
    { name: 'Martin de Tours School of Management and Economics', code: 'MSME' },
    // add more if needed, e.g. { name: 'Faculty of Arts and Sciences', code: 'ARTS' },
  ];

  for (const facultyData of faculties) {
    const faculty = await prisma.faculty.upsert({
      where: { code: facultyData.code },
      update: {},
      create: facultyData,
    });
    console.log('✅ Created faculty:', faculty.name);
  }

  // --- Sample Departments ---
  const departments = [
    { name: 'Computer Science', code: 'CS', facultyCode: 'VMES' },
    { name: 'Business Administration', code: 'BBA', facultyCode: 'MSME' }, // <-- fixed from 'BBA' to 'BUS'
  ];

  for (const deptData of departments) {
    const faculty = await prisma.faculty.findUnique({ where: { code: deptData.facultyCode } });
    if (!faculty) {
      console.warn(`⚠️  Skipping department ${deptData.name}: faculty ${deptData.facultyCode} not found`);
      continue;
    }

    const department = await prisma.department.upsert({
      where: { code_facultyId: { code: deptData.code, facultyId: faculty.id } },
      update: {},
      create: { name: deptData.name, code: deptData.code, facultyId: faculty.id },
    });
    console.log('✅ Created department:', department.name);
  }

  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📋 Super Admin Credentials:');
  console.log('   Email: superadmin@edutrack.com');
  console.log('   Password: superadmin123');
  console.log('\n⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
