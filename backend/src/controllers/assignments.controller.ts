import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    if (!inquiryId) return res.status(400).json({ message: 'inquiryId is required' });

    const assignments = await prisma.eventStaffAssignment.findMany({
      where: { inquiryId: Number(inquiryId) },
      include: { staff: { select: { name: true, role: true, phone: true, department: true } } },
      orderBy: { positionNo: 'asc' },
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments' });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { inquiryId, staffId, positionNo, positionName, daysAssigned, ratePerDay, notes } = req.body;

    // Validation: Check if staff is already assigned to this inquiry
    const existingAssignment = await prisma.eventStaffAssignment.findFirst({
      where: {
        staffId: Number(staffId),
        inquiryId: Number(inquiryId)
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'Staff member is already assigned to this inquiry' });
    }

    // Validation: Check staff availability
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: Number(inquiryId) },
      select: { startDate: true, endDate: true }
    });

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    const conflictingAssignments = await prisma.eventStaffAssignment.findMany({
      where: {
        staffId: Number(staffId),
        inquiry: {
          AND: [
            { startDate: { lte: inquiry.endDate } },
            { endDate: { gte: inquiry.startDate } }
          ]
        }
      },
      include: {
        inquiry: {
          select: { eventName: true, startDate: true, endDate: true }
        }
      }
    });

    if (conflictingAssignments.length > 0) {
      const conflicts = conflictingAssignments.map(a => ({
        eventName: a.inquiry.eventName,
        startDate: a.inquiry.startDate,
        endDate: a.inquiry.endDate
      }));
      return res.status(409).json({
        message: 'Staff member has conflicting assignments during this period',
        conflicts
      });
    }

    const totalPayment = Number(daysAssigned) * Number(ratePerDay);

    const assignment = await prisma.eventStaffAssignment.create({
      data: {
        inquiryId: Number(inquiryId),
        staffId: Number(staffId),
        positionNo: positionNo ? Number(positionNo) : null,
        positionName: positionName || null,
        daysAssigned: Number(daysAssigned),
        ratePerDay: Number(ratePerDay),
        totalPayment,
        notes,
      },
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { positionNo, positionName, daysAssigned, ratePerDay, notes } = req.body;

    const existing = await prisma.eventStaffAssignment.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ message: 'Assignment not found' });

    const dA = Number(daysAssigned ?? existing.daysAssigned);
    const rPD = Number(ratePerDay ?? existing.ratePerDay);

    const assignment = await prisma.eventStaffAssignment.update({
      where: { id: Number(id) },
      data: {
        ...(positionNo !== undefined && { positionNo: Number(positionNo) }),
        ...(positionName !== undefined && { positionName }),
        ...(daysAssigned !== undefined && { daysAssigned: dA }),
        ...(ratePerDay !== undefined && { ratePerDay: rPD }),
        totalPayment: dA * rPD,
        ...(notes !== undefined && { notes }),
      },
    });
    res.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Error updating assignment' });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.eventStaffAssignment.delete({ where: { id: Number(id) } });
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Error deleting assignment' });
  }
};

export const markAssignmentPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, notes } = req.body;

    const assignment = await prisma.eventStaffAssignment.update({
      where: { id: Number(id) },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod || 'CASH',
        paidAt: new Date(),
        ...(notes !== undefined && { notes }),
      },
    });
    res.json(assignment);
  } catch (error) {
    console.error('Error marking assignment paid:', error);
    res.status(500).json({ message: 'Error marking assignment paid' });
  }
};

export const bulkMarkPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { ids, paymentMethod, notes } = req.body;

    const result = await prisma.eventStaffAssignment.updateMany({
      where: { id: { in: ids.map(Number) } },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod || 'CASH',
        paidAt: new Date(),
        ...(notes !== undefined && { notes }),
      },
    });
    res.json({ updated: result.count });
  } catch (error) {
    console.error('Error bulk marking paid:', error);
    res.status(500).json({ message: 'Error bulk marking paid' });
  }
};
