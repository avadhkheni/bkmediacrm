import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



const COLORS = {
  primary: [26, 35, 126] as [number, number, number],    // Deep Indigo
  secondary: [63, 81, 181] as [number, number, number],  // Indigo
  accent: [255, 87, 34] as [number, number, number],     // Deep Orange
  text: [33, 33, 33] as [number, number, number],        // Dark Grey
  lightText: [117, 117, 117] as [number, number, number], // Medium Grey
  border: [224, 224, 224] as [number, number, number],   // Light Grey
  white: [255, 255, 255] as [number, number, number]
};

const COMPANY_INFO = {
  name: 'BK MEDIA',
  address: 'Shop No. 12, Crystal Plaza, New Link Road, Andheri West, Mumbai - 400053',
  phone: '+91 98200 12345',
  email: 'info@bkmedia.in',
  gstin: '27AABCU1234F1Z5',
};

const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numStr = num.toString();
  if (numStr.length > 9) return 'overflow';
  const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += Number(n[1]) != 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += Number(n[2]) != 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += Number(n[3]) != 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += Number(n[4]) != 0 ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += Number(n[5]) != 0 ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  return str.trim();
};

const formatCurrency = (num: number) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
  return `Rs. ${formatted}`;
};

const drawHeader = (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Header Background Accent
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(COMPANY_INFO.name, 15, 18);

  // Document Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageWidth - 15, 18, { align: 'right' });

  // Company Details (White Text on Primary BG)
  doc.setFontSize(9);
  doc.setTextColor(230, 230, 230);
  doc.text(COMPANY_INFO.address, 15, 26);
  doc.text(`GSTIN: ${COMPANY_INFO.gstin}  |  Phone: ${COMPANY_INFO.phone}  |  Email: ${COMPANY_INFO.email}`, 15, 31);
};

const drawFooter = (doc: jsPDF) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
    
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightText[0], COLORS.lightText[1], COLORS.lightText[2]);
    doc.text('This is a computer generated document. No signature required.', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 12, { align: 'right' });
  }
};

export const generateInquiryPDF = (inquiry: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'INQUIRY DETAILS');

  // Metadata Row
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Inquiry No: ${inquiry.inquiryNumber || `INQ-${inquiry.id}`}`, 15, 50);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 50, { align: 'right' });

  // Two Column Layout for Details
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 55, pageWidth - 15, 55);

  // Column 1: Client Info
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('CLIENT INFORMATION', 15, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Name: ${inquiry.client.name}`, 15, 72);
  doc.text(`Company: ${inquiry.client.company || '-'}`, 15, 78);
  doc.text(`Phone: ${inquiry.client.phone}`, 15, 84);
  doc.text(`Email: ${inquiry.client.email || '-'}`, 15, 90);

  // Column 2: Event Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('EVENT DETAILS', pageWidth / 2 + 5, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Event: ${inquiry.eventName}`, pageWidth / 2 + 5, 72);
  doc.text(`Venue: ${inquiry.venue}`, pageWidth / 2 + 5, 78);
  doc.text(`Start: ${new Date(inquiry.startDate).toLocaleDateString()}`, pageWidth / 2 + 5, 84);
  doc.text(`End: ${new Date(inquiry.endDate).toLocaleDateString()}`, pageWidth / 2 + 5, 90);

  // Special Notes Box
  if (inquiry.specialNotes) {
    const boxY = 100;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, boxY, pageWidth - 30, 20, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('Special Notes:', 20, boxY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    const splitNotes = doc.splitTextToSize(inquiry.specialNotes, pageWidth - 40);
    doc.text(splitNotes, 20, boxY + 13);
  }

  // Quotations Table
  if (inquiry.quotations && inquiry.quotations.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('QUOTATION HISTORY', 15, 135);
    
    const tableData = inquiry.quotations.map((q: any) => [
      q.quotationNumber,
      `Rev ${q.revisionNumber}`,
      new Date(q.createdAt).toLocaleDateString(),
      q.status.replace('_', ' '),
      formatCurrency(q.totalAmount)
    ]);

    autoTable(doc, {
      startY: 140,
      head: [['Number', 'Rev', 'Date', 'Status', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    // Show Latest Quotation Items if any
    const latestQ = inquiry.quotations.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const latestQItems = latestQ?.videoQuotationItems || latestQ?.ledQuotationItems || latestQ?.soundQuotationItems || latestQ?.items;
    if (latestQItems && latestQItems.length > 0) {
      const startY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(11);
      doc.text(`LATEST QUOTATION ITEMS (${latestQ.quotationNumber})`, 15, startY);
      
      const itemData = latestQItems.map((item: any) => [
        item.placeName || '-',
        item.equipmentType || item.ledType || '-',
        item.nos || 1,
        item.days || 1,
        formatCurrency(item.totalAmount)
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [['Place', 'Equipment/LED', 'Qty', 'Days', 'Total']],
        body: itemData,
        theme: 'striped',
        headStyles: { fillColor: COLORS.secondary },
        styles: { fontSize: 8 }
      });
    }
  }

  drawFooter(doc);
  doc.save(`${inquiry.inquiryNumber || `INQ-${inquiry.id}`}.pdf`);
};

export const generateQuotationPDF = (quotation: any, inquiry: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'QUOTATION');

  // Meta info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Quotation No: ${quotation.quotationNumber}`, 15, 50);
  doc.text(`Inquiry No: ${inquiry.inquiryNumber || inquiry.id}`, 15, 56);
  doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, pageWidth - 15, 50, { align: 'right' });

  // Bill To & Venue
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 62, pageWidth - 15, 62);

  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('CLIENT DETAILS', 15, 72);
  doc.text('VENUE & DATES', pageWidth / 2 + 5, 72);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  // Client Info
  doc.text(inquiry.client.name, 15, 79);
  doc.text(inquiry.client.company || '', 15, 84);
  doc.text(inquiry.client.phone, 15, 89);

  // Event Info
  doc.text(`Event: ${inquiry.eventName}`, pageWidth / 2 + 5, 79);
  doc.text(`Venue: ${inquiry.venue}`, pageWidth / 2 + 5, 84);
  doc.text(`Duration: ${new Date(inquiry.startDate).toLocaleDateString()} - ${new Date(inquiry.endDate).toLocaleDateString()}`, pageWidth / 2 + 5, 89);

  // Items Table
  const videoItems = (quotation.videoQuotationItems || []).map((it: any) => ({ ...it, category: 'VIDEO' }));
  const ledItems = (quotation.ledQuotationItems || []).map((it: any) => ({ ...it, category: 'LED' }));
  const soundItems = (quotation.soundQuotationItems || []).map((it: any) => ({ ...it, category: 'SOUND' }));
  const officeItems = (quotation.officeQuotationItems || []).map((it: any) => ({ ...it, category: 'OFFICE' }));
  
  const allItems = [...videoItems, ...ledItems, ...soundItems, ...officeItems];

  const itemSourceLabel = (item: any) => {
    const label = item.equipmentType || item.ledType || item.serviceName || '';
    if (label.startsWith('[VENDOR:')) return 'Vendor';
    return 'In-house';
  };

  if (allItems.length > 0) {
    const head = [['Source', 'Place/Service', 'Details', 'Qty', 'Days', 'Rate', 'Total']];

    const tableData = allItems.map((item: any) => {
      const source = itemSourceLabel(item);
      if (item.category === 'VIDEO' || item.category === 'SOUND') {
        return [
          source,
          item.placeName || '-',
          item.equipmentType || 'Service',
          Number(item.nos || 1),
          Number(item.days || 1),
          formatCurrency(Number(item.ratePerDay || 0)),
          formatCurrency(Number(item.totalAmount || 0))
        ];
      } else if (item.category === 'LED') {
        return [
          source,
          item.placeName || '-',
          `${item.ledType || 'LED'} (${item.widthFt}x${item.heightFt} ft)`,
          Number(item.nos || 1),
          Number(item.days || 1),
          `${formatCurrency(Number(item.ratePerSqft || 0))}/sqft`,
          formatCurrency(Number(item.totalAmount || 0))
        ];
      } else {
        // OFFICE
        return [
          source,
          item.placeName || item.serviceName || 'Service',
          item.description || '-',
          Number(item.quantity || 1),
          Number(item.days || 1),
          formatCurrency(Number(item.rate || 0)),
          formatCurrency(Number(item.totalAmount || 0))
        ];
      }
    });

    autoTable(doc, {
      startY: 100,
      head: head,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.secondary, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        [head[0].length - 1]: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  // Summary
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 100;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 70, finalY);
  doc.text(formatCurrency(quotation.subtotal || quotation.totalAmount), pageWidth - 15, finalY, { align: 'right' });

  doc.text(`GST (${quotation.gstRate}%):`, pageWidth - 70, finalY + 6);
  const gstAmount = (quotation.subtotal || quotation.totalAmount) * (quotation.gstRate / 100);
  doc.text(formatCurrency(gstAmount), pageWidth - 15, finalY + 6, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('GRAND TOTAL:', pageWidth - 70, finalY + 16);
  doc.text(formatCurrency(quotation.totalAmount), pageWidth - 15, finalY + 16, { align: 'right' });

  // Custom Notes (hide internal sourcing log line from client PDF)
  const notesY = finalY + 30;
  const clientNotes = (quotation.notes || '')
    .split('\n')
    .filter((line: string) => !line.trim().startsWith('[SOURCING]'))
    .join('\n')
    .trim();
  if (clientNotes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION NOTES:', 15, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(clientNotes, pageWidth - 30);
    doc.text(splitNotes, 15, notesY + 6);
  }

  // Terms & Conditions
  const tncY = quotation.notes ? notesY + 25 : finalY + 30;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & CONDITIONS:', 15, tncY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.lightText[0], COLORS.lightText[1], COLORS.lightText[2]);
  const terms = [
    '1. 50% advance payment required for booking confirmation.',
    '2. Remaining 50% payment to be made before the event setup.',
    '3. Transport and loading charges extra as per actuals if not mentioned above.',
    '4. Any damage to equipment during the event will be charged to the client.',
    '5. Taxes as applicable.'
  ];
  terms.forEach((term, i) => {
    doc.text(term, 15, tncY + 6 + (i * 4));
  });

  drawFooter(doc);
  doc.save(`${quotation.quotationNumber}.pdf`);
};

export const generateInvoicePDF = (invoice: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'TAX INVOICE');

  // Meta info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Invoice No: ${invoice?.invoiceNumber || 'N/A'}`, 15, 50);
  doc.text(`Inquiry No: ${invoice?.inquiry?.inquiryNumber || invoice?.quotation?.inquiry?.inquiryNumber || 'N/A'}`, 15, 56);
  doc.text(`Date: ${invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, pageWidth - 15, 50, { align: 'right' });

  // Bill To & Venue Details
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 62, pageWidth - 15, 62);

  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('BILL TO', 15, 72);
  doc.text('EVENT & VENUE', pageWidth / 2 + 5, 72);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  // Client Info
  doc.text(invoice?.inquiry?.client?.name || invoice?.quotation?.inquiry?.client?.name || 'N/A', 15, 79);
  doc.text(invoice?.inquiry?.client?.company || invoice?.quotation?.inquiry?.client?.company || '', 15, 84);
  doc.text(`GSTIN: ${invoice?.inquiry?.client?.gstNumber || invoice?.quotation?.inquiry?.client?.gstNumber || 'N/A'}`, 15, 89);
  doc.text(`Phone: ${invoice?.inquiry?.client?.phone || invoice?.quotation?.inquiry?.client?.phone || 'N/A'}`, 15, 94);

  // Event Info
  doc.text(`Event: ${invoice?.inquiry?.eventName || invoice?.quotation?.inquiry?.eventName || 'N/A'}`, pageWidth / 2 + 5, 79);
  doc.text(`Venue: ${invoice?.inquiry?.venue || invoice?.quotation?.inquiry?.venue || '-'}`, pageWidth / 2 + 5, 84);
  doc.text(`Period: ${invoice?.inquiry?.startDate ? new Date(invoice.inquiry.startDate).toLocaleDateString() : 'N/A'} to ${invoice?.inquiry?.endDate ? new Date(invoice.inquiry.endDate).toLocaleDateString() : 'N/A'}`, pageWidth / 2 + 5, 89);

  // Items Table
  const videoItems = (invoice?.quotation?.videoQuotationItems || []).map((it: any) => ({ ...it, category: 'VIDEO' }));
  const ledItems = (invoice?.quotation?.ledQuotationItems || []).map((it: any) => ({ ...it, category: 'LED' }));
  const soundItems = (invoice?.quotation?.soundQuotationItems || []).map((it: any) => ({ ...it, category: 'SOUND' }));
  const officeItems = (invoice?.quotation?.officeQuotationItems || []).map((it: any) => ({ ...it, category: 'OFFICE' }));
  
  const allItems = [...videoItems, ...ledItems, ...soundItems, ...officeItems];

  if (allItems.length > 0) {
    const head = [['Place/Service', 'Details', 'HSN/SAC', 'Qty', 'Days', 'Rate', 'Total']];

    const tableData = allItems.map((item: any) => {
      if (item.category === 'VIDEO' || item.category === 'SOUND') {
        return [
          item.placeName || '-',
          item.equipmentType || 'Service',
          '9987',
          Number(item.nos || 1),
          Number(item.days || 1),
          formatCurrency(Number(item.ratePerDay || 0)),
          formatCurrency(Number(item.totalAmount || 0))
        ];
      } else if (item.category === 'LED') {
        return [
          item.placeName || '-',
          `${item.ledType || 'LED'} (${item.widthFt}x${item.heightFt} ft)`,
          '9987',
          Number(item.nos || 1),
          Number(item.days || 1),
          `${formatCurrency(Number(item.ratePerSqft || 0))}/sqft`,
          formatCurrency(Number(item.totalAmount || 0))
        ];
      } else {
        // OFFICE
        return [
          item.placeName || item.serviceName || 'Service',
          item.description || '-',
          '9987',
          Number(item.quantity || 1),
          Number(item.days || 1),
          formatCurrency(Number(item.rate || 0)),
          formatCurrency(Number(item.totalAmount || 0))
        ];
      }
    });

    autoTable(doc, {
      startY: 105,
      head: head,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        [head[0].length - 1]: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  // Summary & Totals
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 105;
  const summaryX = pageWidth - 80;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  doc.text('Subtotal:', summaryX, finalY);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 15, finalY, { align: 'right' });

  doc.text(`CGST (9%):`, summaryX, finalY + 6);
  doc.text(formatCurrency(invoice.cgstAmount), pageWidth - 15, finalY + 6, { align: 'right' });

  doc.text(`SGST (9%):`, summaryX, finalY + 12);
  doc.text(formatCurrency(invoice.sgstAmount), pageWidth - 15, finalY + 12, { align: 'right' });

  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(summaryX, finalY + 16, pageWidth - 15, finalY + 16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('TOTAL AMOUNT:', summaryX, finalY + 22);
  doc.text(formatCurrency(invoice.grossTotal), pageWidth - 15, finalY + 22, { align: 'right' });

  // Add payments summary
  const totalPaid = (invoice.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const balanceDue = Math.max(0, Number(invoice.grossTotal) - totalPaid);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 197, 94); // emerald-500 for total paid
  doc.text('Total Paid to Date:', summaryX, finalY + 28);
  doc.text(formatCurrency(totalPaid), pageWidth - 15, finalY + 28, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11); // amber-500 for balance due
  doc.text('BALANCE DUE:', summaryX, finalY + 34);
  doc.text(formatCurrency(balanceDue), pageWidth - 15, finalY + 34, { align: 'right' });

  // Amount in Words
  const amountInWords = `Rupees ${numberToWords(Number(invoice.grossTotal))} Only`;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  const splitAmount = doc.splitTextToSize(`Amount in Words: ${amountInWords}`, pageWidth - summaryX - 15);
  doc.text(splitAmount, 15, finalY + 38);

  let currentY = finalY + 50;

  // Payments receipt log table
  const payments = invoice.payments || [];
  if (payments.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('PAYMENT HISTORY & RECEIPTS:', 15, currentY);
    
    const pHead = [['Receipt Date', 'Payment Method', 'Reference / Txn ID', 'Amount Paid']];
    const pBody = payments.map((p: any) => [
      new Date(p.createdAt).toLocaleDateString(),
      p.paymentMethod,
      p.referenceNo || '-',
      formatCurrency(Number(p.amount))
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: pHead,
      body: pBody,
      theme: 'striped',
      headStyles: { fillColor: [100, 116, 139], fontStyle: 'bold' }, // slate-500
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' }
      }
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : currentY + 30;
  }

  // Bank Details
  const bankY = currentY;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text('BANK DETAILS:', 15, bankY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Bank Name: HDFC Bank Ltd', 15, bankY + 7);
  doc.text('A/c Name: BK MEDIA', 15, bankY + 13);
  doc.text('A/c No: 50200012345678', 15, bankY + 19);
  doc.text('IFSC: HDFC0001234', 15, bankY + 25);

  // Authorized Signatory
  doc.setFont('helvetica', 'bold');
  doc.text('For BK MEDIA', pageWidth - 15, bankY + 10, { align: 'right' });
  doc.line(pageWidth - 60, bankY + 35, pageWidth - 15, bankY + 35);
  doc.setFontSize(8);
  doc.text('Authorized Signatory', pageWidth - 15, bankY + 40, { align: 'right' });

  drawFooter(doc);
  doc.save(`${invoice.invoiceNumber}.pdf`);
};

// ─── REPORT GENERATION FUNCTIONS ─────────────────────────

export const generateInquiryReportPDF = (stats: any, filters: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'INQUIRY ANALYTICS REPORT');

  // Metadata Row
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  const start = filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'All Time';
  const end = filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'Present';
  doc.text(`Period: ${start} - ${end}`, 15, 50);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 50, { align: 'right' });

  // Filters display
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.lightText[0], COLORS.lightText[1], COLORS.lightText[2]);
  const activeFilters = [];
  if (filters.status) activeFilters.push(`Status: ${filters.status}`);
  if (filters.dept) activeFilters.push(`Dept: ${filters.dept}`);
  if (filters.source) activeFilters.push(`Source: ${filters.source}`);
  if (filters.priority) activeFilters.push(`Priority: ${filters.priority}`);
  doc.text(activeFilters.length > 0 ? `Filters Applied: ${activeFilters.join(', ')}` : 'Filters Applied: None', 15, 55);

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 58, pageWidth - 15, 58);

  // Summary Metrics Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('PERFORMANCE SUMMARY', 15, 68);

  const metricsHead = [['Metric', 'Value']];
  const metricsBody = [
    ['Total Inquiries', String(stats?.totalInquiries || 0)],
    ['Approved Inquiries', String(stats?.approvedInquiries || 0)],
    ['Pending Inquiries', String(stats?.pendingInquiries || 0)],
    ['Rejected Inquiries', String(stats?.rejectedInquiries || 0)],
    ['Conversion Rate', `${stats?.conversionRate || 0}%`],
    ['Inquiries This Month', String(stats?.monthInquiries || 0)]
  ];

  autoTable(doc, {
    startY: 72,
    head: metricsHead,
    body: metricsBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.secondary },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  });

  const finalY1 = (doc as any).lastAutoTable.finalY + 12;

  // Recent Inquiries
  if (stats?.recentInquiries && stats.recentInquiries.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('RECENT INQUIRIES', 15, finalY1);

    const inqHead = [['Inquiry No', 'Client Name', 'Event Name', 'Venue', 'Status', 'Days', 'Period']];
    const inqBody = stats.recentInquiries.map((inq: any) => [
      inq.inquiryNumber || `INQ-${inq.id}`,
      inq.client?.name || '-',
      inq.eventName || '-',
      inq.venue || '-',
      inq.status || '-',
      String(inq.totalDays || 0),
      `${new Date(inq.startDate).toLocaleDateString()} - ${new Date(inq.endDate).toLocaleDateString()}`
    ]);

    autoTable(doc, {
      startY: finalY1 + 4,
      head: inqHead,
      body: inqBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });
  }

  drawFooter(doc);
  doc.save(`Inquiry_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateClientReportPDF = (data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'CLIENT ANALYTICS REPORT');

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 50);

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 54, pageWidth - 15, 54);

  // Summary Metrics Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('CLIENT OVERVIEW', 15, 64);

  const metricsHead = [['Metric', 'Value']];
  const metricsBody = [
    ['Total Registered Clients', String(data?.totalClients || 0)],
    ['New Clients This Month', String(data?.newThisMonth || 0)],
    ['New Clients Today', String(data?.newToday || 0)],
    ['Corporate Clients (With Company)', String(data?.withCompany || 0)],
    ['GST Registered Clients', String(data?.withGst || 0)]
  ];

  autoTable(doc, {
    startY: 68,
    head: metricsHead,
    body: metricsBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.secondary },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  });

  const finalY1 = (doc as any).lastAutoTable.finalY + 12;

  // Top Clients
  if (data?.topClients && data.topClients.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('TOP CLIENTS BY INQUIRY VOLUME', 15, finalY1);

    const clientHead = [['Client Name', 'Company', 'Inquiries Registered']];
    const clientBody = data.topClients.map((c: any) => [
      c.name || '-',
      c.company || '-',
      String(c.inquiries || 0)
    ]);

    autoTable(doc, {
      startY: finalY1 + 4,
      head: clientHead,
      body: clientBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });
  }

  drawFooter(doc);
  doc.save(`Client_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateAvailabilityReportPDF = (data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'RESOURCE AVAILABILITY & UTILIZATION');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 50);

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 54, pageWidth - 15, 54);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('CURRENT UTILIZATION METRICS', 15, 64);

  const tableHead = [['Resource Category', 'Available / Free', 'Total Assets', 'Utilization Rate']];
  const tableBody = [
    ['Staff Members', `${data.staff.available} / ${data.staff.total}`, String(data.staff.total), `${data.staff.utilization}%`],
    ['LED Screen SqFt', `${data.led.freeSqft} SqFt / ${data.led.freeSqft + data.led.bookedSqft} SqFt`, `${data.led.freeSqft + data.led.bookedSqft} SqFt`, `${data.led.utilization}%`],
    ['Video Equipment', `${data.video.free} / ${data.video.total}`, String(data.video.total), `${data.video.utilization}%`]
  ];

  autoTable(doc, {
    startY: 68,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  });

  drawFooter(doc);
  doc.save(`Resource_Availability_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateVideoReportPDF = (data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'VIDEO DEPARTMENT ASSETS REPORT');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 50);

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 54, pageWidth - 15, 54);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('ASSETS SUMMARY', 15, 64);

  const summaryHead = [['Metric', 'Value']];
  const summaryBody = [
    ['Total Equipment Count', String(data.totalEquipment)],
    ['Active Bookings', String(data.activeBookings)]
  ];

  autoTable(doc, {
    startY: 68,
    head: summaryHead,
    body: summaryBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.secondary },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // By Category
  if (data.byCategory && data.byCategory.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('EQUIPMENT BY CATEGORY', 15, currentY);

    const catHead = [['Category', 'Count']];
    const catBody = data.byCategory.map((c: any) => [c.name, String(c.value)]);

    autoTable(doc, {
      startY: currentY + 4,
      head: catHead,
      body: catBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Most Booked
  if (data.mostBooked && data.mostBooked.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('MOST BOOKED EQUIPMENT', 15, currentY);

    const bookedHead = [['Equipment Name', 'Total Bookings']];
    const bookedBody = data.mostBooked.map((m: any) => [m.name, String(m.bookings)]);

    autoTable(doc, {
      startY: currentY + 4,
      head: bookedHead,
      body: bookedBody,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // Green
      styles: { fontSize: 8, cellPadding: 2 }
    });
  }

  drawFooter(doc);
  doc.save(`Video_Department_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateLedReportPDF = (data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'LED DEPARTMENT ASSETS REPORT');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 50);

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 54, pageWidth - 15, 54);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('STOCK & BOOKING SUMMARY', 15, 64);

  const summaryHead = [['Metric', 'Value']];
  const summaryBody = [
    ['Total LED Stock Entries', String(data.totalEntries)],
    ['Total LED Cabinets', String(data.totalCabinets)],
    ['Total LED Flight Boxes', String(data.totalBoxes)],
    ['Active LED Allocations', String(data.activeAllocations)]
  ];

  autoTable(doc, {
    startY: 68,
    head: summaryHead,
    body: summaryBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.secondary },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // By LED Type
  if (data.byType && data.byType.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('STOCK BY LED TYPE / PIXEL PITCH', 15, currentY);

    const typeHead = [['LED Type', 'Count']];
    const typeBody = data.byType.map((t: any) => [t.name, String(t.value)]);

    autoTable(doc, {
      startY: currentY + 4,
      head: typeHead,
      body: typeBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 8, cellPadding: 2 }
    });
  }

  drawFooter(doc);
  doc.save(`LED_Department_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateStaffReportPDF = (data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'STAFF & USER DIRECTORY REPORT');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 50);

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 54, pageWidth - 15, 54);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('STAFFING OVERVIEW', 15, 64);

  const summaryHead = [['Metric', 'Value']];
  const summaryBody = [
    ['Total Registered Staff', String(data.totalStaff)],
    ['Total System Users', String(data.totalUsers)],
    ['Average Staff Day Rate', formatCurrency(Number(data.avgRatePerDay))]
  ];

  autoTable(doc, {
    startY: 68,
    head: summaryHead,
    body: summaryBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.secondary },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // By Role
  if (data.byRole && data.byRole.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('STAFF BY ROLE', 15, currentY);

    const roleHead = [['Role Name', 'Staff Count']];
    const roleBody = data.byRole.map((r: any) => [r.name, String(r.value)]);

    autoTable(doc, {
      startY: currentY + 4,
      head: roleHead,
      body: roleBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Most Assigned Staff
  if (data.mostAssigned && data.mostAssigned.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('MOST ASSIGNED STAFF MEMBERS', 15, currentY);

    const staffHead = [['Staff Name', 'Total Assignments']];
    const staffBody = data.mostAssigned.map((s: any) => [s.name, String(s.assignments)]);

    autoTable(doc, {
      startY: currentY + 4,
      head: staffHead,
      body: staffBody,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // Green
      styles: { fontSize: 8, cellPadding: 2 }
    });
  }

  drawFooter(doc);
  doc.save(`Staff_Directory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateStaffYearlyHistoryPDF = (historyData: any, selectedYear: number) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'STAFF YEARLY PERFORMANCE HISTORY');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Staff Name: ${historyData.staffName}`, 15, 50);
  doc.text(`Year Analyzed: ${selectedYear}`, 15, 56);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 50, { align: 'right' });

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 62, pageWidth - 15, 62);

  // Summary Metrics Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('ANNUAL STATISTICS SUMMARY', 15, 72);

  const metricsHead = [['Metric', 'Value']];
  const metricsBody = [
    ['Total Events Assigned', String(historyData.summary.totalEvents)],
    ['Total Work Days', String(historyData.summary.totalDays)],
    ['Total Earnings Payout', formatCurrency(Number(historyData.summary.totalEarnings))]
  ];

  autoTable(doc, {
    startY: 76,
    head: metricsHead,
    body: metricsBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.secondary },
    styles: { fontSize: 9, cellPadding: 3.5 },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // Monthly Breakdown
  if (historyData.monthlyBreakdown && historyData.monthlyBreakdown.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('MONTHLY BREAKDOWN', 15, currentY);

    const mHead = [['Month', 'Assigned Events', 'Working Days', 'Earnings']];
    const mBody = historyData.monthlyBreakdown.map((m: any) => [
      m.month,
      String(m.events),
      String(m.days),
      formatCurrency(Number(m.earnings))
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: mHead,
      body: mBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Detailed Event Log
  if (historyData.events && historyData.events.length > 0) {
    // Add page if it runs out of space
    if (currentY > doc.internal.pageSize.height - 80) {
      doc.addPage();
      currentY = 50; // top after header
      // Draw header on new page
      drawHeader(doc, 'STAFF YEARLY PERFORMANCE HISTORY');
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('DETAILED EVENT LOG', 15, currentY);

    const logHead = [['Event Name', 'Inquiry Number', 'Period / Dates', 'Work Days', 'Earnings']];
    const logBody = historyData.events.map((e: any) => [
      e.eventName || '-',
      e.inquiryNumber || '-',
      `${new Date(e.startDate).toLocaleDateString()} - ${new Date(e.endDate).toLocaleDateString()}`,
      `${e.days} Days`,
      formatCurrency(Number(e.earnings))
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: logHead,
      body: logBody,
      theme: 'grid',
      headStyles: { fillColor: [100, 116, 139] }, // slate
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  drawFooter(doc);
  doc.save(`${historyData.staffName.replace(/\s+/g, '_')}_${selectedYear}_Performance_History.pdf`);
};

export const generateProfitabilityReportPDF = (data: any, filters: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'PROFITABILITY & FINANCIALS REPORT');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  const start = filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Start';
  const end = filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'End';
  doc.text(`Period: ${start} - ${end}`, 15, 50);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 50, { align: 'right' });

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 54, pageWidth - 15, 54);

  // Financial Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('FINANCIAL SUMMARY', 15, 64);

  const summaryHead = [['Key Financial Indicator', 'Amount / Rate']];
  const summaryBody = [
    ['Total Revenue', formatCurrency(Number(data.summary.totalRevenue))],
    ['Total Expenses', formatCurrency(Number(data.summary.totalExpense))],
    ['Net Profit', formatCurrency(Number(data.summary.totalProfit))],
    ['Average Profit Margin', `${data.summary.avgMargin.toFixed(2)}%`]
  ];

  autoTable(doc, {
    startY: 68,
    head: summaryHead,
    body: summaryBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.secondary },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { fontStyle: 'bold', halign: 'right' }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // Monthly breakdown
  if (data.chartData && data.chartData.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('MONTHLY FINANCIAL PERFORMANCE', 15, currentY);

    const chartHead = [['Month', 'Revenue', 'Expense', 'Net Profit']];
    const chartBody = data.chartData.map((d: any) => [
      d.name,
      formatCurrency(Number(d.revenue)),
      formatCurrency(Number(d.expense)),
      formatCurrency(Number(d.profit))
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: chartHead,
      body: chartBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  drawFooter(doc);
  doc.save(`Profitability_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateClientProfilePDF = (client: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  drawHeader(doc, 'CLIENT PROFILE');

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Client ID: CLT-${client.id}`, 15, 50);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 15, 50, { align: 'right' });

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(15, 55, pageWidth - 15, 55);

  // Personal Details
  let y = 65;
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('CLIENT INFORMATION', 15, y);
  y += 8;

  const details = [
    ['Name', client.name || '-'],
    ['Contact Person', client.contactPerson || client.name || '-'],
    ['Company', client.company || 'No Company Specified'],
    ['Phone', client.phone || '-'],
    ['Email', client.email || 'N/A'],
    ['Address', client.address || 'No address provided'],
    ['GST Number', client.gstNumber || 'Unregistered'],
    ['Client Since', client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '-'],
    ['Total Inquiries', String(client.inquiries?.length || 0)],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: details,
    theme: 'grid',
    headStyles: { fillColor: COLORS.secondary },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
  });

  // Inquiries Section
  const afterTable = (doc as any).lastAutoTable.finalY + 10;
  if (client.inquiries && client.inquiries.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('RECENT INQUIRIES', 15, afterTable);

    const inqHead = [['Event Name', 'Start Date', 'Status']];
    const inqBody = client.inquiries.map((inq: any) => [
      inq.eventName || '-',
      inq.startDate ? new Date(inq.startDate).toLocaleDateString('en-IN') : '-',
      inq.status || '-',
    ]);

    autoTable(doc, {
      startY: afterTable + 4,
      head: inqHead,
      body: inqBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      styles: { fontSize: 8, cellPadding: 2.5 },
    });
  }

  drawFooter(doc);
  doc.save(`Client_Profile_${client.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

