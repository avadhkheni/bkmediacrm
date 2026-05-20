import { prisma } from './src/utils/prisma';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  try {
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { email: 'admin@bkmedia.in' },
      data: { passwordHash: hashedPassword }
    });
    
    console.log('\n✅ Admin password reset successful!');
    console.log('   Email: admin@bkmedia.in');
    console.log('   New Password: admin123');
    console.log('\nYou can now login with these credentials.\n');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
