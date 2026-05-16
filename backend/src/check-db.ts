import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const users = await prisma.user.count();
  const vehicles = await prisma.vehicle.count();
  const ledRates = await prisma.ledTypeRate.count();
  const staff = await prisma.staff.count();
  const clients = await prisma.client.count();

  console.log('Database Summary:');
  console.log('- Users:', users);
  console.log('- Vehicles:', vehicles);
  console.log('- LED Rates:', ledRates);
  console.log('- Staff:', staff);
  console.log('- Clients:', clients);
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
