const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const newUser = await prisma.user.create({
      data: {
        name: "Vikram Rathod",
        email: "vikram.admin@bkmedia.in", 
        passwordHash,
        role: "ADMIN",
        staffId: 1 // Vikram Rathod's ID
      }
    });
    console.log("SUCCESS:", newUser);
  } catch (error) {
    console.log("ERROR:", error.message);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
