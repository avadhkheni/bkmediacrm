import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalInquiries = await prisma.inquiry.count({ where: { deletedAt: null } });
    const confirmedInquiries = await prisma.inquiry.count({ where: { status: 'CONFIRMED', deletedAt: null } });
    const pendingInquiries = await prisma.inquiry.count({ where: { status: 'INQUIRY', deletedAt: null } });
    const totalClients = await prisma.client.count();
    const totalStaff = await prisma.staff.count({ where: { isActive: true } });

    // This month's revenue from invoices
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const invoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { grossTotal: true }
    });
    const monthRevenue = invoices.reduce((sum, inv) => sum + Number(inv.grossTotal || 0), 0);

    // Recent inquiries
    const recentInquiries = await prisma.inquiry.findMany({
      where: { deletedAt: null },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      totalInquiries,
      confirmedInquiries,
      pendingInquiries,
      totalClients,
      totalStaff,
      monthRevenue,
      recentInquiries
    });
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard stats',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const getOverview = async (req: Request, res: Response) => {
  try {
    const totalInquiries = await prisma.inquiry.count({ where: { deletedAt: null } });
    const activeEvents = await prisma.inquiry.count({
      where: { status: 'IN_PROGRESS', deletedAt: null },
    });
    
    // Quick P&L stats (just basic sums for dashboard)
    const expenseReports = await prisma.expenseReport.findMany({
      select: { clientBilling: true, totalExpenses: true, netProfit: true },
    });

    const totalRevenue = expenseReports.reduce((sum, r) => sum + Number(r.clientBilling || 0), 0);
    const totalProfit = expenseReports.reduce((sum, r) => sum + Number(r.netProfit || 0), 0);

    res.json({
      totalInquiries,
      activeEvents,
      financials: {
        totalRevenue,
        totalProfit,
      },
    });
  } catch (error) {
    console.error('Dashboard Overview Error:', error);
    res.status(500).json({ message: 'Error fetching overview' });
  }
};

export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const upcoming = await prisma.inquiry.findMany({
      where: {
        startDate: {
          gte: new Date(),
          lte: targetDate,
        },
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      include: { client: { select: { name: true } } },
      orderBy: { startDate: 'asc' },
      take: 10,
    });

    res.json(upcoming);
  } catch (error) {
    console.error('Upcoming Events Error:', error);
    res.status(500).json({ message: 'Error fetching upcoming events' });
  }
};

export const getPendingActions = async (req: Request, res: Response) => {
  try {
    // Draft quotations needing approval
    const draftQuotations = await prisma.quotation.count({ where: { status: 'DRAFT', deletedAt: null } });

    // Sent quotations awaiting client confirmation
    const sentQuotations = await prisma.quotation.count({ where: { status: 'SENT', deletedAt: null } });

    // Pending invoices (not fully paid)
    const pendingInvoices = await prisma.invoice.count({ where: { status: { in: ['PENDING', 'PARTIAL'] } } });

    // Staff assignments with PENDING payment
    const pendingStaffPayments = await prisma.eventStaffAssignment.count({ where: { paymentStatus: 'PENDING' } });

    // Submitted expense reports awaiting approval
    const pendingExpenseApprovals = await prisma.expenseReport.count({ where: { status: 'SUBMITTED' } });

    // Unresolved LED issues
    const unresolvedIssues = await prisma.ledEventIssue.count({ where: { resolved: false } });

    res.json({
      draftQuotations,
      sentQuotations,
      pendingInvoices,
      pendingStaffPayments,
      pendingExpenseApprovals,
      unresolvedIssues,
    });
  } catch (error) {
    console.error('Pending Actions Error:', error);
    res.status(500).json({ message: 'Error fetching pending actions' });
  }
};

export const getMonthlyPnL = async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string; // format: "2026-05"
    if (!month) return res.status(400).json({ message: 'month query param required (format: YYYY-MM)' });

    const [yearStr, monthStr] = month.split('-');
    const startDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);
    const endDate = new Date(Number(yearStr), Number(monthStr), 1);

    // Get expense reports for events in this month
    const reports = await prisma.expenseReport.findMany({
      where: ({} as any),
      include: { inquiry: { select: { eventName: true, department: true } } },
    });

    // Filter by month in JS since Prisma types may lag
    const filtered = (reports as any[]).filter((r: any) => {
      const d = new Date(r.createdAt);
      return d >= startDate && d < endDate;
    });

    const totalRevenue = filtered.reduce((sum, r) => sum + Number(r.clientBilling || 0), 0);
    const totalExpenses = filtered.reduce((sum, r) => sum + Number(r.totalExpenses || 0), 0);
    const netProfit = filtered.reduce((sum, r) => sum + Number(r.netProfit || 0), 0);
    const profitMargin = totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

    // Breakdown by department
    const byDepartment: Record<string, { revenue: number; expenses: number; profit: number }> = {};
    for (const r of filtered) {
      const dept = (r as any).inquiry?.department || 'UNKNOWN';
      if (!byDepartment[dept]) byDepartment[dept] = { revenue: 0, expenses: 0, profit: 0 };
      byDepartment[dept].revenue += Number(r.clientBilling || 0);
      byDepartment[dept].expenses += Number(r.totalExpenses || 0);
      byDepartment[dept].profit += Number(r.netProfit || 0);
    }

    res.json({
      month,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      byDepartment,
      reports: filtered.map(r => ({
        id: r.id,
        eventName: (r as any).inquiry?.eventName || '',
        department: (r as any).inquiry?.department || '',
        clientBilling: Number(r.clientBilling || 0),
        totalExpenses: Number(r.totalExpenses || 0),
        netProfit: Number(r.netProfit || 0),
        profitMargin: Number(r.profitMargin || 0),
      })),
    });
  } catch (error) {
    console.error('Monthly P&L Error:', error);
    res.status(500).json({ message: 'Error fetching monthly P&L' });
  }
};
