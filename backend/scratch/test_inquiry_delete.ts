import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInquiryDelete() {
  try {
    console.log("Fetching all inquiries...");
    const inquiries = await prisma.inquiry.findMany({
      include: {
        client: true,
      }
    });
    console.log(`Total inquiries in database: ${inquiries.length}`);
    inquiries.forEach(inq => {
      console.log(`ID: ${inq.id}, Number: ${inq.inquiryNumber}, Name: ${inq.eventName}, DeletedAt: ${inq.deletedAt}`);
    });

    if (inquiries.length === 0) {
      console.log("No inquiries found.");
      return;
    }

    // Try soft deleting the first active one
    const target = inquiries.find(inq => inq.deletedAt === null);
    if (!target) {
      console.log("No active inquiries to soft-delete.");
      return;
    }

    console.log(`\nAttempting soft delete on inquiry ID: ${target.id} (${target.eventName})...`);
    const updated = await prisma.inquiry.update({
      where: { id: target.id },
      data: { deletedAt: new Date() },
    });
    console.log("SUCCESS: Soft-deleted inquiry:", updated.id, updated.deletedAt);
  } catch (error) {
    console.error("FAILURE:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testInquiryDelete();
