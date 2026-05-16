import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



const COLORS = {
  primary: [26, 35, 126],    // Deep Indigo
  secondary: [63, 81, 181],  // Indigo
  accent: [255, 87, 34],     // Deep Orange
  text: [33, 33, 33],        // Dark Grey
  lightText: [117, 117, 117], // Medium Grey
  border: [224, 224, 224],   // Light Grey
  white: [255, 255, 255]
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

  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += Number(n[1]) != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += Number(n[2]) != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += Number(n[3]) != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += Number(n[4]) != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += Number(n[5]) != 0 ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
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

  if (allItems.length > 0) {
    const head = [['Place/Service', 'Details', 'Qty', 'Days', 'Rate', 'Total']];

    const tableData = allItems.map((item: any) => {
      if (item.category === 'VIDEO' || item.category === 'SOUND') {
        return [
          item.placeName || '-',
          item.equipmentType || 'Service',
          Number(item.nos || 1),
          Number(item.days || 1),
          formatCurrency(Number(item.ratePerDay || 0)),
          formatCurrency(Number(item.totalAmount || 0))
        ];
      } else if (item.category === 'LED') {
        return [
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

  // Custom Notes
  const notesY = finalY + 30;
  if (quotation.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION NOTES:', 15, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(quotation.notes, pageWidth - 30);
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

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text('TOTAL AMOUNT:', summaryX, finalY + 23);
  doc.text(formatCurrency(invoice.grossTotal), pageWidth - 15, finalY + 23, { align: 'right' });

  // Amount in Words
  const amountInWords = `Rupees ${numberToWords(Number(invoice.grossTotal))} Only`;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  const splitAmount = doc.splitTextToSize(`Amount in Words: ${amountInWords}`, pageWidth - summaryX - 15);
  doc.text(splitAmount, 15, finalY + 28);

  // Bank Details
  const bankY = finalY + 45;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BANK DETAILS:', 15, bankY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
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
