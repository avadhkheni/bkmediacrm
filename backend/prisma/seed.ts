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

  // 5. Demo Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Main Surat Warehouse',
      location: 'Udhna Main Road, Surat',
      status: 'ACTIVE'
    }
  });
  console.log('Demo Warehouse seeded.');

  // 6. Demo Clients
  const clients = [
    { name: 'Star Events & Entertainment', contactPerson: 'Rajesh Shah', phone: '+91 98250 12345', email: 'rajesh@starevents.com', company: 'Star Events Ltd.', address: 'Ring Road, Surat' },
    { name: 'Wembley Wedding Planners', contactPerson: 'Anita Desai', phone: '+91 98980 54321', email: 'info@wembley.in', company: 'Wembley Services', address: 'Adajan, Surat' },
    { name: 'Surat Diamond Association', contactPerson: 'Dhansukh Patel', phone: '+91 99090 99090', email: 'contact@sda.org', company: 'SDA', address: 'Varachha, Surat' }
  ];

  const seededClients = [];
  for (const c of clients) {
    let client = await prisma.client.findFirst({ where: { phone: c.phone } });
    if (!client) {
      client = await prisma.client.create({ data: c });
    }
    seededClients.push(client);
  }
  console.log('Demo Clients seeded.');

  // 7. Demo Staff
  const staffMembers = [
    { name: 'Vikram Rathod', phone: '+91 90000 11111', email: 'vikram@bkmedia.in', role: 'OPERATIONAL', department: 'LED', perDayRate: 1500 },
    { name: 'Pooja Sharma', phone: '+91 90000 22222', email: 'pooja@bkmedia.in', role: 'FINANCE', department: 'Accounts', perDayRate: 2000 },
    { name: 'Ketan Mehta', phone: '+91 90000 33333', email: 'ketan@bkmedia.in', role: 'STAFF', department: 'Video', perDayRate: 1000 }
  ];

  for (const s of staffMembers) {
    const exists = await prisma.staff.findFirst({ where: { phone: s.phone } });
    if (!exists) {
      await prisma.staff.create({ data: s });
    }
  }
  console.log('Demo Staff seeded.');

  // 8. Demo Vendors
  const vendors = [
    { name: 'Surat Audio Rental', phone: '+91 98980 98980', email: 'rental@surataudio.com', department: 'SOUND', specialization: 'Line Array PA Systems', address: 'Katargam, Surat' },
    { name: 'Gujarat LED Suppliers', phone: '+91 97970 97970', email: 'sales@gujaratled.com', department: 'LED', specialization: 'P3/P4 Led Screens', address: 'Vesu, Surat' },
    { name: 'CineCamera Rental', phone: '+91 96960 96960', email: 'booking@cinecamera.in', department: 'VIDEO', specialization: 'Sony FX6/Red Cameras', address: 'Pal, Surat' }
  ];

  for (const v of vendors) {
    const exists = await prisma.vendor.findFirst({ where: { name: v.name } });
    if (!exists) {
      await prisma.vendor.create({ data: v });
    }
  }
  console.log('Demo Vendors seeded.');

  // 9. Demo Inventory Stock (Video, Sound, LED)
  const videoEquipment = [
    { name: 'Sony FX6 Camera Body', category: 'CAMERA', brand: 'Sony', model: 'FX6', serialNumber: 'SN-FX6-10029', totalQuantity: 3, availableQuantity: 3, ratePerDay: 5000, warehouseId: 1 },
    { name: '4K Video Switcher v1', category: 'SWITCHER', brand: 'Blackmagic', model: 'ATEM 4K', serialNumber: 'SN-ATEM-9921', totalQuantity: 2, availableQuantity: 2, ratePerDay: 3500, warehouseId: 1 },
    { name: '100m HDMI Optical Fiber Cable', category: 'CABLE', brand: 'Generic', model: 'HDMI-100M', serialNumber: 'SN-CABLE-0221', totalQuantity: 10, availableQuantity: 10, ratePerDay: 500, warehouseId: 1 }
  ];

  for (const ve of videoEquipment) {
    const exists = await prisma.videoEquipment.findFirst({ where: { name: ve.name } });
    if (!exists) {
      await prisma.videoEquipment.create({ data: ve });
    }
  }

  const soundEquipment = [
    { name: 'JBL VRX Line Array Speaker', category: 'SPEAKERS', brand: 'JBL', model: 'VRX932LA-1', serialNumber: 'SN-JBL-4401', totalQuantity: 8, availableQuantity: 8, ratePerDay: 2500, warehouseId: 1 },
    { name: 'Yamaha CL5 Sound Mixer', category: 'MIXERS', brand: 'Yamaha', model: 'CL5', serialNumber: 'SN-CL5-1102', totalQuantity: 2, availableQuantity: 2, ratePerDay: 6000, warehouseId: 1 },
    { name: 'Sennheiser G4 Wireless Microphone', category: 'MICROPHONES', brand: 'Sennheiser', model: 'EW-100-G4', serialNumber: 'SN-SEN-8832', totalQuantity: 6, availableQuantity: 6, ratePerDay: 1000, warehouseId: 1 }
  ];

  for (const se of soundEquipment) {
    const exists = await prisma.soundEquipment.findFirst({ where: { name: se.name } });
    if (!exists) {
      await prisma.soundEquipment.create({ data: se });
    }
  }

  const ledStock = [
    { companyName: 'Novastar', ledType: 'P3', cabinetHeightMm: 500, cabinetWidthMm: 500, cabinetsPerBox: 8, totalCabinets: 200, availableQuantity: 200, pricingSqft: 65, totalBoxes: 25, warehouseId: 1 },
    { companyName: 'Novastar', ledType: 'P2', cabinetHeightMm: 500, cabinetWidthMm: 500, cabinetsPerBox: 8, totalCabinets: 120, availableQuantity: 120, pricingSqft: 85, totalBoxes: 15, warehouseId: 1 }
  ];

  for (const ls of ledStock) {
    const exists = await prisma.ledStock.findFirst({ where: { ledType: ls.ledType, companyName: ls.companyName } });
    if (!exists) {
      await prisma.ledStock.create({ data: ls });
    }
  }
  console.log('Demo Stock seeded.');

  // 10. Demo Inquiries
  const baseDate = new Date();
  const inquiries = [
    {
      inquiryNumber: 'INQ-2026-0001',
      clientId: seededClients[0].id,
      department: 'LED',
      eventName: 'Grand Wedding Gala 2026',
      eventType: 'Wedding',
      startDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 5),
      endDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 7),
      totalDays: 2,
      venue: 'Laxmi Lawn, Adajan, Surat',
      status: 'CONFIRMED',
      source: 'DIRECT',
      priority: 'HIGH',
      category: 'WEDDING',
      specialNotes: 'Require curved LED panels if possible.'
    },
    {
      inquiryNumber: 'INQ-2026-0002',
      clientId: seededClients[2].id,
      department: 'VIDEO',
      eventName: 'Annual Diamond Exhibition',
      eventType: 'Exhibition',
      startDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 12),
      endDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 15),
      totalDays: 3,
      venue: 'Sarsana Convention Centre, Surat',
      status: 'INQUIRY',
      source: 'REFERRAL',
      priority: 'MEDIUM',
      category: 'CORPORATE',
      specialNotes: 'Multi-camera setup with video live streaming.'
    },
    {
      inquiryNumber: 'INQ-2026-0003',
      clientId: seededClients[1].id,
      department: 'SOUND',
      eventName: 'Bollywood Fest Musical Concert',
      eventType: 'Concert',
      startDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 20),
      endDate: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 21),
      totalDays: 1,
      venue: 'Dumas Ground, Surat',
      status: 'APPROVED',
      source: 'WEBSITE',
      priority: 'URGENT',
      category: 'CONCERT',
      specialNotes: 'Require 8 elements of JBL VRX Line array.'
    }
  ];

  for (const inq of inquiries) {
    const exists = await prisma.inquiry.findFirst({ where: { inquiryNumber: inq.inquiryNumber } });
    if (!exists) {
      await prisma.inquiry.create({ data: inq });
    }
  }
  console.log('Demo Inquiries seeded.');

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
