import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDummyData() {
  try {
    console.log('Cleaning up existing dummy data...');
    await prisma.invoice.deleteMany();
    await prisma.quotation.deleteMany();
    await prisma.inquiry.deleteMany();
    await prisma.client.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.ledStock.deleteMany();
    await prisma.videoEquipment.deleteMany();

    console.log('Starting dummy seeding...');

    // 1. Create 5 Clients
    const clientData = [];
    for (let i = 1; i <= 5; i++) {
      clientData.push({
        name: `Client ${i}`,
        contactPerson: `Person ${i}`,
        phone: `990000000${i}`,
        email: `client${i}@example.com`,
        company: `Company ${i} Pvt Ltd`,
        address: `Address Line ${i}, Mumbai`
      });
    }
    await prisma.client.createMany({ data: clientData });
    const clients = await prisma.client.findMany();
    console.log('5 Clients created.');

    // 2. Create 5 Staff
    const staffData = [];
    const roles = ['OPERATOR', 'TECHNICIAN', 'EDITOR', 'MANAGER', 'DIRECTOR'];
    for (let i = 1; i <= 5; i++) {
      staffData.push({
        name: `Staff Member ${i}`,
        phone: `880000000${i}`,
        email: `staff${i}@bkmedia.in`,
        role: roles[i-1],
        department: i % 2 === 0 ? 'VIDEO' : 'LED',
        staffType: i % 3 === 0 ? 'IN_HOUSE' : 'CONTRACT',
        perDayRate: 1000 + (i * 200)
      });
    }
    await prisma.staff.createMany({ data: staffData });
    console.log('5 Staff members created.');

    // 3. Create 5 LED Stocks
    const ledData = [];
    for (let i = 1; i <= 5; i++) {
      ledData.push({
        companyName: `LED Brand ${i}`,
        ledType: i % 2 === 0 ? 'P2.5' : 'P3.9',
        cabinetHeightMm: 500,
        cabinetWidthMm: 500,
        cabinetsPerBox: 8,
        totalCabinets: 50 + (i * 10),
        pricingSqft: 50 + (i * 5),
        totalBoxes: Math.ceil((50 + (i * 10)) / 8)
      });
    }
    await prisma.ledStock.createMany({ data: ledData });
    console.log('5 LED Stocks created.');

    // 4. Create 5 Video Equipments
    const videoData = [];
    const cats = ['CAMERA', 'LENS', 'LIGHTING', 'AUDIO', 'STABILIZER'];
    for (let i = 1; i <= 5; i++) {
      videoData.push({
        name: `Equipment ${i}`,
        category: cats[i-1],
        brand: i % 2 === 0 ? 'Sony' : 'Canon',
        model: `Model X-${i}`,
        status: 'AVAILABLE'
      });
    }
    await prisma.videoEquipment.createMany({ data: videoData });
    console.log('5 Video Equipments created.');

    // 5. Create 5 Inquiries
    const inquiryData = [];
    for (let i = 1; i <= 5; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (i * 5));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      inquiryData.push({
        inquiryNumber: `INQ-2025-D00${i}`,
        clientId: clients[i-1].id,
        department: i % 2 === 0 ? 'VIDEO' : 'LED',
        eventName: `Big Event ${i}`,
        startDate: startDate,
        endDate: endDate,
        totalDays: 3,
        venue: `Premium Venue ${i}, Mumbai`,
        status: 'INQUIRY'
      });
    }
    await prisma.inquiry.createMany({ data: inquiryData });
    const inquiries = await prisma.inquiry.findMany();
    console.log('5 Inquiries created.');

    // 6. Create 5 Quotations & Invoices
    for (let i = 0; i < 5; i++) {
      const amount = 50000 + (i * 10000);
      const quot = await prisma.quotation.create({
        data: {
          quotationNumber: `QUO-2025-D00${i+1}`,
          inquiryId: inquiries[i].id,
          subtotal: amount,
          totalAmount: amount * 1.18,
          status: 'APPROVED'
        }
      });

      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2025-D00${i+1}`,
          quotationId: quot.id,
          inquiryId: inquiries[i].id,
          subtotal: amount,
          grossTotal: amount * 1.18,
          status: 'PENDING',
          dueDate: new Date()
        }
      });
    }
    console.log('5 Quotations and 5 Invoices created.');

    console.log('All dummy data created successfully (5 records each)!');
  } catch (error) {
    console.error('Error adding dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDummyData();
