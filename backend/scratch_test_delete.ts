import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDelete() {
  try {
    console.log("Fetching all users...");
    const users = await prisma.user.findMany({
      include: {
        refreshTokens: true,
      }
    });
    console.log("Users in Database:");
    users.forEach(u => {
      console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, DeletedAt: ${u.deletedAt}, isActive: ${u.isActive}, StaffId: ${u.staffId}, RefreshTokenCount: ${u.refreshTokens.length}`);
    });

    // Find a non-admin user to test delete on
    const targetUser = users.find(u => u.role !== 'ADMIN' && u.deletedAt === null);
    if (!targetUser) {
      console.log("No non-admin active users found to test delete on.");
      return;
    }

    console.log(`\nAttempting soft delete on user: ${targetUser.name} (ID: ${targetUser.id}, Email: ${targetUser.email})`);
    
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: targetUser.id } }),
      prisma.user.update({
        where: { id: targetUser.id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          email: `${targetUser.email}_deleted_${Date.now()}`,
          staffId: null
        }
      })
    ]);

    console.log("SUCCESS: User soft-deleted successfully in transaction!");
  } catch (error: any) {
    console.error("FAILURE: Error occurred during user deletion test:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDelete();
