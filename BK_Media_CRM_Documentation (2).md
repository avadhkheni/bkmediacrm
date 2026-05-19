http://localhost:3000/dashboard/vendors# BK Media CRM — Complete Developer Documentation

**Company:** BK Media, Vadodara, Gujarat
**Tech Stack:** Next.js (Frontend) · Node.js / Express.js (Backend API) · PostgreSQL (Database)
**Scope:** Video Department + LED Department (Phase 1)
**Version:** 1.1

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Module Specs — Video Department](#6-module-specs--video-department)
7. [Module Specs — LED Department](#7-module-specs--led-department)
8. [Availability Dashboard](#8-availability-dashboard)
9. [Shared Modules](#9-shared-modules)
10. [Business Logic & Calculations](#10-business-logic--calculations)
11. [UI/UX Requirements](#11-uiux-requirements)
12. [Seed Data](#12-seed-data)
13. [Environment Setup](#13-environment-setup)

---

## 1. Project Overview

BK Media is a media production company in Vadodara, Gujarat. This CRM manages end-to-end workflows for event production departments.

### Phase 1 Departments
- **Video Department** — Videography & photography
- **LED Department** — LED screen rental & setup

### Phase 2 (Future)
- Sound System Department
- Office Department (Editing, Graphics, Social Media)

### Core Workflow (Both Departments)
```
Inquiry → Quotation → Approval → Warehouse Check → Operator Assignment
→ Client Requirements PDF → Dispatch → Event Execution → Expense Report
→ Invoice → Payment → Delivery / De-installation
```

---

## 2. System Architecture

### Frontend — Next.js
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS for styling
- Zustand or Redux Toolkit for state management
- React Query (TanStack Query) for server state & caching
- React Hook Form + Zod for form validation
- jsPDF / react-pdf for client-side PDF preview
- axios for API calls
- date-fns for date utilities

### Backend — Node.js / Express.js
- Node.js 20+ with Express.js
- TypeScript
- Prisma ORM with PostgreSQL
- JWT Authentication with Refresh Tokens (jsonwebtoken)
- bcryptjs for password hashing
- express-validator for request validation
- puppeteer or @react-pdf/renderer for server-side PDF generation
- node-cron for background jobs (notifications, reminders)
- multer for file uploads (Aadhar documents)
- cors, helmet, morgan for middleware

### Database — PostgreSQL 15+
- Managed via Prisma ORM
- Prisma Migrate for schema migrations

### Infrastructure
- REST API (Express.js)
- JWT + Refresh token auth
- Role-based authorization middleware
- File storage for PDFs and Aadhar docs (local /uploads or AWS S3)
- Environment: .env files for config

---

## 3. User Roles & Permissions

| Role | Code | Access |
|------|------|--------|
| Admin | ADMIN | Full access |
| Finance | FINANCE | View payments only (read-only) |
| Accounts | ACCOUNTS | All accounts, invoices, payments |
| Operational | OPERATIONAL | Everything except payments |
| Video Dept | VIDEO_DEPT | Video events only |
| LED Dept | LED_DEPT | LED events only |
| Staff | STAFF | Own profile + work/payment history |

### Permission Matrix

| Feature | ADMIN | FINANCE | ACCOUNTS | OPERATIONAL | VIDEO_DEPT | LED_DEPT | STAFF |
|---------|:-----:|:-------:|:--------:|:-----------:|:----------:|:--------:|:-----:|
| Inquiries | CRUD | R | CRUD | CRUD | CRUD (own) | CRUD (own) | R (own) |
| Quotations | CRUD | R | CRUD | CRUD | CRUD (own) | CRUD (own) | — |
| Financial data | CRUD | R | CRUD | — | — | — | R (own pay) |
| Warehouse | CRUD | — | R | CRUD | R | R | — |
| Staff assignment | CRUD | — | R | CRUD | CRUD | CRUD | R (own) |
| Invoices | CRUD | R | CRUD | R | R | R | — |
| Expense report | CRUD | — | CRUD | R | R | R | — |
| Reports | All | Financial | All | Operational | Dept | Dept | Own |

---

## 4. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── AUTH ───────────────────────────────────────────────

model User {
  id           Int       @id @default(autoincrement())
  name         String
  email        String    @unique
  passwordHash String
  role         String    // ADMIN | FINANCE | ACCOUNTS | OPERATIONAL | VIDEO_DEPT | LED_DEPT | STAFF
  staffId      Int?
  staff        Staff?    @relation(fields: [staffId], references: [id])
  isActive     Boolean   @default(true)
  lastLogin    DateTime?
  createdAt    DateTime  @default(now())

  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  token     String
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// ─── CLIENTS ────────────────────────────────────────────

model Client {
  id            Int       @id @default(autoincrement())
  name          String
  contactPerson String?
  phone         String
  email         String?
  company       String?
  gstNumber     String?
  address       String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  inquiries Inquiry[]
}

// ─── INQUIRIES ──────────────────────────────────────────

model Inquiry {
  id             Int       @id @default(autoincrement())
  inquiryNumber  String?   @unique
  clientId       Int
  client         Client    @relation(fields: [clientId], references: [id])
  department     String    // VIDEO | LED | SOUND
  eventName      String
  eventType      String?
  startDate      DateTime
  endDate        DateTime
  totalDays      Int
  venue          String
  status         String    @default("INQUIRY")
  // INQUIRY | QUOTATION_SENT | QUOTATION_REVISED | CONFIRMED
  // IN_PROGRESS | COMPLETED | CANCELLED
  specialNotes   String?
  createdById    Int?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  quotations            Quotation[]
  invoices              Invoice[]
  staffAssignments      EventStaffAssignment[]
  expenseReport         ExpenseReport?
  videoDataSheets       VideoDataSheet[]
  videoEventBookings    VideoEventBooking[]
  ledWarehouseAllocations LedWarehouseAllocation[]
  ledVendorArrangements LedVendorArrangement[]
  ledDispatchBoxEntries LedDispatchBoxEntry[]
  ledScreenStatuses     LedScreenStatus[]
  ledEventIssues        LedEventIssue[]
  dispatchStaffAssignments DispatchStaffAssignment[]
}

// ─── QUOTATIONS ─────────────────────────────────────────

model Quotation {
  id                Int       @id @default(autoincrement())
  quotationNumber   String    @unique
  // Format: BKM/26-27/05/013  Revision: BKM/26-27/05/013-1
  inquiryId         Int
  inquiry           Inquiry   @relation(fields: [inquiryId], references: [id])
  revisionNumber    Int       @default(0)
  parentQuotationId Int?
  subtotal          Decimal   @db.Decimal(12, 2)
  gstRate           Decimal   @default(18) @db.Decimal(5, 2)
  cgstAmount        Decimal?  @db.Decimal(12, 2)
  sgstAmount        Decimal?  @db.Decimal(12, 2)
  totalAmount       Decimal   @db.Decimal(12, 2)
  status            String    @default("DRAFT")
  // DRAFT | SENT | APPROVED | REVISED | REJECTED
  validDays         Int       @default(15)
  sentAt            DateTime?
  approvedAt        DateTime?
  signedCopyPath    String?
  notes             String?
  createdById       Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  videoQuotationItems VideoQuotationItem[]
  ledQuotationItems   LedQuotationItem[]
  invoice             Invoice?
}

// ─── INVOICES ───────────────────────────────────────────

model Invoice {
  id             Int       @id @default(autoincrement())
  invoiceNumber  String    @unique
  // Format: BKM-INV-26-27/05/009
  quotationId    Int       @unique
  quotation      Quotation @relation(fields: [quotationId], references: [id])
  inquiryId      Int
  inquiry        Inquiry   @relation(fields: [inquiryId], references: [id])
  subtotal       Decimal   @db.Decimal(12, 2)
  cgstAmount     Decimal?  @db.Decimal(12, 2)
  sgstAmount     Decimal?  @db.Decimal(12, 2)
  grossTotal     Decimal   @db.Decimal(12, 2)
  advanceAmount  Decimal   @default(0) @db.Decimal(12, 2)
  balanceAmount  Decimal?  @db.Decimal(12, 2)
  status         String    @default("PENDING")
  // PENDING | PARTIAL | PAID | OVERDUE
  dueDate        DateTime?
  createdById    Int?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  payments Payment[]
}

model Payment {
  id            Int      @id @default(autoincrement())
  invoiceId     Int
  invoice       Invoice  @relation(fields: [invoiceId], references: [id])
  amount        Decimal  @db.Decimal(12, 2)
  paymentType   String   // ADVANCE | BALANCE | FULL
  paymentMethod String   // CASH | UPI | BANK_TRANSFER | CHEQUE
  referenceNo   String?
  receivedAt    DateTime @default(now())
  receivedById  Int?
  notes         String?
}

// ─── STAFF ──────────────────────────────────────────────

model Staff {
  id           Int       @id @default(autoincrement())
  name         String
  phone        String
  email        String?
  role         String
  department   String?   // VIDEO | LED | SOUND | OFFICE
  staffType    String    @default("CONTRACT") // INHOUSE | CONTRACT
  perDayRate   Decimal   @db.Decimal(10, 2)
  aadharNumber String?
  aadharFront  String?   // file path
  aadharBack   String?   // file path
  address      String?
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())

  user         User?
  assignments  EventStaffAssignment[]
  dispatchAssignments DispatchStaffAssignment[]
}

model EventStaffAssignment {
  id             Int       @id @default(autoincrement())
  inquiryId      Int
  inquiry        Inquiry   @relation(fields: [inquiryId], references: [id])
  staffId        Int
  staff          Staff     @relation(fields: [staffId], references: [id])
  positionNo     Int?
  positionName   String?
  daysAssigned   Int
  ratePerDay     Decimal   @db.Decimal(10, 2)
  totalPayment   Decimal   @db.Decimal(12, 2)
  paymentStatus  String    @default("PENDING") // PENDING | PAID
  paymentMethod  String?
  paidAt         DateTime?
  notes          String?
}

// ─── VENDORS ────────────────────────────────────────────

model Vendor {
  id              Int      @id @default(autoincrement())
  name            String
  phone           String?
  email           String?
  department      String?  // VIDEO | LED | SOUND
  specialization  String?
  address         String?
  gstNumber       String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  ledVendorArrangements LedVendorArrangement[]
}

// ─── EXPENSE REPORTS ────────────────────────────────────

model ExpenseReport {
  id               Int       @id @default(autoincrement())
  inquiryId        Int       @unique
  inquiry          Inquiry   @relation(fields: [inquiryId], references: [id])
  transportExpense Decimal   @default(0) @db.Decimal(10, 2)
  foodExpense      Decimal   @default(0) @db.Decimal(10, 2)
  miscExpense      Decimal   @default(0) @db.Decimal(10, 2)
  totalStaffCost   Decimal?  @db.Decimal(12, 2)
  totalVendorCost  Decimal?  @db.Decimal(12, 2)
  totalExpenses    Decimal?  @db.Decimal(12, 2)
  clientBilling    Decimal?  @db.Decimal(12, 2)
  netProfit        Decimal?  @db.Decimal(12, 2)
  profitMargin     Decimal?  @db.Decimal(5, 2)
  status           String    @default("DRAFT") // DRAFT | SUBMITTED | APPROVED
  submittedById    Int?
  submittedAt      DateTime?
  approvedById     Int?
  approvedAt       DateTime?

  extraExpenses ExtraExpense[]
}

model ExtraExpense {
  id              Int           @id @default(autoincrement())
  expenseReportId Int
  expenseReport   ExpenseReport @relation(fields: [expenseReportId], references: [id])
  name            String
  amount          Decimal       @db.Decimal(10, 2)
  createdAt       DateTime      @default(now())
}

// ─── VEHICLES & DISPATCH ────────────────────────────────

model Vehicle {
  id            Int      @id @default(autoincrement())
  name          String
  numberPlate   String
  vehicleType   String   // TRUCK | TEMPO | CAR
  capacityNotes String?
  isActive      Boolean  @default(true)

  dispatchStaffAssignments DispatchStaffAssignment[]
}

model DispatchStaffAssignment {
  id         Int      @id @default(autoincrement())
  inquiryId  Int
  inquiry    Inquiry  @relation(fields: [inquiryId], references: [id])
  vehicleId  Int
  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id])
  staffId    Int
  staff      Staff    @relation(fields: [staffId], references: [id])
  createdAt  DateTime @default(now())
}

// ─── VIDEO DEPARTMENT ───────────────────────────────────

model VideoQuotationItem {
  id           Int       @id @default(autoincrement())
  quotationId  Int
  quotation    Quotation @relation(fields: [quotationId], references: [id])
  placeName    String
  position     String
  equipmentType String
  ratePerDay   Decimal   @db.Decimal(10, 2)
  days         Int
  totalAmount  Decimal   @db.Decimal(12, 2)
  sortOrder    Int       @default(0)
}

model VideoEquipment {
  id           Int      @id @default(autoincrement())
  name         String
  category     String
  // VIDEO_CAMERA | PHOTO_CAMERA | DRONE | MIXER | PC | CRANE | ACCESSORY
  model        String?
  serialNumber String?
  ratePerDay   Decimal? @db.Decimal(10, 2)
  status       String   @default("AVAILABLE")
  // AVAILABLE | BOOKED | MAINTENANCE
  notes        String?
  createdAt    DateTime @default(now())

  bookings VideoEventBooking[]
}

model VideoEventBooking {
  id          Int            @id @default(autoincrement())
  inquiryId   Int
  inquiry     Inquiry        @relation(fields: [inquiryId], references: [id])
  equipmentId Int
  equipment   VideoEquipment @relation(fields: [equipmentId], references: [id])
  position    String?
  bookedFrom  DateTime
  bookedTo    DateTime
  status      String         @default("BOOKED") // BOOKED | OUT | RETURNED
  vendorId    Int?
  vendorCost  Decimal?       @db.Decimal(10, 2)
  confirmedById Int?
  confirmedAt DateTime?
}

model VideoDataSheet {
  id             Int      @id @default(autoincrement())
  inquiryId      Int
  inquiry        Inquiry  @relation(fields: [inquiryId], references: [id])
  dayNumber      Int
  eventDate      DateTime
  sessionName    String
  isDayComplete  Boolean  @default(false)
  createdAt      DateTime @default(now())

  entries VideoDataSheetEntry[]
}

model VideoDataSheetEntry {
  id             Int            @id @default(autoincrement())
  dataSheetId    Int
  dataSheet      VideoDataSheet @relation(fields: [dataSheetId], references: [id])
  cameraPosition String
  dataGb         Decimal        @default(0) @db.Decimal(8, 2)
  notes          String?
}

// ─── LED DEPARTMENT ─────────────────────────────────────

model LedStock {
  id                Int      @id @default(autoincrement())
  companyName       String
  ledType           String   // P4 | P3 | P2 | FLOOR_LED | P4_CURVED
  cabinetHeightMm   Int
  cabinetWidthMm    Int
  cabinetsPerBox    Int
  totalCabinets     Int
  pricingSqft       Int      // totalCabinets * 4 (computed on create/update)
  totalBoxes        Int      // ceil(totalCabinets / cabinetsPerBox)
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())

  allocations LedWarehouseAllocation[]
}

model LedTypeRate {
  id                   Int      @id @default(autoincrement())
  ledType              String   @unique
  ratePerSqftPerDay    Decimal  @db.Decimal(8, 2)
  updatedAt            DateTime @updatedAt
}

model LedQuotationItem {
  id           Int       @id @default(autoincrement())
  quotationId  Int
  quotation    Quotation @relation(fields: [quotationId], references: [id])
  placeName    String
  locationName String
  ledType      String
  heightFt     Decimal   @db.Decimal(8, 2)
  widthFt      Decimal   @db.Decimal(8, 2)
  nos          Int
  sqftPerDay   Decimal   @db.Decimal(10, 2)  // heightFt * widthFt * nos
  ratePerSqft  Decimal   @db.Decimal(8, 2)
  days         Int
  totalAmount  Decimal   @db.Decimal(12, 2)  // sqftPerDay * ratePerSqft * days
  sortOrder    Int       @default(0)
}

model LedWarehouseAllocation {
  id            Int      @id @default(autoincrement())
  inquiryId     Int
  inquiry       Inquiry  @relation(fields: [inquiryId], references: [id])
  ledStockId    Int
  ledStock      LedStock @relation(fields: [ledStockId], references: [id])
  allocatedSqft Int
  confirmed     Boolean  @default(false)
  confirmedAt   DateTime?
  confirmedById Int?
}

model LedVendorArrangement {
  id                      Int      @id @default(autoincrement())
  inquiryId               Int
  inquiry                 Inquiry  @relation(fields: [inquiryId], references: [id])
  vendorId                Int?
  vendor                  Vendor?  @relation(fields: [vendorId], references: [id])
  vendorName              String
  ledType                 String
  sqftArranged            Int
  costRatePerSqftPerDay   Decimal  @db.Decimal(8, 2)
  days                    Int
  totalCost               Decimal  @db.Decimal(12, 2)  // sqftArranged * rate * days
  status                  String   @default("ARRANGED")
}

model LedDispatchBoxEntry {
  id              Int      @id @default(autoincrement())
  inquiryId       Int
  inquiry         Inquiry  @relation(fields: [inquiryId], references: [id])
  vehicleName     String
  vehicleNumber   String?
  companyName     String
  numBoxes        Int
  cabinetsPerBox  Int
  totalCabinets   Int      // numBoxes * cabinetsPerBox
  createdAt       DateTime @default(now())
}

model LedScreenStatus {
  id           Int      @id @default(autoincrement())
  inquiryId    Int
  inquiry      Inquiry  @relation(fields: [inquiryId], references: [id])
  eventDate    DateTime
  dayLabel     String?
  screenNo     Int
  locationName String
  ledType      String?
  status       String   @default("OFF") // OFF | SETUP | LIVE | ISSUE
  notes        String?
  updatedAt    DateTime @updatedAt
  updatedById  Int?

  @@unique([inquiryId, eventDate, screenNo])
}

model LedEventIssue {
  id          Int      @id @default(autoincrement())
  inquiryId   Int
  inquiry     Inquiry  @relation(fields: [inquiryId], references: [id])
  issueText   String
  reportedAt  DateTime @default(now())
  reportedById Int?
  resolved    Boolean  @default(false)
  resolvedAt  DateTime?
}
```

---

## 5. API Endpoints

Base URL: `/api/v1`

### Auth
```
POST  /auth/login
      Body: { email, password }
      Returns: { accessToken, refreshToken, user }

POST  /auth/refresh
      Body: { refreshToken }
      Returns: { accessToken, refreshToken }

POST  /auth/logout
      Body: { refreshToken }
```

### Clients
```
GET   /clients?search=&page=1&limit=20
POST  /clients
GET   /clients/:id
PUT   /clients/:id
GET   /clients/:id/inquiries
```

### Inquiries
```
GET   /inquiries?dept=VIDEO&status=CONFIRMED&page=1&limit=20
POST  /inquiries
GET   /inquiries/:id
PUT   /inquiries/:id
GET   /inquiries/:id/timeline
PUT   /inquiries/:id/status
      Body: { status }
```

### Quotations
```
GET   /quotations?inquiryId=
POST  /quotations
GET   /quotations/:id
PUT   /quotations/:id
POST  /quotations/:id/revise
POST  /quotations/:id/approve
      Body: { signedCopyPath? }
POST  /quotations/:id/send
GET   /quotations/:id/pdf
GET   /quotations/next-number?dept=VIDEO
      Returns: { quotationNumber: "BKM/26-27/05/014" }
```

### Video — Quotation Items
```
GET   /video/quotation-items?quotationId=
POST  /video/quotation-items/bulk
      Body: { quotationId, items: [{ placeName, position, equipmentType, ratePerDay, days }] }
PUT   /video/quotation-items/:id
DELETE /video/quotation-items/:id
```

### Video — Equipment & Warehouse
```
GET   /video/equipment?category=&status=
POST  /video/equipment
PUT   /video/equipment/:id

GET   /video/equipment/availability?startDate=2026-05-15&endDate=2026-05-20
      Returns: [{ ...equipment, isAvailable, bookedInEvent? }]

GET   /video/bookings?inquiryId=
POST  /video/bookings
      Body: { inquiryId, equipmentId, position, bookedFrom, bookedTo, vendorId?, vendorCost? }
PUT   /video/bookings/:id/confirm
PUT   /video/bookings/:id/return
```

### Video — Data Sheet
```
GET   /video/data-sheets?inquiryId=
POST  /video/data-sheets
      Body: { inquiryId, dayNumber, eventDate, sessionName }
PUT   /video/data-sheets/:id
      Body: { isDayComplete? }
POST  /video/data-sheets/:id/entries/bulk
      Body: { entries: [{ cameraPosition, dataGb, notes? }] }
GET   /video/data-sheets/summary?inquiryId=
      Returns: { totalGb, byPosition: [{position, totalGb}], hddRecommendation: "1 TB" }
```

### LED — Stock & Rates
```
GET   /led/stock
POST  /led/stock
      Body: { companyName, ledType, cabinetHeightMm, cabinetWidthMm, cabinetsPerBox, totalCabinets }
      Note: pricingSqft = totalCabinets * 4 (computed server-side)
            totalBoxes = ceil(totalCabinets / cabinetsPerBox) (computed server-side)
PUT   /led/stock/:id
DELETE /led/stock/:id

GET   /led/type-rates
PUT   /led/type-rates/:ledType
      Body: { ratePerSqftPerDay }
```

### LED — Quotation Items
```
GET   /led/quotation-items?quotationId=
POST  /led/quotation-items/bulk
      Body: { quotationId, items: [{ placeName, locationName, ledType, heightFt, widthFt, nos, ratePerSqft, days }] }
      Note: sqftPerDay = heightFt * widthFt * nos (computed server-side)
            totalAmount = sqftPerDay * ratePerSqft * days (computed server-side)
PUT   /led/quotation-items/:id
DELETE /led/quotation-items/:id

GET   /led/quotation-items/sqft-summary?quotationId=
      Returns: {
        perDaySqft: 6300,
        totalDays: 5,
        totalEventSqft: 31500,
        byPlace: [{ placeName, sqft }],
        byType: [{ ledType, sqft }]
      }

POST  /led/calculate-clear-size
      Body: { cabinetHeightMm, cabinetWidthMm, targetHeightFt, targetWidthFt }
      Returns: {
        hCabinets: 4, clearHeightMm: 2304, clearHeightFt: 7.56,
        wCabinets: 7, clearWidthMm: 4032, clearWidthFt: 13.23
      }
```

### LED — Warehouse
```
GET   /led/warehouse/allocations?inquiryId=
POST  /led/warehouse/allocations
      Body: { inquiryId, ledStockId, allocatedSqft }
PUT   /led/warehouse/allocations/:id
DELETE /led/warehouse/allocations/:id

GET   /led/vendor-arrangements?inquiryId=
POST  /led/vendor-arrangements
      Body: { inquiryId, vendorName, vendorId?, ledType, sqftArranged, costRatePerSqftPerDay, days }
DELETE /led/vendor-arrangements/:id

GET   /led/warehouse/coverage?inquiryId=
      Returns: {
        requiredSqft: 6300,
        bkAllocated: 2000,
        vendorArranged: 4300,
        shortfall: 0,
        pandl: {
          clientRevenue: 1575000,
          vendorCost: 752500,
          netMargin: 822500
        }
      }
```

### LED — Screen Status & Issues
```
GET   /led/screen-status?inquiryId=&date=2026-05-15
POST  /led/screen-status/bulk-update
      Body: { inquiryId, date, updates: [{ screenNo, status, notes? }] }

GET   /led/issues?inquiryId=
POST  /led/issues
      Body: { inquiryId, issueText }
PUT   /led/issues/:id/resolve
```

### LED — Dispatch
```
GET   /led/dispatch-boxes?inquiryId=
POST  /led/dispatch-boxes
      Body: { inquiryId, vehicleName, vehicleNumber?, companyName, numBoxes, cabinetsPerBox }
      Note: totalCabinets = numBoxes * cabinetsPerBox (computed server-side)
DELETE /led/dispatch-boxes/:id

GET   /led/dispatch-boxes/summary?inquiryId=
      Returns: {
        totalBoxes: 180,
        totalCabinets: 820,
        byVehicle: [{ vehicleName, boxes, cabinets }],
        byCompany: [{ companyName, boxes, cabinets }]
      }
```

### Staff
```
GET   /staff?dept=VIDEO&type=INHOUSE&search=
POST  /staff
GET   /staff/:id
PUT   /staff/:id
POST  /staff/:id/upload-aadhar
      Body: FormData { front: File, back: File }

GET   /staff/:id/assignments
GET   /staff/:id/payments

GET   /staff/availability?startDate=2026-05-15&endDate=2026-05-20&role=
      Returns: [{
        ...staff,
        status: "AVAILABLE" | "PARTIAL" | "BUSY",
        busyInEvent?: "Event name"
      }]
```

### Staff Assignments
```
GET   /assignments?inquiryId=
POST  /assignments
      Body: { inquiryId, staffId, positionNo?, positionName?, daysAssigned, ratePerDay }
PUT   /assignments/:id
DELETE /assignments/:id
POST  /assignments/:id/mark-paid
      Body: { paymentMethod, notes? }
POST  /assignments/bulk-mark-paid
      Body: { ids: [1,2,3], paymentMethod, notes? }
```

### Invoices & Payments
```
GET   /invoices?inquiryId=
POST  /invoices
      Body: { inquiryId, quotationId, subtotal, cgstAmount, sgstAmount, grossTotal, advanceAmount, dueDate }
GET   /invoices/:id
GET   /invoices/:id/pdf
POST  /invoices/:id/record-payment
      Body: { amount, paymentType, paymentMethod, referenceNo?, notes? }
```

### Expense Reports
```
GET   /expense-reports?inquiryId=
POST  /expense-reports
PUT   /expense-reports/:id
      Body: { transportExpense, foodExpense, miscExpense }
POST  /expense-reports/:id/add-extra
      Body: { name, amount }
DELETE /expense-reports/:id/extra/:extraId
GET   /expense-reports/:id/pdf    // Admin only
POST  /expense-reports/:id/submit
POST  /expense-reports/:id/approve
```

### PDFs (Server-generated)
```
GET   /pdf/quotation/:quotationId
GET   /pdf/invoice/:invoiceId
GET   /pdf/requirements/video/:inquiryId
GET   /pdf/requirements/led/:inquiryId
GET   /pdf/requirements/led-clear-size/:inquiryId
GET   /pdf/dispatch/:inquiryId
GET   /pdf/expense-report/:inquiryId    // Admin only
```

### Dispatch & Vehicles
```
GET   /vehicles
POST  /vehicles
PUT   /vehicles/:id

GET   /dispatch/staff?inquiryId=
POST  /dispatch/staff
      Body: { inquiryId, vehicleId, staffId }
DELETE /dispatch/staff/:id
```

### Availability Dashboard
```
GET   /availability/staff?startDate=&endDate=&role=&dept=
      Returns: [{
        id, name, role, department, staffType, perDayRate,
        status: "AVAILABLE" | "BUSY" | "PARTIAL",
        busyInEvent?: string,
        busyDates?: [{ from, to, event }]
      }]

GET   /availability/led?startDate=&endDate=
      Returns: [{
        id, companyName, ledType, totalSqft, pricingSqft,
        bookedSqft: number,
        availableSqft: number,
        status: "ALL_FREE" | "PARTIAL" | "ALL_BOOKED",
        bookings: [{ event, sqft, from, to }]
      }]

GET   /availability/video-equipment?startDate=&endDate=&category=
      Returns: [{
        id, name, category,
        status: "AVAILABLE" | "IN_USE",
        bookedInEvent?: string,
        booking?: { from, to, event }
      }]

GET   /availability/summary?startDate=&endDate=
      Returns: {
        staffAvailable: 6,
        staffBusy: 2,
        ledFreeSqft: 1300,
        ledBookedSqft: 700,
        videoItemsFree: 5,
        videoItemsBusy: 3
      }
```

### Dashboard
```
GET   /dashboard/overview
GET   /dashboard/upcoming-events?days=30
GET   /dashboard/pending-actions
GET   /dashboard/monthly-pnl?month=2026-05
```

---

## 6. Module Specs — Video Department

### Quotation Number Format
```
Format:   BKM/{FY}/{MM}/{NNN}
Example:  BKM/26-27/05/013
Revision: BKM/26-27/05/013-1

Financial Year: April–March
  month >= 4 → FY = "YY-(YY+1)"   [May 2026 → "26-27"]
  month < 4  → FY = "(YY-1)-YY"   [Feb 2026 → "25-26"]

NNN: Sequential per FY, resets each April 1
```

### Node.js Quotation Number Generator
```javascript
// utils/quotationNumber.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateQuotationNumber(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const fy = date.getMonth() >= 3
    ? `${String(year).slice(2)}-${String(year + 1).slice(2)}`
    : `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
  const fyStart = date.getMonth() >= 3
    ? new Date(year, 3, 1)
    : new Date(year - 1, 3, 1);
  const fyEnd = new Date(fyStart.getFullYear() + 1, 3, 1);
  const count = await prisma.quotation.count({
    where: { createdAt: { gte: fyStart, lt: fyEnd } }
  });
  return `BKM/${fy}/${month}/${String(count + 1).padStart(3, '0')}`;
}

module.exports = { generateQuotationNumber };
```

### Invoice Number Format
```
Format: BKM-INV-{FY}/{MM}/{NNN}
Example: BKM-INV-26-27/05/009
Sequential per financial year, same FY logic as quotation
```

### Quotation PDF Rules (Video)
- Client sees: Position, Equipment description, Days only
- Client does NOT see: rate per day, amount per item
- Client sees only: Subtotal + CGST 9% + SGST 9% + Total

### Invoice Line Items (Video)
```
1. Videography services — [event name] · [venue] · [dates]
2. Photography services — [event name] · [venue] · [dates]
No rates, no item breakdowns shown
```

### Event Data Sheet — HDD Recommendation
```javascript
function recommendHdd(totalGb) {
  if (totalGb > 500) return '2 TB';
  if (totalGb > 200) return '1 TB';
  return '500 GB';
}
```

---

## 7. Module Specs — LED Department

### Pricing Rules
```
Pricing sqft = cabinets × 4         // FIXED — never derive from mm
Client billing = sqft × rate × days
Vendor cost   = sqft × vendorRate × days
1 cabinet = 4 sq.ft (company-agnostic)
```

### LED Type Default Rates
```
P4         = ₹50 / sq.ft / day
P3         = ₹65 / sq.ft / day
P2         = ₹85 / sq.ft / day
Floor Led  = ₹90 / sq.ft / day
P4 Curved  = ₹60 / sq.ft / day
(Editable in led_type_rates table)
```

### Clear Size Formula (Client requirements only — NOT for pricing)
```javascript
// utils/ledClearSize.js
function calculateClearSize(cabinetHeightMm, cabinetWidthMm, targetHeightFt, targetWidthFt) {
  const FT_TO_MM = 304.8;
  const targetHmm = targetHeightFt * FT_TO_MM;
  const targetWmm = targetWidthFt * FT_TO_MM;
  const hCabinets = Math.round(targetHmm / cabinetHeightMm);
  const wCabinets = Math.round(targetWmm / cabinetWidthMm);
  const clearHeightMm = hCabinets * cabinetHeightMm;
  const clearWidthMm  = wCabinets * cabinetWidthMm;
  return {
    hCabinets,
    wCabinets,
    clearHeightMm,
    clearWidthMm,
    clearHeightFt: parseFloat((clearHeightMm / FT_TO_MM).toFixed(2)),
    clearWidthFt:  parseFloat((clearWidthMm  / FT_TO_MM).toFixed(2)),
  };
}
module.exports = { calculateClearSize };

// Example: NVS 576mm, target 8×14 ft
// H: round(8×304.8/576) = round(4.23) = 4 cabs → 4×576 = 2304mm = 7.56ft
// W: round(14×304.8/576) = round(7.40) = 7 cabs → 7×576 = 4032mm = 13.23ft
```

### LED Stock Computed Fields
```javascript
// On create/update led stock:
pricingSqft = totalCabinets * 4
totalBoxes  = Math.ceil(totalCabinets / cabinetsPerBox)
```

### Quotation PDF (LED) — Shows to Client
- Full breakdown: Place, Location, Type, H×W, Nos, Sq.ft, Days, Rate/sq.ft, Amount
- Per day sq.ft + Event days + Total event sq.ft summary strip
- CGST 9% + SGST 9% + Total

### Invoice Line Item (LED)
```
1. LED screen services — [venue(s)] · [dates] · [days]
No sq.ft, no rates, no vendor details shown to client
Terms: Equipment de-installation only after full payment
```

### Warehouse Coverage Calculation
```javascript
function calculateCoverage(requiredSqft, allocations, vendorArrangements) {
  const bkCovered  = allocations.reduce((sum, a) => sum + a.allocatedSqft, 0);
  const vdCovered  = vendorArrangements.reduce((sum, v) => sum + v.sqftArranged, 0);
  const shortfall  = Math.max(0, requiredSqft - bkCovered - vdCovered);
  return { bkCovered, vdCovered, shortfall, covered: bkCovered + vdCovered };
}
```

---

## 8. Availability Dashboard

### Purpose
Shows real-time availability of Staff, LED panels, and Video equipment for any selected date range. Prevents double-booking and helps with planning.

### Staff Availability Logic
```javascript
// services/availability.service.js
async function getStaffAvailability(startDate, endDate, role, dept) {
  const allStaff = await prisma.staff.findMany({
    where: {
      isActive: true,
      ...(role && { role }),
      ...(dept && { department: dept })
    },
    include: {
      assignments: {
        include: { inquiry: { select: { eventName: true, startDate: true, endDate: true } } }
      }
    }
  });

  return allStaff.map(s => {
    const conflicts = s.assignments.filter(a =>
      a.inquiry.startDate <= new Date(endDate) &&
      a.inquiry.endDate   >= new Date(startDate)
    );
    const status = conflicts.length === 0
      ? 'AVAILABLE'
      : conflicts.some(c =>
          c.inquiry.startDate <= new Date(startDate) &&
          c.inquiry.endDate   >= new Date(endDate))
        ? 'BUSY' : 'PARTIAL';
    return {
      ...s,
      status,
      busyInEvent: conflicts[0]?.inquiry.eventName || null,
      busyDates:   conflicts.map(c => ({
        from: c.inquiry.startDate,
        to:   c.inquiry.endDate,
        event: c.inquiry.eventName
      }))
    };
  });
}
```

### LED Panel Availability Logic
```javascript
async function getLedAvailability(startDate, endDate) {
  const stocks = await prisma.ledStock.findMany({
    where: { isActive: true },
    include: {
      allocations: {
        include: { inquiry: { select: { eventName: true, startDate: true, endDate: true } } }
      }
    }
  });

  return stocks.map(l => {
    const activeBookings = l.allocations.filter(a =>
      a.inquiry.startDate <= new Date(endDate) &&
      a.inquiry.endDate   >= new Date(startDate)
    );
    const bookedSqft    = activeBookings.reduce((s, a) => s + a.allocatedSqft, 0);
    const availableSqft = Math.max(0, l.pricingSqft - bookedSqft);
    const status = bookedSqft === 0 ? 'ALL_FREE'
                 : availableSqft === 0 ? 'ALL_BOOKED' : 'PARTIAL';
    return {
      ...l,
      bookedSqft,
      availableSqft,
      status,
      bookings: activeBookings.map(a => ({
        event: a.inquiry.eventName,
        sqft: a.allocatedSqft,
        from: a.inquiry.startDate,
        to:   a.inquiry.endDate
      }))
    };
  });
}
```

### Video Equipment Availability Logic
```javascript
async function getVideoEquipmentAvailability(startDate, endDate, category) {
  const equipment = await prisma.videoEquipment.findMany({
    where: {
      status: { not: 'MAINTENANCE' },
      ...(category && { category })
    },
    include: {
      bookings: {
        include: { inquiry: { select: { eventName: true } } }
      }
    }
  });

  return equipment.map(e => {
    const activeBooking = e.bookings.find(b =>
      b.bookedFrom <= new Date(endDate) &&
      b.bookedTo   >= new Date(startDate) &&
      b.status !== 'RETURNED'
    );
    return {
      ...e,
      status: activeBooking ? 'IN_USE' : 'AVAILABLE',
      bookedInEvent: activeBooking?.inquiry.eventName || null,
      booking: activeBooking
        ? { from: activeBooking.bookedFrom, to: activeBooking.bookedTo, event: activeBooking.inquiry.eventName }
        : null
    };
  });
}
```

---

## 9. Shared Modules

### PDF Documents

| Document | Sent to | Content |
|----------|---------|---------|
| Quotation | Client | Video: desc+total only / LED: full breakdown |
| Requirements list | Client | Staff list + technical requirements |
| LED clear size | Client | Actual mm/ft screen sizes for structure |
| Invoice | Client | Service lines + payment breakdown |
| Expense report | Admin only | Full P&L, internal confidential |
| Dispatch list | Internal | Vehicle + loading details |

### Notification Triggers (In-App)

| Event | Notify |
|-------|--------|
| Quotation approved | Warehouse + dept manager |
| 3 days before event | Dept (product list reminder) |
| 4 days before event end | Accounts (payment reminder) |
| Payment received | Admin + Accounts |
| Staff assigned | That staff member |

### Staff Payment Flow
1. Staff assigned to event
2. Event completes → payment_status = PENDING
3. Accounts marks PAID with method + date
4. Staff yearly earnings auto-update

### GST Calculation
```javascript
function calculateGst(subtotal) {
  const cgst = parseFloat((subtotal * 0.09).toFixed(2));
  const sgst = parseFloat((subtotal * 0.09).toFixed(2));
  const total = parseFloat((subtotal + cgst + sgst).toFixed(2));
  return { cgst, sgst, total };
}
// Intra-state Gujarat: CGST + SGST (not IGST)
```

---

## 10. Business Logic & Calculations

### P&L Calculation
```javascript
function calculatePnL(inquiry, staffAssignments, vendorArrangements, expenseReport) {
  const revenue     = inquiry.quotation.subtotal; // before GST
  const staffCost   = staffAssignments.reduce((s, a) => s + a.totalPayment, 0);
  const vendorCost  = vendorArrangements.reduce((s, v) => s + v.totalCost, 0);
  const otherCost   = (expenseReport?.transportExpense || 0)
                    + (expenseReport?.foodExpense || 0)
                    + (expenseReport?.miscExpense || 0)
                    + (expenseReport?.extraExpenses?.reduce((s, e) => s + e.amount, 0) || 0);
  const totalExpenses = staffCost + vendorCost + otherCost;
  const netProfit     = revenue - totalExpenses;
  const profitMargin  = parseFloat(((netProfit / revenue) * 100).toFixed(2));
  return { revenue, staffCost, vendorCost, otherCost, totalExpenses, netProfit, profitMargin };
}
```

### LED Quotation Total
```javascript
function calcLedItem(heightFt, widthFt, nos, ratePerSqft, days) {
  const sqftPerDay  = heightFt * widthFt * nos;
  const totalAmount = sqftPerDay * ratePerSqft * days;
  return { sqftPerDay, totalAmount };
}
```

---

## 11. UI/UX Requirements

### Tech
- Next.js 14 App Router, TypeScript
- All pages under `/app` directory
- API routes at `/app/api/...` (proxy to Express backend) or direct Express calls

### Route Structure
```
/app
  /dashboard          → Dashboard overview
  /events             → All events list
  /events/[id]        → Event detail
  /inquiries/new      → New inquiry (Video or LED)
  /inquiries/[id]     → Inquiry detail + workflow stepper
  /quotations/[id]    → Quotation view + PDF
  /warehouse
    /video/[inquiryId]  → Video warehouse check
    /led/[inquiryId]    → LED warehouse + vendor
    /led/stock          → LED stock management
  /assignments/[inquiryId]  → Operator assignment
  /dispatch/[inquiryId]     → Dispatch list
  /execution
    /video/[inquiryId]      → Event data sheet
    /led/[inquiryId]        → LED screen status
  /expense-reports/[inquiryId]  → Expense report
  /invoices/[inquiryId]         → Invoice
  /staff                        → Staff list
  /staff/[id]                   → Staff profile
  /availability                 → Availability dashboard
  /settings                     → LED type rates, vehicles
```

### General UX
- Responsive (desktop + mobile)
- Dark/light mode
- Real-time calculations (no page reload)
- Place-group collapsible sections in tables
- Status badges: INQUIRY=gray, SENT=amber, CONFIRMED=green, IN_PROGRESS=blue, COMPLETED=dark green, CANCELLED=red
- All PDFs: preview in modal → download

### Availability Dashboard UX
- Date range picker at top
- Three sections: Staff | LED panels | Video equipment
- Summary metrics auto-update on date change
- Color coding: green = free, red = busy, yellow = partial

---

## 12. Seed Data

### LED Type Rates
```javascript
// prisma/seed.js
const ledRates = [
  { ledType: 'P4',       ratePerSqftPerDay: 50 },
  { ledType: 'P3',       ratePerSqftPerDay: 65 },
  { ledType: 'P2',       ratePerSqftPerDay: 85 },
  { ledType: 'FLOOR_LED',ratePerSqftPerDay: 90 },
  { ledType: 'P4_CURVED',ratePerSqftPerDay: 60 },
];
await prisma.ledTypeRate.createMany({ data: ledRates });
```

### Default Vehicles
```javascript
const vehicles = [
  { name: 'Large Truck 1',    numberPlate: 'GJ-06-AB-0001', vehicleType: 'TRUCK' },
  { name: 'Large Truck 2',    numberPlate: 'GJ-06-AB-0002', vehicleType: 'TRUCK' },
  { name: 'Tempo Traveller',  numberPlate: 'GJ-06-AB-0003', vehicleType: 'TEMPO' },
  { name: 'Management Car',   numberPlate: 'GJ-06-AB-0004', vehicleType: 'CAR' },
];
await prisma.vehicle.createMany({ data: vehicles });
```

### Admin User
```javascript
const bcrypt = require('bcryptjs');
await prisma.user.create({
  data: {
    name: 'Admin',
    email: 'admin@bkmedia.in',
    passwordHash: await bcrypt.hash('admin123', 10),
    role: 'ADMIN',
  }
});
```

---

## 13. Environment Setup

### Backend (Node.js / Express)
```bash
mkdir bk-media-api && cd bk-media-api
npm init -y
npm install express cors helmet morgan
npm install prisma @prisma/client
npm install jsonwebtoken bcryptjs
npm install express-validator multer
npm install puppeteer node-cron
npm install -D typescript ts-node nodemon @types/node @types/express

npx prisma init
npx prisma migrate dev --name init
npx prisma db seed
```

### .env (Backend)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bkmediacrm"
JWT_SECRET="your-256-bit-secret-key-here"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET="your-refresh-secret-here"
REFRESH_TOKEN_EXPIRES_IN="30d"
PORT=5000
UPLOAD_PATH="./uploads"
NODE_ENV="development"
```

### Frontend (Next.js)
```bash
npx create-next-app@latest bk-media-crm --typescript --tailwind --app
cd bk-media-crm
npm install @tanstack/react-query axios
npm install react-hook-form zod @hookform/resolvers
npm install date-fns
npm install zustand
npm install jspdf
```

### .env.local (Frontend)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME="BK Media CRM"
```

### prisma/schema.prisma — datasource
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Express App Structure
```
src/
  app.ts              → Express app setup
  server.ts           → Start server
  routes/
    auth.routes.ts
    clients.routes.ts
    inquiries.routes.ts
    quotations.routes.ts
    video.routes.ts
    led.routes.ts
    staff.routes.ts
    assignments.routes.ts
    invoices.routes.ts
    expense.routes.ts
    availability.routes.ts
    pdf.routes.ts
    dashboard.routes.ts
  controllers/
    (one per route file)
  services/
    availability.service.ts
    quotationNumber.service.ts
    ledClearSize.service.ts
    pdf.service.ts
    gst.service.ts
  middleware/
    auth.middleware.ts
    role.middleware.ts
    upload.middleware.ts
  utils/
    prisma.ts
    jwt.ts
prisma/
  schema.prisma
  seed.ts
uploads/
  aadhar/
  signed-copies/
```

---

*BK Media CRM — Phase 1 Documentation*
*Video Department + LED Department + Availability Dashboard*
*Stack: Next.js + Node.js/Express + PostgreSQL (Prisma)*
