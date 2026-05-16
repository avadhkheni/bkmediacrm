import puppeteer from 'puppeteer';
import { prisma } from '../utils/prisma';

// ─── Helper: Generate PDF from HTML ────────────────────────
async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
  await browser.close();
  return Buffer.from(pdfBuffer);
}

// ─── Shared HTML boilerplate ────────────────────────────────
function baseHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; padding: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; color: #2563eb; }
    .header .meta { text-align: right; font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; font-size: 12px; }
    th { background: #f1f5f9; font-weight: 600; }
    .totals { margin-top: 16px; text-align: right; }
    .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
    .totals .row.bold { font-weight: 700; font-size: 14px; border-top: 2px solid #1a1a1a; padding-top: 8px; margin-top: 4px; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .section-title { font-size: 14px; font-weight: 700; margin: 16px 0 8px; color: #1e40af; }
    .confidential { background: #fef2f2; border: 2px solid #dc2626; padding: 8px; text-align: center; font-weight: 700; color: #dc2626; margin-bottom: 16px; border-radius: 4px; }
  </style>
</head>
<body>
  ${body}
  <div class="footer">BK Media &middot; bkmedia.in &middot; Generated on ${new Date().toLocaleDateString('en-IN')}</div>
</body>
</html>`;
}

// ─── 1. Quotation PDF ──────────────────────────────────────
// Video: Client sees Position, Equipment description, Days only (NO rate, NO amount per item)
// LED: Full breakdown
export async function generateQuotationPdf(quotationId: number): Promise<Buffer> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      inquiry: { include: { client: true } },
      videoQuotationItems: { orderBy: { sortOrder: 'asc' } },
      ledQuotationItems: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!quotation) throw new Error('Quotation not found');

  const dept = quotation.inquiry.department;
  const client = quotation.inquiry.client;
  const qNum = quotation.revisionNumber > 0
    ? `${quotation.quotationNumber}-${quotation.revisionNumber}`
    : quotation.quotationNumber;

  let itemsHtml = '';
  if (dept === 'VIDEO') {
    itemsHtml = `
      <table>
        <thead><tr><th>#</th><th>Place</th><th>Position</th><th>Equipment</th><th>Days</th></tr></thead>
        <tbody>
          ${quotation.videoQuotationItems.map((item, i) => `
            <tr><td>${i + 1}</td><td>${item.placeName}</td><td>${item.position}</td><td>${item.equipmentType}</td><td>${item.days}</td></tr>
          `).join('')}
        </tbody>
      </table>`;
  } else {
    itemsHtml = `
      <table>
        <thead><tr><th>#</th><th>Place</th><th>Location</th><th>Type</th><th>H×W (ft)</th><th>Nos</th><th>Sq.ft/Day</th><th>Days</th><th>Rate/Sq.ft</th><th>Amount</th></tr></thead>
        <tbody>
          ${quotation.ledQuotationItems.map((item, i) => `
            <tr><td>${i + 1}</td><td>${item.placeName}</td><td>${item.locationName}</td><td>${item.ledType}</td>
            <td>${item.heightFt}×${item.widthFt}</td><td>${item.nos}</td><td>${item.sqftPerDay}</td>
            <td>${item.days}</td><td>₹${item.ratePerSqft}</td><td>₹${item.totalAmount}</td></tr>
          `).join('')}
        </tbody>
      </table>`;
  }

  const body = `
    <div class="header">
      <div><h1>Quotation</h1><p style="font-size:13px;color:#555">${qNum}${quotation.status === 'DRAFT' ? ' <span class="badge badge-amber">DRAFT</span>' : ''}</p></div>
      <div class="meta">
        <strong>Date:</strong> ${new Date(quotation.createdAt).toLocaleDateString('en-IN')}<br>
        <strong>Valid for:</strong> ${quotation.validDays} days
      </div>
    </div>
    <table style="border:none;margin-bottom:16px">
      <tr style="border:none"><td style="border:none;width:50%"><strong>Client:</strong><br>${client.name}${client.company ? `<br>${client.company}` : ''}<br>${client.phone}${client.email ? `<br>${client.email}` : ''}</td>
      <td style="border:none;width:50%"><strong>Event:</strong><br>${quotation.inquiry.eventName}<br>${quotation.inquiry.venue}<br>${new Date(quotation.inquiry.startDate).toLocaleDateString('en-IN')} – ${new Date(quotation.inquiry.endDate).toLocaleDateString('en-IN')}</td></tr>
    </table>
    ${itemsHtml}
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>₹${quotation.subtotal}</span></div>
      <div class="row"><span>CGST 9%</span><span>₹${quotation.cgstAmount || 0}</span></div>
      <div class="row"><span>SGST 9%</span><span>₹${quotation.sgstAmount || 0}</span></div>
      <div class="row bold"><span>Total</span><span>₹${quotation.totalAmount}</span></div>
    </div>
    ${quotation.notes ? `<div class="section-title">Notes</div><p>${quotation.notes}</p>` : ''}
  `;
  return htmlToPdf(baseHtml(`Quotation ${qNum}`, body));
}

// ─── 2. Invoice PDF ────────────────────────────────────────
export async function generateInvoicePdf(invoiceId: number): Promise<Buffer> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      quotation: { include: { inquiry: { include: { client: true } }, videoQuotationItems: true, ledQuotationItems: true } },
      payments: true,
    },
  });
  if (!invoice) throw new Error('Invoice not found');

  const client = invoice.quotation.inquiry.client;
  const inq = invoice.quotation.inquiry;
  const totalPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(invoice.grossTotal) - totalPaid;

  let serviceLines = '';
  if (inq.department === 'VIDEO') {
    serviceLines = `<tr><td>1</td><td>Videography & Photography services — ${inq.eventName} · ${inq.venue} · ${new Date(inq.startDate).toLocaleDateString('en-IN')} – ${new Date(inq.endDate).toLocaleDateString('en-IN')}</td><td>${inq.totalDays} days</td></tr>`;
  } else {
    serviceLines = `<tr><td>1</td><td>LED screen services — ${inq.venue} · ${new Date(inq.startDate).toLocaleDateString('en-IN')} – ${new Date(inq.endDate).toLocaleDateString('en-IN')}</td><td>${inq.totalDays} days</td></tr>`;
  }

  const body = `
    <div class="header">
      <div><h1>Invoice</h1><p style="font-size:13px;color:#555">${invoice.invoiceNumber}</p></div>
      <div class="meta">
        <strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}<br>
        <strong>Due:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}<br>
        <strong>Status:</strong> <span class="badge ${invoice.status === 'PAID' ? 'badge-green' : 'badge-amber'}">${invoice.status}</span>
      </div>
    </div>
    <table style="border:none;margin-bottom:16px">
      <tr style="border:none"><td style="border:none;width:50%"><strong>Bill To:</strong><br>${client.name}${client.company ? `<br>${client.company}` : ''}<br>${client.phone}${client.gstNumber ? `<br>GST: ${client.gstNumber}` : ''}</td>
      <td style="border:none;width:50%"><strong>Event:</strong><br>${inq.eventName}<br>${inq.venue}<br>${new Date(inq.startDate).toLocaleDateString('en-IN')} – ${new Date(inq.endDate).toLocaleDateString('en-IN')}</td></tr>
    </table>
    <table>
      <thead><tr><th>#</th><th>Description</th><th>Duration</th></tr></thead>
      <tbody>${serviceLines}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>₹${invoice.subtotal}</span></div>
      <div class="row"><span>CGST 9%</span><span>₹${invoice.cgstAmount || 0}</span></div>
      <div class="row"><span>SGST 9%</span><span>₹${invoice.sgstAmount || 0}</span></div>
      <div class="row bold"><span>Gross Total</span><span>₹${invoice.grossTotal}</span></div>
      <div class="row"><span>Advance Received</span><span>₹${invoice.advanceAmount}</span></div>
      <div class="row bold" style="color:#dc2626"><span>Balance Due</span><span>₹${balance.toFixed(2)}</span></div>
    </div>
    ${invoice.payments.length > 0 ? `
      <div class="section-title">Payment History</div>
      <table>
        <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
        <tbody>${invoice.payments.map(p => `<tr><td>${new Date(p.receivedAt).toLocaleDateString('en-IN')}</td><td>₹${p.amount}</td><td>${p.paymentMethod}</td><td>${p.referenceNo || '-'}</td></tr>`).join('')}</tbody>
      </table>` : ''}
    <p style="margin-top:16px;font-size:11px;color:#666"><em>Terms: Equipment de-installation only after full payment.</em></p>
  `;
  return htmlToPdf(baseHtml(`Invoice ${invoice.invoiceNumber}`, body));
}

// ─── 3. Video Requirements PDF ─────────────────────────────
export async function generateVideoRequirementsPdf(inquiryId: number): Promise<Buffer> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      client: true,
      staffAssignments: { include: { staff: true } },
      videoDataSheets: { include: { entries: true }, orderBy: { dayNumber: 'asc' } },
      videoEventBookings: { include: { equipment: true } },
    },
  });
  if (!inquiry) throw new Error('Inquiry not found');

  const staffRows = inquiry.staffAssignments.map((a, i) =>
    `<tr><td>${i + 1}</td><td>${a.staff.name}</td><td>${a.positionName || '-'}</td><td>${a.daysAssigned}</td></tr>`
  ).join('');

  const equipRows = inquiry.videoEventBookings.map((b, i) =>
    `<tr><td>${i + 1}</td><td>${b.equipment.name}</td><td>${b.equipment.category}</td><td>${b.position || '-'}</td></tr>`
  ).join('');

  const body = `
    <div class="header">
      <div><h1>Video Requirements</h1></div>
      <div class="meta"><strong>Event:</strong> ${inquiry.eventName}<br>${inquiry.venue}<br>${new Date(inquiry.startDate).toLocaleDateString('en-IN')} – ${new Date(inquiry.endDate).toLocaleDateString('en-IN')}</div>
    </div>
    <div class="section-title">Staff Assigned</div>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Position</th><th>Days</th></tr></thead>
      <tbody>${staffRows || '<tr><td colspan="4">No staff assigned</td></tr>'}</tbody>
    </table>
    <div class="section-title">Equipment Required</div>
    <table>
      <thead><tr><th>#</th><th>Equipment</th><th>Category</th><th>Position</th></tr></thead>
      <tbody>${equipRows || '<tr><td colspan="4">No equipment booked</td></tr>'}</tbody>
    </table>
  `;
  return htmlToPdf(baseHtml('Video Requirements', body));
}

// ─── 4. LED Requirements PDF ───────────────────────────────
export async function generateLedRequirementsPdf(inquiryId: number): Promise<Buffer> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      client: true,
      staffAssignments: { include: { staff: true } },
      ledWarehouseAllocations: { include: { ledStock: true } },
      ledVendorArrangements: { include: { vendor: true } },
    },
  });
  if (!inquiry) throw new Error('Inquiry not found');

  const staffRows = inquiry.staffAssignments.map((a, i) =>
    `<tr><td>${i + 1}</td><td>${a.staff.name}</td><td>${a.positionName || '-'}</td><td>${a.daysAssigned}</td></tr>`
  ).join('');

  const allocRows = inquiry.ledWarehouseAllocations.map((a, i) =>
    `<tr><td>${i + 1}</td><td>${a.ledStock.companyName}</td><td>${a.ledStock.ledType}</td><td>${a.allocatedSqft} sq.ft</td><td>${a.confirmed ? '✓' : '✗'}</td></tr>`
  ).join('');

  const vendorRows = inquiry.ledVendorArrangements.map((v, i) =>
    `<tr><td>${i + 1}</td><td>${v.vendorName}</td><td>${v.ledType}</td><td>${v.sqftArranged} sq.ft</td><td>${v.status}</td></tr>`
  ).join('');

  const body = `
    <div class="header">
      <div><h1>LED Requirements</h1></div>
      <div class="meta"><strong>Event:</strong> ${inquiry.eventName}<br>${inquiry.venue}<br>${new Date(inquiry.startDate).toLocaleDateString('en-IN')} – ${new Date(inquiry.endDate).toLocaleDateString('en-IN')}</div>
    </div>
    <div class="section-title">Staff Assigned</div>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Position</th><th>Days</th></tr></thead>
      <tbody>${staffRows || '<tr><td colspan="4">No staff assigned</td></tr>'}</tbody>
    </table>
    <div class="section-title">Warehouse Stock Allocation</div>
    <table>
      <thead><tr><th>#</th><th>Company</th><th>Type</th><th>Sq.ft</th><th>Confirmed</th></tr></thead>
      <tbody>${allocRows || '<tr><td colspan="5">No warehouse allocations</td></tr>'}</tbody>
    </table>
    <div class="section-title">Vendor Arrangements</div>
    <table>
      <thead><tr><th>#</th><th>Vendor</th><th>Type</th><th>Sq.ft</th><th>Status</th></tr></thead>
      <tbody>${vendorRows || '<tr><td colspan="5">No vendor arrangements</td></tr>'}</tbody>
    </table>
  `;
  return htmlToPdf(baseHtml('LED Requirements', body));
}

// ─── 5. LED Clear Size PDF ─────────────────────────────────
export async function generateLedClearSizePdf(inquiryId: number): Promise<Buffer> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      client: true,
      ledWarehouseAllocations: { include: { ledStock: true } },
    },
  });
  if (!inquiry) throw new Error('Inquiry not found');

  // Get quotation items for this inquiry
  const items = await prisma.ledQuotationItem.findMany({
    where: { quotation: { inquiryId } },
    orderBy: { sortOrder: 'asc' },
  });

  const FT_TO_MM = 304.8;
  const allocations = (inquiry as any).ledWarehouseAllocations || [];
  const rows = items.map((item, i) => {
    // Get stock for this LED type to compute clear sizes
    const stock = allocations.find((a: any) => a.ledStock.ledType === item.ledType);
    const cabinetH = stock?.ledStock?.cabinetHeightMm || 0;
    const cabinetW = stock?.ledStock?.cabinetWidthMm || 0;
    const targetHmm = Number(item.heightFt) * FT_TO_MM;
    const targetWmm = Number(item.widthFt) * FT_TO_MM;
    const hCabinets = cabinetH > 0 ? Math.round(targetHmm / cabinetH) : 0;
    const wCabinets = cabinetW > 0 ? Math.round(targetWmm / cabinetW) : 0;
    const clearHmm = hCabinets * cabinetH;
    const clearWmm = wCabinets * cabinetW;
    const clearHft = cabinetH > 0 ? (clearHmm / FT_TO_MM).toFixed(2) : '-';
    const clearWft = cabinetW > 0 ? (clearWmm / FT_TO_MM).toFixed(2) : '-';
    return `<tr><td>${i + 1}</td><td>${item.placeName}</td><td>${item.locationName}</td><td>${item.ledType}</td>
      <td>${item.heightFt}×${item.widthFt}</td><td>${hCabinets}×${wCabinets}</td>
      <td>${clearHmm}×${clearWmm}</td><td>${clearHft}×${clearWft}</td></tr>`;
  }).join('');

  const body = `
    <div class="header">
      <div><h1>LED Clear Size Report</h1></div>
      <div class="meta"><strong>Event:</strong> ${inquiry.eventName}<br>${inquiry.venue}<br>${new Date(inquiry.startDate).toLocaleDateString('en-IN')} – ${new Date(inquiry.endDate).toLocaleDateString('en-IN')}</div>
    </div>
    <p style="margin-bottom:12px;font-size:12px;color:#666">Clear sizes are computed from cabinet dimensions (for structure/construction purposes only, NOT for pricing).</p>
    <table>
      <thead><tr><th>#</th><th>Place</th><th>Location</th><th>Type</th><th>Target H×W (ft)</th><th>Cabinets H×W</th><th>Clear (mm)</th><th>Clear (ft)</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="8">No LED items found</td></tr>'}</tbody>
    </table>
  `;
  return htmlToPdf(baseHtml('LED Clear Size', body));
}

// ─── 6. Dispatch PDF ───────────────────────────────────────
export async function generateDispatchPdf(inquiryId: number): Promise<Buffer> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      client: true,
      dispatchStaffAssignments: { include: { vehicle: true, staff: true } },
      ledDispatchBoxEntries: { orderBy: { id: 'asc' } },
    },
  });
  if (!inquiry) throw new Error('Inquiry not found');

  const staffByVehicle = new Map<string, typeof inquiry.dispatchStaffAssignments>();
  for (const d of inquiry.dispatchStaffAssignments) {
    const key = `${d.vehicle.name} (${d.vehicle.numberPlate})`;
    if (!staffByVehicle.has(key)) staffByVehicle.set(key, []);
    staffByVehicle.get(key)!.push(d);
  }

  let vehicleSections = '';
  for (const [vehicleName, assignments] of staffByVehicle) {
    vehicleSections += `
      <div class="section-title">🚛 ${vehicleName}</div>
      <table>
        <thead><tr><th>#</th><th>Staff Name</th><th>Role</th><th>Phone</th></tr></thead>
        <tbody>${assignments.map((a, i) => `<tr><td>${i + 1}</td><td>${a.staff.name}</td><td>${a.staff.role}</td><td>${a.staff.phone}</td></tr>`).join('')}</tbody>
      </table>`;
  }

  const boxRows = inquiry.ledDispatchBoxEntries.map((b, i) =>
    `<tr><td>${i + 1}</td><td>${b.vehicleName}${b.vehicleNumber ? ` (${b.vehicleNumber})` : ''}</td><td>${b.companyName}</td><td>${b.numBoxes}</td><td>${b.cabinetsPerBox}</td><td>${b.totalCabinets}</td></tr>`
  ).join('');

  const body = `
    <div class="header">
      <div><h1>Dispatch List</h1></div>
      <div class="meta"><strong>Event:</strong> ${inquiry.eventName}<br>${inquiry.venue}<br>${new Date(inquiry.startDate).toLocaleDateString('en-IN')} – ${new Date(inquiry.endDate).toLocaleDateString('en-IN')}</div>
    </div>
    ${vehicleSections || '<p>No vehicle assignments</p>'}
    ${boxRows ? `
      <div class="section-title">LED Loading Details</div>
      <table>
        <thead><tr><th>#</th><th>Vehicle</th><th>Company</th><th>Boxes</th><th>Cabs/Box</th><th>Total Cabinets</th></tr></thead>
        <tbody>${boxRows}</tbody>
      </table>` : ''}
  `;
  return htmlToPdf(baseHtml('Dispatch List', body));
}

// ─── 7. Expense Report PDF (Admin only) ────────────────────
export async function generateExpenseReportPdf(inquiryId: number): Promise<Buffer> {
  const report = await prisma.expenseReport.findUnique({
    where: { inquiryId },
    include: { extraExpenses: true, inquiry: { include: { client: true } } },
  });
  if (!report) throw new Error('Expense report not found');

  const extraRows = report.extraExpenses.map((e, i) =>
    `<tr><td>${i + 1}</td><td>${e.name}</td><td>₹${e.amount}</td></tr>`
  ).join('');

  const body = `
    <div class="confidential">INTERNAL CONFIDENTIAL — ADMIN ONLY</div>
    <div class="header">
      <div><h1>Expense Report — P&L</h1></div>
      <div class="meta"><strong>Event:</strong> ${report.inquiry.eventName}<br>${report.inquiry.venue}<br>
      <strong>Status:</strong> <span class="badge ${report.status === 'APPROVED' ? 'badge-green' : 'badge-amber'}">${report.status}</span></div>
    </div>
    <table>
      <thead><tr><th>Category</th><th>Amount (₹)</th></tr></thead>
      <tbody>
        <tr><td>Staff Cost</td><td>₹${report.totalStaffCost || 0}</td></tr>
        <tr><td>Vendor Cost</td><td>₹${report.totalVendorCost || 0}</td></tr>
        <tr><td>Transport</td><td>₹${report.transportExpense}</td></tr>
        <tr><td>Food</td><td>₹${report.foodExpense}</td></tr>
        <tr><td>Miscellaneous</td><td>₹${report.miscExpense}</td></tr>
        ${extraRows ? `<tr><td colspan="2"><strong>Extra Expenses</strong></td></tr>${extraRows}` : ''}
        <tr style="font-weight:700;border-top:2px solid #1a1a1a"><td>Total Expenses</td><td>₹${report.totalExpenses || 0}</td></tr>
      </tbody>
    </table>
    <div class="totals">
      <div class="row"><span>Client Billing (Subtotal)</span><span>₹${report.clientBilling || 0}</span></div>
      <div class="row"><span>Total Expenses</span><span>₹${report.totalExpenses || 0}</span></div>
      <div class="row bold" style="color:${Number(report.netProfit || 0) >= 0 ? '#166534' : '#dc2626'}"><span>Net Profit</span><span>₹${report.netProfit || 0}</span></div>
      <div class="row"><span>Profit Margin</span><span>${report.profitMargin || 0}%</span></div>
    </div>
  `;
  return htmlToPdf(baseHtml('Expense Report', body));
}
