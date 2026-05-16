import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getInquiries = async (req: Request, res: Response) => {
  try {
    const { dept, status, search } = req.query;
    
    const where: any = { deletedAt: null };
    if (dept) where.department = dept;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { eventName: { contains: String(search) } },
        { inquiryNumber: { contains: String(search) } },
        { client: { name: { contains: String(search) } } }
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        client: true,
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalCount = await prisma.inquiry.count({ where });

    res.json({
      data: inquiries,
      total: totalCount
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Error fetching inquiries' });
  }
};


export const createInquiry = async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      department,
      eventName,
      eventType,
      startDate,
      endDate,
      totalDays,
      venue,
      specialNotes,
      source,
      priority,
      category
    } = req.body;

    // Basic validation
    if (!clientId || !department || !eventName || !startDate || !endDate || !venue) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        required: ['clientId', 'department', 'eventName', 'startDate', 'endDate', 'venue'] 
      });
    }

    // Generate Inquiry Number (e.g., INQ-2025-0001)
    const year = new Date().getFullYear();
    const count = await prisma.inquiry.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        },
        deletedAt: null
      }
    });
    const inquiryNumber = `INQ-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryNumber,
        clientId: Number(clientId),
        department,
        eventName,
        eventType: eventType || 'Other',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: Number(totalDays) || 1,
        venue,
        specialNotes: specialNotes || '',
        source: source || 'DIRECT',
        priority: priority || 'MEDIUM',
        category: category || 'OTHER',
        status: 'INQUIRY',
        createdById: (req as any).user?.id || null
      } as any
    });

    res.status(201).json(inquiry);
  } catch (error: any) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ 
      message: 'Error creating inquiry', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const getInquiryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: Number(id) },
      include: {
        client: true,
        quotations: {
          include: { 
            invoice: true,
            videoQuotationItems: true,
            ledQuotationItems: true
          },
          orderBy: { createdAt: 'desc' }
        },
        invoices: true,
        staffAssignments: {
          include: { staff: true }
        },
        officeTasks: true,
        videoDataSheets: true,
        soundSetup: true,
        ledWarehouseAllocations: true
      }
    });

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    res.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    res.status(500).json({ message: 'Error fetching inquiry' });
  }
};

export const updateInquiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.clientId) data.clientId = Number(data.clientId);
    if (data.totalDays) data.totalDays = Number(data.totalDays);

    const inquiry = await prisma.inquiry.update({
      where: { id: Number(id) },
      data
    });

    res.json(inquiry);
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ message: 'Error updating inquiry' });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const inquiry = await prisma.inquiry.update({
      where: { id: Number(id) },
      data: { status }
    });

    res.json(inquiry);
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
};

export const getInquiryTimeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // In a real app, you'd have a separate Timeline model or audit log
    // For now, we'll return a basic timeline based on related records
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: Number(id) },
      include: {
        quotations: true,
        invoices: true
      }
    });

    const timeline = [
      { date: inquiry?.createdAt, event: 'Inquiry Created', type: 'system' }
    ];

    inquiry?.quotations.forEach(q => {
      timeline.push({ date: q.createdAt, event: `Quotation ${q.quotationNumber} Generated`, type: 'quotation' });
      if (q.approvedAt) {
        timeline.push({ date: q.approvedAt, event: `Quotation ${q.quotationNumber} Approved`, type: 'approval' });
      }
    });

    inquiry?.invoices.forEach(inv => {
      timeline.push({ date: inv.createdAt, event: `Invoice ${inv.invoiceNumber} Generated`, type: 'invoice' });
    });

    res.json(timeline.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()));
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ message: 'Error fetching timeline' });
  }
};

export const rejectExpenseReport = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.params;
    const { rejectionReason } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const report = await prisma.expenseReport.findUnique({
      where: { inquiryId: Number(inquiryId) }
    });

    if (!report) {
      return res.status(404).json({ message: 'Expense report not found' });
    }

    if (report.status !== 'SUBMITTED' && report.status !== 'REVIEWING') {
      return res.status(400).json({ message: `Cannot reject report with status: ${report.status}` });
    }

    const updated = await prisma.expenseReport.update({
      where: { inquiryId: Number(inquiryId) },
      data: {
        status: 'DECLINED',
        rejectionReason: rejectionReason.trim(),
        rejectedAt: new Date(),
        rejectedById: userId
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error rejecting expense report:', error);
    res.status(500).json({ message: 'Error rejecting expense report', error: error.message });
  }
};

export const deleteInquiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.inquiry.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });
    res.json({ message: 'Inquiry soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ message: 'Error deleting inquiry' });
  }
};
