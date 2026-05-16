import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getStaff = async (req: Request, res: Response) => {
  try {
    const { dept, type: staffType, role, search } = req.query;
    const whereClause: any = { isActive: true, deletedAt: null };
    if (dept) whereClause.department = dept as string;
    if (staffType) whereClause.staffType = staffType as string;
    if (role) whereClause.role = role as string;
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { phone: { contains: search as string } },
      ];
    }

    const staff = await prisma.staff.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Error fetching staff' });
  }
};

export const getStaffById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staff = await prisma.staff.findUnique({
      where: { id: Number(id) },
    });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Error fetching staff' });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { name, role, phone, email, department, perDayRate, staffType, aadharNumber, address } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') return res.status(400).json({ message: 'Staff name is required' });
    if (!role || role.trim() === '') return res.status(400).json({ message: 'Role is required' });
    if (!phone || phone.trim() === '') return res.status(400).json({ message: 'Phone number is required' });
    if (perDayRate !== undefined && Number(perDayRate) < 0) {
      return res.status(400).json({ message: 'perDayRate cannot be negative' });
    }

    const staff = await prisma.staff.create({
      data: {
        name,
        role,
        phone,
        email: email || null,
        department: department || null,
        perDayRate: perDayRate ? Number(perDayRate) : 0,
        staffType: staffType || 'CONTRACT',
        aadharNumber: aadharNumber || null,
        address: address || null,
      },
    });
    res.status(201).json(staff);
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ message: 'Error creating staff' });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, department, perDayRate, staffType, aadharNumber, address, isActive } = req.body;
    const staff = await prisma.staff.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(department !== undefined && { department }),
        ...(perDayRate !== undefined && { perDayRate: Number(perDayRate) }),
        ...(staffType && { staffType }),
        ...(aadharNumber !== undefined && { aadharNumber }),
        ...(address !== undefined && { address }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(staff);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ message: 'Error updating staff' });
  }
};

export const getStaffAssignments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignments = await prisma.eventStaffAssignment.findMany({
      where: { staffId: Number(id) },
      include: { inquiry: { select: { eventName: true, startDate: true, endDate: true, venue: true } } },
      orderBy: { id: 'desc' },
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching staff assignments:', error);
    res.status(500).json({ message: 'Error fetching staff assignments' });
  }
};

export const getStaffPayments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignments = await prisma.eventStaffAssignment.findMany({
      where: { staffId: Number(id), paymentStatus: 'PAID' },
      include: { inquiry: { select: { eventName: true } } },
      orderBy: { paidAt: 'desc' },
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching staff payments:', error);
    res.status(500).json({ message: 'Error fetching staff payments' });
  }
};

export const getStaffAvailability = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, role, dept } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: 'startDate and endDate are required' });

    const allStaff = await prisma.staff.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(role && { role: role as string }),
        ...(dept && { department: dept as string }),
      },
      include: {
        assignments: {
          include: { inquiry: { select: { eventName: true, startDate: true, endDate: true } } },
        },
      },
    });

    const result = allStaff.map(s => {
      const conflicts = s.assignments.filter(a =>
        a.inquiry.startDate <= new Date(endDate as string) &&
        a.inquiry.endDate >= new Date(startDate as string)
      );
      const status = conflicts.length === 0
        ? 'AVAILABLE'
        : conflicts.some(c =>
            c.inquiry.startDate <= new Date(startDate as string) &&
            c.inquiry.endDate >= new Date(endDate as string))
          ? 'BUSY' : 'PARTIAL';
      return {
        id: s.id,
        name: s.name,
        role: s.role,
        department: s.department,
        staffType: s.staffType,
        perDayRate: s.perDayRate,
        status,
        busyInEvent: conflicts[0]?.inquiry.eventName || null,
        busyDates: conflicts.map(c => ({ from: c.inquiry.startDate, to: c.inquiry.endDate, event: c.inquiry.eventName })),
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching staff availability:', error);
    res.status(500).json({ message: 'Error fetching staff availability' });
  }
};

export const uploadAadhar = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const existing = await prisma.staff.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ message: 'Staff not found' });

    const updateData: any = {};
    if (files?.front?.[0]) updateData.aadharFront = files.front[0].path;
    if (files?.back?.[0]) updateData.aadharBack = files.back[0].path;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const staff = await prisma.staff.update({
      where: { id: Number(id) },
      data: updateData,
    });
    res.json(staff);
  } catch (error) {
    console.error('Error uploading Aadhar:', error);
    res.status(500).json({ message: 'Error uploading Aadhar' });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.staff.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });
    res.json({ message: 'Staff soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: 'Error deleting staff' });
  }
};
