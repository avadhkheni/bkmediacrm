import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// GET /dispatch/staff?inquiryId=
export const getDispatchStaff = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const whereClause: any = {};
    if (inquiryId) whereClause.inquiryId = Number(inquiryId);

    const assignments = await prisma.dispatchStaffAssignment.findMany({
      where: whereClause,
      include: {
        inquiry: { select: { eventName: true, startDate: true, endDate: true, venue: true } },
        vehicle: true,
        staff: { select: { id: true, name: true, role: true, phone: true, department: true } },
      },
      orderBy: { id: 'asc' },
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching dispatch staff:', error);
    res.status(500).json({ message: 'Error fetching dispatch staff assignments' });
  }
};

// POST /dispatch/staff
// Body: { inquiryId, vehicleId, staffId }
export const createDispatchStaff = async (req: Request, res: Response) => {
  try {
    const { inquiryId, vehicleId, staffId } = req.body;

    if (!inquiryId || !vehicleId || !staffId) {
      return res.status(400).json({ message: 'inquiryId, vehicleId, and staffId are required' });
    }

    // Verify references exist
    const [inquiry, vehicle, staff] = await Promise.all([
      prisma.inquiry.findUnique({ where: { id: Number(inquiryId) } }),
      prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } }),
      prisma.staff.findUnique({ where: { id: Number(staffId) } }),
    ]);

    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    // Check for duplicate assignment
    const existing = await prisma.dispatchStaffAssignment.findFirst({
      where: {
        inquiryId: Number(inquiryId),
        vehicleId: Number(vehicleId),
        staffId: Number(staffId),
      },
    });
    if (existing) {
      return res.status(409).json({ message: 'This staff is already assigned to this vehicle for this inquiry' });
    }

    const assignment = await prisma.dispatchStaffAssignment.create({
      data: {
        inquiryId: Number(inquiryId),
        vehicleId: Number(vehicleId),
        staffId: Number(staffId),
      },
      include: {
        inquiry: { select: { eventName: true } },
        vehicle: true,
        staff: { select: { name: true, role: true } },
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating dispatch staff assignment:', error);
    res.status(500).json({ message: 'Error creating dispatch staff assignment' });
  }
};

// DELETE /dispatch/staff/:id
export const deleteDispatchStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.dispatchStaffAssignment.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ message: 'Dispatch assignment not found' });

    await prisma.dispatchStaffAssignment.delete({ where: { id: Number(id) } });
    res.json({ message: 'Dispatch staff assignment deleted' });
  } catch (error) {
    console.error('Error deleting dispatch staff assignment:', error);
    res.status(500).json({ message: 'Error deleting dispatch staff assignment' });
  }
};
