const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { role: 'ADMIN', deletedAt: null } });
  console.log("ACTIVE ADMINS COUNT:", users.length);
  console.log(users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
