import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection...');
    const inquiryCount = await prisma.inquiry.count();
    console.log('Inquiry count:', inquiryCount);
    
    const stats = {
      totalInquiries: await prisma.inquiry.count(),
      confirmedInquiries: await prisma.inquiry.count({ where: { status: 'CONFIRMED' } }),
      pendingInquiries: await prisma.inquiry.count({ where: { status: 'INQUIRY' } }),
      totalClients: await prisma.client.count(),
      totalStaff: await prisma.staff.count({ where: { isActive: true } }),
    };
    console.log('Stats:', stats);
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const invoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { grossTotal: true }
    });
    console.log('Invoices found:', invoices.length);
    
  } catch (err) {
    console.error('Prisma Test Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
