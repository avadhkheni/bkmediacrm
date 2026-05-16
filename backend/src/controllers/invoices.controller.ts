import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Invoice number format: BKM-INV-{FY}/{MM}/{NNN}
async function generateInvoiceNumber(date: Date = new Date()): Promise<string> {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const isAfterMarch = date.getMonth() >= 3;
  const fy = isAfterMarch
    ? `${String(year).slice(2)}-${String(year + 1).slice(2)}`
    : `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
  const fyStart = isAfterMarch ? new Date(year, 3, 1) : new Date(year - 1, 3, 1);
  const fyEnd = new Date(fyStart.getFullYear() + 1, 3, 1);
  const count = await prisma.invoice.count({
    where: { createdAt: { gte: fyStart, lt: fyEnd } }
  });
  return `BKM-INV-${fy}/${month}/${String(count + 1).padStart(3, '0')}`;
}

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const whereClause: any = {};
    if (inquiryId) whereClause.inquiryId = Number(inquiryId);
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: { quotation: { select: { quotationNumber: true } }, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { inquiryId, quotationId, subtotal, advanceAmount, dueDate } = req.body;

    // --- Validation ---
    if (!quotationId) return res.status(400).json({ message: 'quotationId is required' });
    if (!inquiryId) return res.status(400).json({ message: 'inquiryId is required' });
    if (!subtotal || Number(subtotal) <= 0) return res.status(400).json({ message: 'subtotal must be greater than 0' });

    // Verify quotation exists and is APPROVED
    const quotation = await prisma.quotation.findUnique({
      where: { id: Number(quotationId) },
      include: { invoice: true }
    });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    if (quotation.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Invoice can only be created for APPROVED quotations' });
    }
    if (quotation.invoice) {
      return res.status(409).json({ message: 'An invoice already exists for this quotation' });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const cgstAmount = parseFloat((Number(subtotal) * 0.09).toFixed(2));
    const sgstAmount = parseFloat((Number(subtotal) * 0.09).toFixed(2));
    const grossTotal = parseFloat((Number(subtotal) + cgstAmount + sgstAmount).toFixed(2));
    const balanceAmount = parseFloat((grossTotal - Number(advanceAmount || 0)).toFixed(2));

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        quotationId: Number(quotationId),
        inquiryId: Number(inquiryId),
        subtotal: Number(subtotal),
        cgstAmount,
        sgstAmount,
        grossTotal,
        advanceAmount: Number(advanceAmount || 0),
        balanceAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: req.user?.userId,
      },
    });
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Error creating invoice' });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: { 
        quotation: {
          include: {
            videoQuotationItems: true,
            ledQuotationItems: true
          }
        }, 
        inquiry: { include: { client: true } }, 
        payments: true 
      },
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice' });
  }
};

export const recordPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentType, paymentMethod, referenceNo, notes } = req.body;

    // --- Validation ---
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    if (!paymentType) return res.status(400).json({ message: 'paymentType is required' });
    if (!paymentMethod) return res.status(400).json({ message: 'paymentMethod is required' });

    const existingInvoice = await prisma.invoice.findUnique({ where: { id: Number(id) } });
    if (!existingInvoice) return res.status(404).json({ message: 'Invoice not found' });

    const payment = await prisma.payment.create({
      data: {
        invoiceId: Number(id),
        amount: Number(amount),
        paymentType,
        paymentMethod,
        referenceNo: referenceNo || null,
        receivedById: req.user?.userId,
        notes: notes || null,
      },
    });

    // Update invoice status
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: { payments: true },
    });
    if (updatedInvoice) {
      const totalPaid = (updatedInvoice as any).payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const balance = Number(updatedInvoice.grossTotal) - totalPaid;
      let status = 'PENDING';
      if (balance <= 0) status = 'PAID';
      else if (totalPaid > 0) status = 'PARTIAL';

      await prisma.invoice.update({
        where: { id: Number(id) },
        data: { balanceAmount: Math.max(0, balance), status },
      });
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Error recording payment' });
  }
};
