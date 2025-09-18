import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Update all users to a default plaintext password
  const newPassword = 'changeme123'; // Set your desired password here
  const result = await prisma.user.updateMany({
    data: { password: newPassword }
  });
  console.log(`Updated ${result.count} user passwords to plaintext.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
