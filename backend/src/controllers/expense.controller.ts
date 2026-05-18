import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getExpenseReports = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const whereClause: any = {};
    if (inquiryId) whereClause.inquiryId = Number(inquiryId);

    const reports = await prisma.expenseReport.findMany({
      where: whereClause,
      include: { extraExpenses: true },
      orderBy: { id: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching expense reports:', error);
    res.status(500).json({ message: 'Error fetching expense reports' });
  }
};

export const createExpenseReport = async (req: AuthRequest, res: Response) => {
  try {
    const { inquiryId, transportExpense, foodExpense, miscExpense } = req.body;

    // Auto-compute totals
    const staffAssignments = await prisma.eventStaffAssignment.findMany({
      where: { inquiryId: Number(inquiryId) },
    });
    const ledVendorArrangements = await prisma.ledVendorArrangement.findMany({
      where: { inquiryId: Number(inquiryId) },
    });
    const videoBookings = await prisma.videoEventBooking.findMany({
      where: { inquiryId: Number(inquiryId), NOT: { vendorId: null } },
    });
    const soundBookings = await prisma.soundEventBooking.findMany({
      where: { inquiryId: Number(inquiryId), NOT: { vendorId: null } },
    });
    const quotation = await prisma.quotation.findFirst({
      where: { inquiryId: Number(inquiryId), status: 'APPROVED' },
    });

    const totalStaffCost = staffAssignments.reduce((sum, a) => sum + Number(a.totalPayment), 0);
    
    const ledVendorCost = ledVendorArrangements.reduce((sum, v) => sum + Number(v.totalCost || 0), 0);
    const videoVendorCost = videoBookings.reduce((sum, v) => sum + Number(v.vendorCost || 0), 0);
    const soundVendorCost = soundBookings.reduce((sum, v) => sum + Number(v.vendorCost || 0), 0);
    
    const totalVendorCost = ledVendorCost + videoVendorCost + soundVendorCost;
    const transport = Number(transportExpense || 0);
    const food = Number(foodExpense || 0);
    const misc = Number(miscExpense || 0);
    const totalExpenses = totalStaffCost + totalVendorCost + transport + food + misc;
    const clientBilling = Number(quotation?.subtotal || 0);
    const netProfit = clientBilling - totalExpenses;
    const profitMargin = clientBilling > 0 ? parseFloat(((netProfit / clientBilling) * 100).toFixed(2)) : 0;

    const report = await prisma.expenseReport.create({
      data: {
        inquiryId: Number(inquiryId),
        transportExpense: transport,
        foodExpense: food,
        miscExpense: misc,
        totalStaffCost,
        totalVendorCost,
        totalExpenses,
        clientBilling,
        netProfit,
        profitMargin,
      },
    });
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating expense report:', error);
    res.status(500).json({ message: 'Error creating expense report' });
  }
};

export const updateExpenseReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { transportExpense, foodExpense, miscExpense } = req.body;

    const existing = await prisma.expenseReport.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ message: 'Expense report not found' });

    const transport = Number(transportExpense ?? existing.transportExpense);
    const food = Number(foodExpense ?? existing.foodExpense);
    const misc = Number(miscExpense ?? existing.miscExpense);
    const totalExpenses = Number(existing.totalStaffCost) + Number(existing.totalVendorCost) + transport + food + misc;
    const clientBilling = Number(existing.clientBilling);
    const netProfit = clientBilling - totalExpenses;
    const profitMargin = clientBilling > 0 ? parseFloat(((netProfit / clientBilling) * 100).toFixed(2)) : 0;

    // Add extra expenses
    const extras = await prisma.extraExpense.findMany({ where: { expenseReportId: Number(id) } });
    const extraTotal = extras.reduce((sum, e) => sum + Number(e.amount), 0);
    const finalTotal = totalExpenses + extraTotal;
    const finalProfit = clientBilling - finalTotal;
    const finalMargin = clientBilling > 0 ? parseFloat(((finalProfit / clientBilling) * 100).toFixed(2)) : 0;

    const report = await prisma.expenseReport.update({
      where: { id: Number(id) },
      data: {
        transportExpense: transport,
        foodExpense: food,
        miscExpense: misc,
        totalExpenses: finalTotal,
        netProfit: finalProfit,
        profitMargin: finalMargin,
      },
    });
    res.json(report);
  } catch (error) {
    console.error('Error updating expense report:', error);
    res.status(500).json({ message: 'Error updating expense report' });
  }
};

export const addExtraExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, amount } = req.body;

    const expense = await prisma.extraExpense.create({
      data: {
        expenseReportId: Number(id),
        name,
        amount: Number(amount),
      },
    });

    // Recompute totals
    await recomputeTotals(Number(id));

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error adding extra expense:', error);
    res.status(500).json({ message: 'Error adding extra expense' });
  }
};

export const deleteExtraExpense = async (req: Request, res: Response) => {
  try {
    const { id, extraId } = req.params;
    await prisma.extraExpense.delete({ where: { id: Number(extraId) } });

    await recomputeTotals(Number(id));

    res.json({ message: 'Extra expense deleted' });
  } catch (error) {
    console.error('Error deleting extra expense:', error);
    res.status(500).json({ message: 'Error deleting extra expense' });
  }
};

export const submitExpenseReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = await prisma.expenseReport.update({
      where: { id: Number(id) },
      data: { status: 'SUBMITTED', submittedById: req.user?.userId, submittedAt: new Date() },
    });
    res.json(report);
  } catch (error) {
    console.error('Error submitting expense report:', error);
    res.status(500).json({ message: 'Error submitting expense report' });
  }
};

export const approveExpenseReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = await prisma.expenseReport.update({
      where: { id: Number(id) },
      data: { status: 'APPROVED', approvedById: req.user?.userId, approvedAt: new Date() },
    });
    res.json(report);
  } catch (error) {
    console.error('Error approving expense report:', error);
    res.status(500).json({ message: 'Error approving expense report' });
  }
};

// Helper to recompute expense totals
async function recomputeTotals(reportId: number) {
  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    include: { extraExpenses: true },
  });
  if (!report) return;

  const extraTotal = report.extraExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpenses = Number(report.totalStaffCost) + Number(report.totalVendorCost) +
    Number(report.transportExpense) + Number(report.foodExpense) + Number(report.miscExpense) + extraTotal;
  const clientBilling = Number(report.clientBilling);
  const netProfit = clientBilling - totalExpenses;
  const profitMargin = clientBilling > 0 ? parseFloat(((netProfit / clientBilling) * 100).toFixed(2)) : 0;

  await prisma.expenseReport.update({
    where: { id: reportId },
    data: { totalExpenses, netProfit, profitMargin },
  });
}
