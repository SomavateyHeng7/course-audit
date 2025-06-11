const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create faculties
  const faculties = [
    {
      name: 'Faculty of Engineering',
      code: 'ENG',
    },
    {
      name: 'Faculty of Science',
      code: 'SCI',
    },
  ];

  for (const faculty of faculties) {
    await prisma.faculty.upsert({
      where: { code: faculty.code },
      update: {},
      create: faculty,
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 