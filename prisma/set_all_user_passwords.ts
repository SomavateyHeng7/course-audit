import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const newPassword = 'changeme123'; // Set your desired plaintext password for all users
  const result = await prisma.user.updateMany({
    data: { password: newPassword }
  });
  console.log(`Updated ${result.count} user passwords to plaintext '${newPassword}'.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
