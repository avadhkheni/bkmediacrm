const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const staff = await prisma.staff.findMany();
  console.log("STAFF:");
  console.log(staff);
}
main().catch(console.error).finally(() => prisma.$disconnect());
