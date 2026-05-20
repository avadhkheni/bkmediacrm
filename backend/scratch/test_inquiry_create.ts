import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const year = new Date().getFullYear();
    const lastInquiry = await prisma.inquiry.findFirst({
      where: {
        inquiryNumber: {
          startsWith: `INQ-${year}-`
        }
      },
      orderBy: {
        inquiryNumber: 'desc'
      }
    });

    let nextSeq = 1;
    if (lastInquiry && lastInquiry.inquiryNumber) {
      const parts = lastInquiry.inquiryNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
    const inquiryNumber = `INQ-${year}-${nextSeq.toString().padStart(4, '0')}`;

    console.log('Trying to create inquiry...');
    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryNumber,
        clientId: 1, // first seeded client
        department: 'VIDEO',
        eventName: 'Test Event',
        eventType: 'Other',
        startDate: new Date(),
        endDate: new Date(),
        totalDays: 1,
        venue: 'Test Venue',
        specialNotes: '',
        source: 'DIRECT',
        priority: 'MEDIUM',
        category: 'OTHER',
        status: 'INQUIRY',
        createdById: null
      }
    });
    console.log('Inquiry created successfully:', inquiry);
  } catch (error) {
    console.error('Error creating inquiry details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
