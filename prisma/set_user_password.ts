import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // CHANGE THESE VALUES AS NEEDED
  const email = 'user@example.com'; // Target user email
  const newPassword = 'yourplaintextpassword'; // Desired plaintext password

  const user = await prisma.user.update({
    where: { email },
    data: { password: newPassword },
  });
  console.log(`Password for ${email} updated to '${newPassword}' (plaintext).`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
