-- AlterTable
ALTER TABLE "Client" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "ExpenseReport" ADD COLUMN "rejectedAt" DATETIME;
ALTER TABLE "ExpenseReport" ADD COLUMN "rejectedById" INTEGER;
ALTER TABLE "ExpenseReport" ADD COLUMN "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "LedStock" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "VideoEquipment" ADD COLUMN "brand" TEXT;
ALTER TABLE "VideoEquipment" ADD COLUMN "deletedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inquiry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryNumber" TEXT,
    "clientId" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "venue" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INQUIRY',
    "source" TEXT DEFAULT 'WEBSITE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "specialNotes" TEXT,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Inquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Inquiry" ("clientId", "createdAt", "createdById", "department", "endDate", "eventName", "eventType", "id", "inquiryNumber", "specialNotes", "startDate", "status", "totalDays", "updatedAt", "venue") SELECT "clientId", "createdAt", "createdById", "department", "endDate", "eventName", "eventType", "id", "inquiryNumber", "specialNotes", "startDate", "status", "totalDays", "updatedAt", "venue" FROM "Inquiry";
DROP TABLE "Inquiry";
ALTER TABLE "new_Inquiry" RENAME TO "Inquiry";
CREATE UNIQUE INDEX "Inquiry_inquiryNumber_key" ON "Inquiry"("inquiryNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
