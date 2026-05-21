const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const newUser = await prisma.user.create({
      data: {
        name: "Test Admin",
        email: "testadmin123@bkmedia.in",
        passwordHash,
        role: "ADMIN",
        staffId: null
      }
    });
    console.log("SUCCESS:", newUser);
  } catch (error) {
    console.log("ERROR:", error.message);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
