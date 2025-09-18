import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // IDs to update
  const curriculumId = 'cmf29k17g0019udi063e6u3i3';
  const facultyId = 'cmezyzys100003yox8hxim7ad';
  const departmentId = 'cmf6bxwxf0002s7zdc9uj8986';

  // Update curriculum
  await prisma.curriculum.update({
    where: { id: curriculumId },
    data: { facultyId, departmentId },
  });
  console.log('Curriculum updated.');

  // Update all chairpersons to match (or filter by email if needed)
  await prisma.user.updateMany({
    where: { role: 'CHAIRPERSON' },
    data: { facultyId, departmentId },
  });
  console.log('Chairperson(s) updated.');
  }

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());