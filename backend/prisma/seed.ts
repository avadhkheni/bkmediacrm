import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Admin User
  const adminEmail = 'admin@bkmedia.in';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created.');
  } else {
    console.log('Admin user already exists.');
  }

  // 2. LED Type Rates
  const ledRates = [
    { ledType: 'P4',       ratePerSqftPerDay: 50 },
    { ledType: 'P3',       ratePerSqftPerDay: 65 },
    { ledType: 'P2',       ratePerSqftPerDay: 85 },
    { ledType: 'FLOOR_LED',ratePerSqftPerDay: 90 },
    { ledType: 'P4_CURVED',ratePerSqftPerDay: 60 },
  ];

  for (const rate of ledRates) {
    await prisma.ledTypeRate.upsert({
      where: { ledType: rate.ledType },
      update: { ratePerSqftPerDay: rate.ratePerSqftPerDay },
      create: { ledType: rate.ledType, ratePerSqftPerDay: rate.ratePerSqftPerDay },
    });
  }
  console.log('LED Type Rates seeded.');

  // 3. Vehicles
  const vehicles = [
    { name: 'Large Truck 1',    numberPlate: 'GJ-06-AB-0001', vehicleType: 'TRUCK' },
    { name: 'Large Truck 2',    numberPlate: 'GJ-06-AB-0002', vehicleType: 'TRUCK' },
    { name: 'Tempo Traveller',  numberPlate: 'GJ-06-AB-0003', vehicleType: 'TEMPO' },
    { name: 'Management Car',   numberPlate: 'GJ-06-AB-0004', vehicleType: 'CAR' },
  ];

  for (const v of vehicles) {
    const exists = await prisma.vehicle.findFirst({ where: { numberPlate: v.numberPlate } });
    if (!exists) {
      await prisma.vehicle.create({ data: v });
    }
  }
  console.log('Vehicles seeded.');

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
