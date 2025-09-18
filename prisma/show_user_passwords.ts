import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, password: true } });
  console.log(users);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
