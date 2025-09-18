import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const currics = await prisma.curriculum.findMany({
    where: { name: { in: ['BSCS2022', 'BSCS 2021'] } },
    include: { curriculumCourses: { include: { course: true } } }
  });
  for (const c of currics) {
    console.log(`Curriculum: ${c.name} (${c.year})`);
    console.log(`Courses linked: ${c.curriculumCourses.length}`);
    for (const cc of c.curriculumCourses) {
      console.log(`- ${cc.course.code}: ${cc.course.name}`);
    }
    console.log('---');
  }
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
