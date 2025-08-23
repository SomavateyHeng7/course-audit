import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default faculty
  const defaultFaculty = await prisma.faculty.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      name: 'Default Faculty',
      code: 'DEFAULT',
    },
  });

  console.log('✅ Created default faculty:', defaultFaculty.name);

  // Create super admin user
  const hashedPassword = await bcrypt.hash('superadmin123', 10);
  
  // Get the first department from the default faculty for super admin
  const defaultDepartment = await prisma.department.findFirst({
    where: { facultyId: defaultFaculty.id },
  });

  if (!defaultDepartment) {
    throw new Error('No department found for default faculty. Departments must be created before users.');
  }
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@edutrack.com' },
    update: {},
    create: {
      email: 'superadmin@edutrack.com',
      password: hashedPassword,
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      facultyId: defaultFaculty.id,
      departmentId: defaultDepartment.id, // 🆕 Required departmentId
    },
  });

  console.log('✅ Created super admin user:', superAdmin.name);

  // Create some sample faculties
  const faculties = [
    { name: 'Faculty of Engineering', code: 'ENG' },
    { name: 'Faculty of Business', code: 'BUS' },
    { name: 'Faculty of Arts and Sciences', code: 'ARTS' },
    { name: 'Faculty of Medicine', code: 'MED' },
  ];

  for (const facultyData of faculties) {
    const faculty = await prisma.faculty.upsert({
      where: { code: facultyData.code },
      update: {},
      create: facultyData,
    });
    console.log('✅ Created faculty:', faculty.name);
  }

  // Create some sample departments
  const departments = [
    { name: 'Computer Science', code: 'CS', facultyCode: 'ENG' },
    { name: 'Electrical Engineering', code: 'EE', facultyCode: 'ENG' },
    { name: 'Marketing', code: 'MKT', facultyCode: 'BUS' },
    { name: 'Finance', code: 'FIN', facultyCode: 'BUS' },
    { name: 'Mathematics', code: 'MATH', facultyCode: 'ARTS' },
    { name: 'Physics', code: 'PHYS', facultyCode: 'ARTS' },
  ];

  for (const deptData of departments) {
    const faculty = await prisma.faculty.findUnique({
      where: { code: deptData.facultyCode },
    });

    if (faculty) {
      const department = await prisma.department.upsert({
        where: { 
          code_facultyId: {
            code: deptData.code,
            facultyId: faculty.id,
          }
        },
        update: {},
        create: {
          name: deptData.name,
          code: deptData.code,
          facultyId: faculty.id,
        },
      });
      console.log('✅ Created department:', department.name);
    }
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📋 Super Admin Credentials:');
  console.log('   Email: superadmin@edutrack.com');
  console.log('   Password: superadmin123');
  console.log('');
  console.log('⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 