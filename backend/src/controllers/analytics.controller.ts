import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// Native date helpers (replaces date-fns)
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function subMonths(d: Date, n: number): Date { return new Date(d.getFullYear(), d.getMonth() - n, d.getDate()); }
function formatMonth(d: Date): string { return MONTH_NAMES[d.getMonth()]; }

export const getInquiryStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, source, priority, category, venue } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (source) where.source = source as string;
    if (priority) where.priority = priority as string;
    if (category) where.category = category as string;
    if (venue) where.venue = { contains: venue as string };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const totalInquiries = await prisma.inquiry.count({ where });
    const approvedInquiries = await prisma.inquiry.count({ where: { ...where, status: 'CONFIRMED' } });
    const pendingInquiries = await prisma.inquiry.count({ where: { ...where, status: 'INQUIRY' } });
    const rejectedInquiries = await prisma.inquiry.count({ where: { ...where, status: 'REJECTED' } });
    
    // Converted = Confirmed
    const convertedCount = approvedInquiries;
    const conversionRate = totalInquiries > 0 ? (convertedCount / totalInquiries) * 100 : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayInquiries = await prisma.inquiry.count({
      where: { ...where, createdAt: { gte: today } }
    });

    const monthStart = startOfMonth(new Date());
    const monthInquiries = await prisma.inquiry.count({
      where: { ...where, createdAt: { gte: monthStart } }
    });

    res.json({
      totalInquiries,
      approvedInquiries,
      pendingInquiries,
      rejectedInquiries,
      convertedCount,
      conversionRate: conversionRate.toFixed(2),
      todayInquiries,
      monthInquiries
    });
  } catch (error) {
    console.error('Error fetching inquiry stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

export const getChartData = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, dept, source, priority } = req.query;

    const where: any = {};
    if (dept) where.department = dept as string;
    if (source) where.source = source as string;
    if (priority) where.priority = priority as string;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // 1. Status Distribution
    const statusCounts = await prisma.inquiry.groupBy({
      by: ['status'],
      _count: { id: true },
      where
    });

    // 2. Monthly Trends (Last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const trendWhere = { ...where, createdAt: { gte: start, lte: end } };
      const count = await prisma.inquiry.count({ where: trendWhere });
      
      monthlyTrends.push({
        month: formatMonth(date),
        count
      });
    }

    // 3. Department-wise
    const deptStats = await prisma.inquiry.groupBy({
      by: ['department'],
      _count: { id: true },
      where
    });

    // 4. Source-wise
    const sourceStats = await prisma.inquiry.groupBy({
      by: ['source'],
      _count: { id: true },
      where
    });

    // 5. Employee Performance
    const employeeStats = await prisma.inquiry.groupBy({
      by: ['createdById'],
      _count: { id: true },
      where: { ...where, createdById: { not: null } }
    });

    const employeePerformance = await Promise.all(employeeStats.map(async (s) => {
      const user = await prisma.user.findUnique({ where: { id: s.createdById! }, select: { name: true } });
      return {
        name: user?.name || 'Unknown',
        inquiries: s._count.id
      };
    }));

    res.json({
      statusDistribution: statusCounts.map(s => ({ name: s.status, value: s._count.id })),
      monthlyTrends,
      departmentStats: deptStats.map(d => ({ name: d.department, value: d._count.id })),
      sourceStats: sourceStats.map(s => ({ name: s.source || 'Unknown', value: s._count.id })),
      employeePerformance: employeePerformance.sort((a, b) => b.inquiries - a.inquiries)
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Error fetching chart data' });
  }
};



export const getTopEmployees = async (req: Request, res: Response) => {
  try {
    // Performance based on createdById (simple metric)
    const stats = await prisma.inquiry.groupBy({
      by: ['createdById'],
      _count: { id: true },
      where: { createdById: { not: null } }
    });

    // Fetch user names
    const employees = await Promise.all(stats.map(async (s) => {
      const user = await prisma.user.findUnique({ where: { id: s.createdById! }, select: { name: true } });
      return {
        name: user?.name || 'Unknown',
        inquiries: s._count.id
      };
    }));

    res.json(employees.sort((a, b) => b.inquiries - a.inquiries));
  } catch (error) {
    console.error('Error fetching top employees:', error);
    res.status(500).json({ message: 'Error fetching performance data' });
  }
};

// ─── CLIENT ANALYTICS ───────────────────────────────────
export const getClientAnalytics = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = startOfMonth(now);

    const totalClients = await prisma.client.count({ where: { deletedAt: null } });
    const newThisMonth = await prisma.client.count({ where: { deletedAt: null, createdAt: { gte: monthStart } } });
    const newToday = await prisma.client.count({ where: { deletedAt: null, createdAt: { gte: todayStart } } });
    const withCompany = await prisma.client.count({ where: { deletedAt: null, company: { not: '' } } });
    const withGst = await prisma.client.count({ where: { deletedAt: null, gstNumber: { not: '' } } });

    // Monthly growth (last 6 months)
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const count = await prisma.client.count({ where: { deletedAt: null, createdAt: { gte: start, lte: end } } });
      monthlyGrowth.push({ month: formatMonth(date), count });
    }

    // Top clients by inquiry count
    const topClientsRaw = await prisma.inquiry.groupBy({
      by: ['clientId'],
      _count: { id: true },
      where: { deletedAt: null },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });
    const topClients = await Promise.all(topClientsRaw.map(async (t) => {
      const client = await prisma.client.findUnique({ where: { id: t.clientId }, select: { name: true } });
      return { name: client?.name || 'Unknown', inquiries: t._count.id };
    }));

    res.json({
      totalClients, newThisMonth, newToday, withCompany, withGst,
      monthlyGrowth, topClients
    });
  } catch (error) {
    console.error('Error fetching client analytics:', error);
    res.status(500).json({ message: 'Error fetching client analytics' });
  }
};

// ─── AVAILABILITY ANALYTICS ─────────────────────────────
export const getAvailabilityAnalytics = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const start = new Date(todayStr);
    const end = new Date(todayStr + 'T23:59:59.999Z');

    // Staff availability
    const allStaff = await prisma.staff.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        assignments: {
          where: { inquiry: { OR: [{ startDate: { lte: end }, endDate: { gte: start } }] } },
          include: { inquiry: { select: { eventName: true } } }
        }
      }
    });
    const staffAvailable = allStaff.filter(s => s.assignments.length === 0).length;
    const staffBusy = allStaff.filter(s => s.assignments.length > 0).length;
    const staffTotal = allStaff.length;

    // LED availability
    const allLed = await prisma.ledStock.findMany({
      where: { deletedAt: null },
      include: {
        allocations: {
          where: { inquiry: { OR: [{ startDate: { lte: end }, endDate: { gte: start } }] } }
        }
      }
    });
    const ledTotalSqft = allLed.reduce((s, l) => s + l.pricingSqft, 0);
    const ledBookedSqft = allLed.reduce((s, l) => s + l.allocations.reduce((a, al) => a + al.allocatedSqft, 0), 0);
    const ledFreeSqft = ledTotalSqft - ledBookedSqft;

    // Video availability
    const allVideo = await prisma.videoEquipment.findMany({
      where: { deletedAt: null },
      include: {
        bookings: {
          where: { OR: [{ bookedFrom: { lte: end }, bookedTo: { gte: start } }] }
        }
      }
    });
    const videoTotal = allVideo.length;
    const videoBooked = allVideo.filter(v => v.bookings.length > 0).length;
    const videoFree = videoTotal - videoBooked;

    res.json({
      staff: { total: staffTotal, available: staffAvailable, busy: staffBusy, utilization: staffTotal > 0 ? ((staffBusy / staffTotal) * 100).toFixed(1) : '0' },
      led: { totalSqft: ledTotalSqft, bookedSqft: ledBookedSqft, freeSqft: ledFreeSqft, utilization: ledTotalSqft > 0 ? ((ledBookedSqft / ledTotalSqft) * 100).toFixed(1) : '0' },
      video: { total: videoTotal, booked: videoBooked, free: videoFree, utilization: videoTotal > 0 ? ((videoBooked / videoTotal) * 100).toFixed(1) : '0' }
    });
  } catch (error) {
    console.error('Error fetching availability analytics:', error);
    res.status(500).json({ message: 'Error fetching availability analytics' });
  }
};

// ─── VIDEO DEPARTMENT ANALYTICS ─────────────────────────
export const getVideoAnalytics = async (req: Request, res: Response) => {
  try {
    const totalEquipment = await prisma.videoEquipment.count({ where: { deletedAt: null } });

    const byCategory = await prisma.videoEquipment.groupBy({
      by: ['category'], _count: { id: true }, where: { deletedAt: null }
    });
    const byStatus = await prisma.videoEquipment.groupBy({
      by: ['status'], _count: { id: true }, where: { deletedAt: null }
    });
    const byBrand = await prisma.videoEquipment.groupBy({
      by: ['brand'], _count: { id: true }, where: { deletedAt: null, brand: { not: null } }
    });

    const activeBookings = await prisma.videoEventBooking.count({ where: { status: 'BOOKED' } });

    // Most booked equipment
    const mostBookedRaw = await prisma.videoEventBooking.groupBy({
      by: ['equipmentId'], _count: { id: true },
      orderBy: { _count: { id: 'desc' } }, take: 10
    });
    const mostBooked = await Promise.all(mostBookedRaw.map(async (m) => {
      const eq = await prisma.videoEquipment.findUnique({ where: { id: m.equipmentId }, select: { name: true } });
      return { name: eq?.name || 'Unknown', bookings: m._count.id };
    }));

    res.json({
      totalEquipment, activeBookings,
      byCategory: byCategory.map(c => ({ name: c.category, value: c._count.id })),
      byStatus: byStatus.map(s => ({ name: s.status, value: s._count.id })),
      byBrand: byBrand.map(b => ({ name: b.brand || 'Unknown', value: b._count.id })),
      mostBooked
    });
  } catch (error) {
    console.error('Error fetching video analytics:', error);
    res.status(500).json({ message: 'Error fetching video analytics' });
  }
};

// ─── LED DEPARTMENT ANALYTICS ───────────────────────────
export const getLedAnalytics = async (req: Request, res: Response) => {
  try {
    const totalEntries = await prisma.ledStock.count({ where: { deletedAt: null } });

    const totals = await prisma.ledStock.aggregate({
      where: { deletedAt: null },
      _sum: { totalCabinets: true, totalBoxes: true }
    });

    const byType = await prisma.ledStock.groupBy({
      by: ['ledType'], _count: { id: true }, where: { deletedAt: null },
      orderBy: { _count: { id: 'desc' } }
    });
    const byCompany = await prisma.ledStock.groupBy({
      by: ['companyName'], _count: { id: true }, where: { deletedAt: null },
      orderBy: { _count: { id: 'desc' } }
    });

    const activeAllocations = await prisma.ledWarehouseAllocation.count();

    res.json({
      totalEntries, activeAllocations,
      totalCabinets: totals._sum.totalCabinets || 0,
      totalBoxes: totals._sum.totalBoxes || 0,
      byType: byType.map(t => ({ name: t.ledType, value: t._count.id })),
      byCompany: byCompany.map(c => ({ name: c.companyName, value: c._count.id }))
    });
  } catch (error) {
    console.error('Error fetching LED analytics:', error);
    res.status(500).json({ message: 'Error fetching LED analytics' });
  }
};

// ─── STAFF & USERS ANALYTICS ────────────────────────────
export const getStaffAnalytics = async (req: Request, res: Response) => {
  try {
    const totalStaff = await prisma.staff.count({ where: { deletedAt: null } });
    const totalUsers = await prisma.user.count({ where: { deletedAt: null } });

    const byStaffType = await prisma.staff.groupBy({
      by: ['staffType'], _count: { id: true }, where: { deletedAt: null }
    });
    const byRole = await prisma.staff.groupBy({
      by: ['role'], _count: { id: true }, where: { deletedAt: null },
      orderBy: { _count: { id: 'desc' } }
    });
    const byDept = await prisma.staff.groupBy({
      by: ['department'], _count: { id: true }, where: { deletedAt: null, department: { not: null } }
    });

    const usersByRole = await prisma.user.groupBy({
      by: ['role'], _count: { id: true }, where: { deletedAt: null }
    });

    const avgRate = await prisma.staff.aggregate({
      where: { deletedAt: null },
      _avg: { perDayRate: true }
    });

    // Most assigned staff
    const mostAssignedRaw = await prisma.eventStaffAssignment.groupBy({
      by: ['staffId'], _count: { id: true },
      orderBy: { _count: { id: 'desc' } }, take: 10
    });
    const mostAssigned = await Promise.all(mostAssignedRaw.map(async (m) => {
      const staff = await prisma.staff.findUnique({ where: { id: m.staffId }, select: { name: true } });
      return { name: staff?.name || 'Unknown', assignments: m._count.id };
    }));

    res.json({
      totalStaff, totalUsers,
      avgRatePerDay: Number(avgRate._avg.perDayRate || 0).toFixed(0),
      byStaffType: byStaffType.map(t => ({ name: t.staffType, value: t._count.id })),
      byRole: byRole.map(r => ({ name: r.role, value: r._count.id })),
      byDept: byDept.map(d => ({ name: d.department || 'Unassigned', value: d._count.id })),
      usersByRole: usersByRole.map(u => ({ name: u.role, value: u._count.id })),
      mostAssigned
    });
  } catch (error) {
    console.error('Error fetching staff analytics:', error);
    res.status(500).json({ message: 'Error fetching staff analytics' });
  }
};
