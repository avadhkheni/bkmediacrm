import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Roles and Permissions
  // 1. Roles and Permissions
  const allModules = [
    "DASHBOARD",
    "INQUIRIES",
    "CLIENTS",
    "AVAILABILITY",
    "WORK_TEAMS",
    "WAREHOUSE",
    "ITEM_STOCK",
    "TO_DO_CHECKLISTS",
    "VENDORS",
    "VEHICLES",
    "INVOICES",
    "PROFIT_REPORTS",
    "STAFF"
  ];

  const defaultRoles = [
    {
      name: 'ADMIN',
      description: 'System Administrator with absolute privilege access',
      permissions: allModules.map(mod => ({
        module: mod,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      }))
    },
    {
      name: 'FINANCE',
      description: 'Finance Head - manages quotes, invoices, profit records, expenses, and vendors',
      permissions: allModules.map(mod => ({
        module: mod,
        canCreate: ['INVOICES', 'PROFIT_REPORTS', 'VENDORS'].includes(mod),
        canRead: true,
        canUpdate: ['INVOICES', 'PROFIT_REPORTS', 'VENDORS'].includes(mod),
        canDelete: false
      }))
    },
    {
      name: 'ACCOUNTS',
      description: 'Accountant - views dashboard records, manages invoices, and verifies statements',
      permissions: allModules.map(mod => ({
        module: mod,
        canCreate: mod === 'INVOICES',
        canRead: !['PROFIT_REPORTS'].includes(mod),
        canUpdate: mod === 'INVOICES',
        canDelete: false
      }))
    },
    {
      name: 'OPERATIONAL',
      description: 'Operations Manager - schedules teams, manages warehouse logistics, stock, and vehicles',
      permissions: allModules.map(mod => ({
        module: mod,
        canCreate: ['INQUIRIES', 'CLIENTS', 'AVAILABILITY', 'WORK_TEAMS', 'WAREHOUSE', 'ITEM_STOCK', 'TO_DO_CHECKLISTS', 'VENDORS', 'VEHICLES'].includes(mod),
        canRead: !['INVOICES', 'PROFIT_REPORTS'].includes(mod),
        canUpdate: ['INQUIRIES', 'CLIENTS', 'AVAILABILITY', 'WORK_TEAMS', 'WAREHOUSE', 'ITEM_STOCK', 'TO_DO_CHECKLISTS', 'VENDORS', 'VEHICLES'].includes(mod),
        canDelete: false
      }))
    },
    {
      name: 'VIDEO_DEPT',
      description: 'Video Editing Team - tracks departmental inventory, checklists, and tasks',
      permissions: allModules.map(mod => ({
        module: mod,
        canCreate: false,
        canRead: ['DASHBOARD', 'INQUIRIES', 'AVAILABILITY', 'WAREHOUSE', 'ITEM_STOCK', 'TO_DO_CHECKLISTS'].includes(mod),
        canUpdate: ['ITEM_STOCK', 'TO_DO_CHECKLISTS'].includes(mod),
        canDelete: false
      }))
    },
    {
      name: 'LED_DEPT',
      description: 'LED technicians - tracks LED panel stock, warehouse setups, and task checklists',
      permissions: allModules.map(mod => ({
        module: mod,
        canCreate: false,
        canRead: ['DASHBOARD', 'INQUIRIES', 'AVAILABILITY', 'WAREHOUSE', 'ITEM_STOCK', 'TO_DO_CHECKLISTS'].includes(mod),
        canUpdate: ['ITEM_STOCK', 'TO_DO_CHECKLISTS'].includes(mod),
        canDelete: false
      }))
    },
    {
      name: 'STAFF',
      description: 'General on-ground staff - manages checklists and tasks assigned to them',
      permissions: allModules.map(mod => ({
        module: mod,
        canCreate: false,
        canRead: ['DASHBOARD', 'TO_DO_CHECKLISTS', 'AVAILABILITY'].includes(mod),
        canUpdate: mod === 'TO_DO_CHECKLISTS',
        canDelete: false
      }))
    }
  ];

  for (const role of defaultRoles) {
    // Seed role
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: {
        name: role.name,
        description: role.description
      }
    });

    // Seed permissions
    for (const perm of role.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleName_module: {
            roleName: role.name,
            module: perm.module
          }
        },
        update: {
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete
        },
        create: {
          roleName: role.name,
          module: perm.module,
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete
        }
      });
    }
  }
  console.log('Roles and Permissions seeded.');

  // 2. Admin User
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

  // 3. LED Type Rates
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

  // 4. Vehicles
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
