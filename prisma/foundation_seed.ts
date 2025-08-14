import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting foundation seed...');

  // Clear existing data in proper order
  console.log('🧹 Clearing existing data...');
  await prisma.user.deleteMany();
  // await prisma.courseType.deleteMany(); // Commented out for testing
  await prisma.department.deleteMany();
  await prisma.faculty.deleteMany();

  // Hash password for users (password: "password123")
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Faculties
  console.log('🏛️ Creating faculties...');
  const faculties = await Promise.all([
    prisma.faculty.create({
      data: {
        id: 'faculty_engineering_001',
        name: 'Faculty of Engineering',
        code: 'ENG',
        concentrationLabel: 'Specializations',
      }
    }),
    prisma.faculty.create({
      data: {
        id: 'faculty_science_001',
        name: 'Faculty of Science',
        code: 'SCI',
        concentrationLabel: 'Concentrations',
      }
    }),
    prisma.faculty.create({
      data: {
        id: 'faculty_management_001',
        name: 'Martin de Tours School of Management and Economics',
        code: 'MDE',
        concentrationLabel: 'Concentrations',
      }
    }),
    prisma.faculty.create({
      data: {
        id: 'faculty_arts_001',
        name: 'Faculty of Arts',
        code: 'ARTS',
        concentrationLabel: 'Concentrations',
      }
    }),
    prisma.faculty.create({
      data: {
        id: 'faculty_nursing_001',
        name: 'Faculty of Nursing Science',
        code: 'NURS',
        concentrationLabel: 'Specializations',
      }
    }),
    prisma.faculty.create({
      data: {
        id: 'faculty_law_001',
        name: 'Faculty of Law',
        code: 'LAW',
        concentrationLabel: 'Concentrations',
      }
    }),
  ]);

  console.log(`✅ Created ${faculties.length} faculties`);

  // Create Departments
  console.log('🏢 Creating departments...');
  const departments = await Promise.all([
    // Engineering Departments
    prisma.department.create({
      data: {
        id: 'dept_cs_001',
        name: 'Computer Science',
        code: 'CS',
        facultyId: 'faculty_engineering_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_it_001',
        name: 'Information Technology',
        code: 'IT',
        facultyId: 'faculty_engineering_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_ce_001',
        name: 'Computer Engineering',
        code: 'CE',
        facultyId: 'faculty_engineering_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_ie_001',
        name: 'Industrial Engineering',
        code: 'IE',
        facultyId: 'faculty_engineering_001',
      }
    }),

    // Science Departments
    prisma.department.create({
      data: {
        id: 'dept_math_001',
        name: 'Mathematics',
        code: 'MATH',
        facultyId: 'faculty_science_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_bio_001',
        name: 'Biology',
        code: 'BIO',
        facultyId: 'faculty_science_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_chem_001',
        name: 'Chemistry',
        code: 'CHEM',
        facultyId: 'faculty_science_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_phys_001',
        name: 'Physics',
        code: 'PHYS',
        facultyId: 'faculty_science_001',
      }
    }),

    // Management and Economics Departments
    prisma.department.create({
      data: {
        id: 'dept_bba_001',
        name: 'Business Administration',
        code: 'BBA',
        facultyId: 'faculty_management_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_acc_001',
        name: 'Accounting',
        code: 'ACC',
        facultyId: 'faculty_management_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_fin_001',
        name: 'Finance',
        code: 'FIN',
        facultyId: 'faculty_management_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_mkt_001',
        name: 'Marketing',
        code: 'MKT',
        facultyId: 'faculty_management_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_mgmt_001',
        name: 'Management',
        code: 'MGMT',
        facultyId: 'faculty_management_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_econ_001',
        name: 'Economics',
        code: 'ECON',
        facultyId: 'faculty_management_001',
      }
    }),

    // Arts Departments
    prisma.department.create({
      data: {
        id: 'dept_eng_001',
        name: 'English',
        code: 'ENG',
        facultyId: 'faculty_arts_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_comm_001',
        name: 'Communication Arts',
        code: 'COMM',
        facultyId: 'faculty_arts_001',
      }
    }),
    prisma.department.create({
      data: {
        id: 'dept_phil_001',
        name: 'Philosophy',
        code: 'PHIL',
        facultyId: 'faculty_arts_001',
      }
    }),

    // Nursing Department
    prisma.department.create({
      data: {
        id: 'dept_nursing_001',
        name: 'Nursing Science',
        code: 'NURS',
        facultyId: 'faculty_nursing_001',
      }
    }),

    // Law Department
    prisma.department.create({
      data: {
        id: 'dept_law_001',
        name: 'Law',
        code: 'LAW',
        facultyId: 'faculty_law_001',
      }
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  // Create Course Types - COMMENTED OUT FOR TESTING
  /*
  console.log('📚 Creating course types...');
  const courseTypes = await Promise.all([
    // Computer Science Course Types
    prisma.courseType.create({
      data: {
        id: 'ct_cs_core_001',
        name: 'CS Core',
        color: '#3B82F6',
        departmentId: 'dept_cs_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_cs_math_001',
        name: 'CS Mathematics',
        color: '#8B5CF6',
        departmentId: 'dept_cs_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_cs_elective_001',
        name: 'CS Elective',
        color: '#10B981',
        departmentId: 'dept_cs_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_cs_capstone_001',
        name: 'CS Capstone',
        color: '#F59E0B',
        departmentId: 'dept_cs_001',
      }
    }),

    // BBA Course Types (from CSV analysis)
    prisma.courseType.create({
      data: {
        id: 'ct_bba_core_001',
        name: 'Business Core',
        color: '#EF4444',
        departmentId: 'dept_bba_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_bba_gened_001',
        name: 'General Education',
        color: '#6B7280',
        departmentId: 'dept_bba_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_bba_english_001',
        name: 'English',
        color: '#EC4899',
        departmentId: 'dept_bba_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_bba_conc_001',
        name: 'Concentration',
        color: '#14B8A6',
        departmentId: 'dept_bba_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_bba_elective_001',
        name: 'Free Elective',
        color: '#84CC16',
        departmentId: 'dept_bba_001',
      }
    }),

    // Marketing Course Types
    prisma.courseType.create({
      data: {
        id: 'ct_mkt_core_001',
        name: 'Marketing Core',
        color: '#F97316',
        departmentId: 'dept_mkt_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_mkt_gened_001',
        name: 'General Education',
        color: '#6B7280',
        departmentId: 'dept_mkt_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_mkt_english_001',
        name: 'English',
        color: '#EC4899',
        departmentId: 'dept_mkt_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_mkt_elective_001',
        name: 'Marketing Elective',
        color: '#06B6D4',
        departmentId: 'dept_mkt_001',
      }
    }),

    // Generic Course Types for other departments
    prisma.courseType.create({
      data: {
        id: 'ct_core_gen_001',
        name: 'Core Courses',
        color: '#3B82F6',
        departmentId: 'dept_it_001',
      }
    }),
    prisma.courseType.create({
      data: {
        id: 'ct_elective_gen_001',
        name: 'Elective Courses',
        color: '#10B981',
        departmentId: 'dept_it_001',
      }
    }),
  ]);

  console.log(`✅ Created ${courseTypes.length} course types`);
  */

  // Create sample admin/faculty users
  console.log('👥 Creating users...');
  const users = await Promise.all([
    // System Admin
    prisma.user.create({
      data: {
        id: 'user_admin_001',
        email: 'admin@assumption.ac.th',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        facultyId: 'faculty_management_001',
      }
    }),

    // Faculty Chairpersons/Admins for each faculty
    prisma.user.create({
      data: {
        id: 'user_chair_eng_001',
        email: 'chair.engineering@assumption.ac.th',
        password: hashedPassword,
        name: 'Engineering Faculty Chair',
        role: 'CHAIRPERSON',
        facultyId: 'faculty_engineering_001',
      }
    }),
    prisma.user.create({
      data: {
        id: 'user_chair_sci_001',
        email: 'chair.science@assumption.ac.th',
        password: hashedPassword,
        name: 'Science Faculty Chair',
        role: 'CHAIRPERSON',
        facultyId: 'faculty_science_001',
      }
    }),
    prisma.user.create({
      data: {
        id: 'user_chair_mde_001',
        email: 'chair.management@assumption.ac.th',
        password: hashedPassword,
        name: 'Management Faculty Chair',
        role: 'CHAIRPERSON',
        facultyId: 'faculty_management_001',
      }
    }),

    // Department Faculty/Advisors
    prisma.user.create({
      data: {
        id: 'user_cs_faculty_001',
        email: 'cs.faculty@assumption.ac.th',
        password: hashedPassword,
        name: 'CS Department Faculty',
        role: 'ADVISOR',
        facultyId: 'faculty_engineering_001',
      }
    }),
    prisma.user.create({
      data: {
        id: 'user_bba_faculty_001',
        email: 'bba.faculty@assumption.ac.th',
        password: hashedPassword,
        name: 'BBA Department Faculty',
        role: 'ADVISOR',
        facultyId: 'faculty_management_001',
      }
    }),
    prisma.user.create({
      data: {
        id: 'user_mkt_faculty_001',
        email: 'mkt.faculty@assumption.ac.th',
        password: hashedPassword,
        name: 'Marketing Department Faculty',
        role: 'ADVISOR',
        facultyId: 'faculty_management_001',
      }
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Verification - count all created records
  const counts = await Promise.all([
    prisma.faculty.count(),
    prisma.department.count(),
    // prisma.courseType.count(), // Commented out for testing
    prisma.user.count(),
  ]);

  console.log('\n📊 Foundation Seed Summary:');
  console.log(`   Faculties: ${counts[0]}`);
  console.log(`   Departments: ${counts[1]}`);
  console.log(`   Course Types: 0 (commented out for testing)`);
  console.log(`   Users: ${counts[2]}`);
  console.log('\n🎉 Foundation seed completed successfully!');
  console.log('\n🔑 Default login credentials:');
  console.log('   Email: admin@assumption.ac.th');
  console.log('   Password: password123');
  console.log('\n   Faculty Users:');
  console.log('   - chair.engineering@assumption.ac.th (CHAIRPERSON)');
  console.log('   - chair.science@assumption.ac.th (CHAIRPERSON)');
  console.log('   - chair.management@assumption.ac.th (CHAIRPERSON)');
  console.log('   - cs.faculty@assumption.ac.th (ADVISOR)');
  console.log('   - bba.faculty@assumption.ac.th (ADVISOR)');
  console.log('   - mkt.faculty@assumption.ac.th (ADVISOR)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
