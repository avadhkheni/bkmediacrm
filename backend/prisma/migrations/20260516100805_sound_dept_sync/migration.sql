-- CreateTable
CREATE TABLE "SoundQuotationItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quotationId" INTEGER NOT NULL,
    "placeName" TEXT NOT NULL,
    "position" TEXT,
    "equipmentType" TEXT NOT NULL,
    "ratePerDay" DECIMAL NOT NULL,
    "days" INTEGER NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SoundQuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SoundEquipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "totalQuantity" INTEGER NOT NULL DEFAULT 1,
    "availableQuantity" INTEGER NOT NULL DEFAULT 1,
    "inUseQuantity" INTEGER NOT NULL DEFAULT 0,
    "maintenanceQuantity" INTEGER NOT NULL DEFAULT 0,
    "ratePerDay" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "warehouseId" INTEGER,
    CONSTRAINT "SoundEquipment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SoundEventBooking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "position" TEXT,
    "bookedFrom" DATETIME NOT NULL,
    "bookedTo" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "vendorId" INTEGER,
    "vendorCost" DECIMAL,
    "confirmedById" INTEGER,
    "confirmedAt" DATETIME,
    CONSTRAINT "SoundEventBooking_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SoundEventBooking_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "SoundEquipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SoundSetup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "stageSize" TEXT,
    "audienceSize" INTEGER,
    "eventType" TEXT,
    "powerRequiredKw" DECIMAL NOT NULL DEFAULT 0,
    "venueType" TEXT,
    "paSystemType" TEXT,
    "monitorCount" INTEGER NOT NULL DEFAULT 0,
    "wirelessMicCount" INTEGER NOT NULL DEFAULT 0,
    "totalWattage" INTEGER NOT NULL DEFAULT 0,
    "riggingDone" BOOLEAN NOT NULL DEFAULT false,
    "paTuned" BOOLEAN NOT NULL DEFAULT false,
    "soundCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SoundSetup_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "warehouseId" INTEGER NOT NULL,
    "videoEquipId" INTEGER,
    "ledStockId" INTEGER,
    "soundEquipId" INTEGER,
    "action" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "userId" INTEGER,
    "inquiryId" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_videoEquipId_fkey" FOREIGN KEY ("videoEquipId") REFERENCES "VideoEquipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_ledStockId_fkey" FOREIGN KEY ("ledStockId") REFERENCES "LedStock" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_soundEquipId_fkey" FOREIGN KEY ("soundEquipId") REFERENCES "SoundEquipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "staffName" TEXT NOT NULL,
    "notes" TEXT,
    "penaltyAmount" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "checklistId" INTEGER NOT NULL,
    "checkName" TEXT NOT NULL,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfficeTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subDepartment" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "deadline" DATETIME,
    "assignedStaffId" INTEGER,
    "rawFootageRecv" BOOLEAN NOT NULL DEFAULT false,
    "editingStarted" BOOLEAN NOT NULL DEFAULT false,
    "reviewDone" BOOLEAN NOT NULL DEFAULT false,
    "readyForDelivery" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfficeTask_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfficeTask_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LedStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL,
    "ledType" TEXT NOT NULL,
    "cabinetHeightMm" INTEGER NOT NULL,
    "cabinetWidthMm" INTEGER NOT NULL,
    "cabinetsPerBox" INTEGER NOT NULL,
    "totalCabinets" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "inUseQuantity" INTEGER NOT NULL DEFAULT 0,
    "maintenanceQuantity" INTEGER NOT NULL DEFAULT 0,
    "pricingSqft" INTEGER NOT NULL,
    "totalBoxes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "warehouseId" INTEGER,
    CONSTRAINT "LedStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LedStock" ("cabinetHeightMm", "cabinetWidthMm", "cabinetsPerBox", "companyName", "createdAt", "deletedAt", "id", "isActive", "ledType", "pricingSqft", "totalBoxes", "totalCabinets") SELECT "cabinetHeightMm", "cabinetWidthMm", "cabinetsPerBox", "companyName", "createdAt", "deletedAt", "id", "isActive", "ledType", "pricingSqft", "totalBoxes", "totalCabinets" FROM "LedStock";
DROP TABLE "LedStock";
ALTER TABLE "new_LedStock" RENAME TO "LedStock";
CREATE TABLE "new_VideoEquipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "totalQuantity" INTEGER NOT NULL DEFAULT 1,
    "availableQuantity" INTEGER NOT NULL DEFAULT 1,
    "inUseQuantity" INTEGER NOT NULL DEFAULT 0,
    "maintenanceQuantity" INTEGER NOT NULL DEFAULT 0,
    "ratePerDay" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "warehouseId" INTEGER,
    CONSTRAINT "VideoEquipment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VideoEquipment" ("brand", "category", "createdAt", "deletedAt", "id", "model", "name", "notes", "ratePerDay", "serialNumber", "status") SELECT "brand", "category", "createdAt", "deletedAt", "id", "model", "name", "notes", "ratePerDay", "serialNumber", "status" FROM "VideoEquipment";
DROP TABLE "VideoEquipment";
ALTER TABLE "new_VideoEquipment" RENAME TO "VideoEquipment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SoundSetup_inquiryId_key" ON "SoundSetup"("inquiryId");
