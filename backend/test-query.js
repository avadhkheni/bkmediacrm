const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const roles = await prisma.role.findMany();
  console.log("ROLES:");
  console.log(roles);
  
  const users = await prisma.user.findMany();
  console.log("USERS:");
  console.log(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
