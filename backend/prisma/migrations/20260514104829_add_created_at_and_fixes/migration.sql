-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "staffId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "gstNumber" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Inquiry" (
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
    "specialNotes" TEXT,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quotationNumber" TEXT NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "revisionNumber" INTEGER NOT NULL DEFAULT 0,
    "parentQuotationId" INTEGER,
    "subtotal" DECIMAL NOT NULL,
    "gstRate" DECIMAL NOT NULL DEFAULT 18,
    "cgstAmount" DECIMAL,
    "sgstAmount" DECIMAL,
    "totalAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "validDays" INTEGER NOT NULL DEFAULT 15,
    "sentAt" DATETIME,
    "approvedAt" DATETIME,
    "signedCopyPath" TEXT,
    "notes" TEXT,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quotation_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "cgstAmount" DECIMAL,
    "sgstAmount" DECIMAL,
    "grossTotal" DECIMAL NOT NULL,
    "advanceAmount" DECIMAL NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paymentType" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNo" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" INTEGER,
    "notes" TEXT,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "staffType" TEXT NOT NULL DEFAULT 'CONTRACT',
    "perDayRate" DECIMAL NOT NULL,
    "aadharNumber" TEXT,
    "aadharFront" TEXT,
    "aadharBack" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EventStaffAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "positionNo" INTEGER,
    "positionName" TEXT,
    "daysAssigned" INTEGER NOT NULL,
    "ratePerDay" DECIMAL NOT NULL,
    "totalPayment" DECIMAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventStaffAssignment_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventStaffAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "department" TEXT,
    "specialization" TEXT,
    "address" TEXT,
    "gstNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExpenseReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "transportExpense" DECIMAL NOT NULL DEFAULT 0,
    "foodExpense" DECIMAL NOT NULL DEFAULT 0,
    "miscExpense" DECIMAL NOT NULL DEFAULT 0,
    "totalStaffCost" DECIMAL,
    "totalVendorCost" DECIMAL,
    "totalExpenses" DECIMAL,
    "clientBilling" DECIMAL,
    "netProfit" DECIMAL,
    "profitMargin" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedById" INTEGER,
    "submittedAt" DATETIME,
    "approvedById" INTEGER,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseReport_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtraExpense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "expenseReportId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtraExpense_expenseReportId_fkey" FOREIGN KEY ("expenseReportId") REFERENCES "ExpenseReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "numberPlate" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "capacityNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "DispatchStaffAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DispatchStaffAssignment_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DispatchStaffAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DispatchStaffAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoQuotationItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quotationId" INTEGER NOT NULL,
    "placeName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "ratePerDay" DECIMAL NOT NULL,
    "days" INTEGER NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VideoQuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoEquipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "model" TEXT,
    "serialNumber" TEXT,
    "ratePerDay" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VideoEventBooking" (
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
    CONSTRAINT "VideoEventBooking_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VideoEventBooking_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "VideoEquipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoDataSheet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "sessionName" TEXT NOT NULL,
    "isDayComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoDataSheet_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoDataSheetEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataSheetId" INTEGER NOT NULL,
    "cameraPosition" TEXT NOT NULL,
    "dataGb" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "VideoDataSheetEntry_dataSheetId_fkey" FOREIGN KEY ("dataSheetId") REFERENCES "VideoDataSheet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL,
    "ledType" TEXT NOT NULL,
    "cabinetHeightMm" INTEGER NOT NULL,
    "cabinetWidthMm" INTEGER NOT NULL,
    "cabinetsPerBox" INTEGER NOT NULL,
    "totalCabinets" INTEGER NOT NULL,
    "pricingSqft" INTEGER NOT NULL,
    "totalBoxes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LedTypeRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ledType" TEXT NOT NULL,
    "ratePerSqftPerDay" DECIMAL NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LedQuotationItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quotationId" INTEGER NOT NULL,
    "placeName" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "ledType" TEXT NOT NULL,
    "heightFt" DECIMAL NOT NULL,
    "widthFt" DECIMAL NOT NULL,
    "nos" INTEGER NOT NULL,
    "sqftPerDay" DECIMAL NOT NULL,
    "ratePerSqft" DECIMAL NOT NULL,
    "days" INTEGER NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LedQuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedWarehouseAllocation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "ledStockId" INTEGER NOT NULL,
    "allocatedSqft" INTEGER NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" DATETIME,
    "confirmedById" INTEGER,
    CONSTRAINT "LedWarehouseAllocation_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LedWarehouseAllocation_ledStockId_fkey" FOREIGN KEY ("ledStockId") REFERENCES "LedStock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedVendorArrangement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "vendorId" INTEGER,
    "vendorName" TEXT NOT NULL,
    "ledType" TEXT NOT NULL,
    "sqftArranged" INTEGER NOT NULL,
    "costRatePerSqftPerDay" DECIMAL NOT NULL,
    "days" INTEGER NOT NULL,
    "totalCost" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ARRANGED',
    CONSTRAINT "LedVendorArrangement_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LedVendorArrangement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedDispatchBoxEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "companyName" TEXT NOT NULL,
    "numBoxes" INTEGER NOT NULL,
    "cabinetsPerBox" INTEGER NOT NULL,
    "totalCabinets" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedDispatchBoxEntry_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedScreenStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "dayLabel" TEXT,
    "screenNo" INTEGER NOT NULL,
    "locationName" TEXT NOT NULL,
    "ledType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFF',
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "updatedById" INTEGER,
    CONSTRAINT "LedScreenStatus_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedEventIssue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inquiryId" INTEGER NOT NULL,
    "issueText" TEXT NOT NULL,
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" INTEGER,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    CONSTRAINT "LedEventIssue_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_staffId_key" ON "User"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_inquiryNumber_key" ON "Inquiry"("inquiryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_quotationId_key" ON "Invoice"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseReport_inquiryId_key" ON "ExpenseReport"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "LedTypeRate_ledType_key" ON "LedTypeRate"("ledType");

-- CreateIndex
CREATE UNIQUE INDEX "LedScreenStatus_inquiryId_eventDate_screenNo_key" ON "LedScreenStatus"("inquiryId", "eventDate", "screenNo");
