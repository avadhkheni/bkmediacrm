import { prisma } from './src/utils/prisma';

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });
    
    console.log('\n=== Existing Users ===');
    if (users.length === 0) {
      console.log('No users found in database!');
      console.log('\nCreating default admin user...\n');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await prisma.user.create({
        data: {
          email: 'admin@bkmedia.com',
          name: 'Admin User',
          passwordHash: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      console.log('✅ Admin user created!');
      console.log('   Email: admin@bkmedia.com');
      console.log('   Password: admin123');
    } else {
      console.log(JSON.stringify(users, null, 2));
    }
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
