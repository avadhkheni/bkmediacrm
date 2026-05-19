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

    // Enforce that dispatch checklist must exist and be fully approved (all items passed)
    const checklist = await prisma.checklist.findFirst({
      where: {
        inquiryId: Number(inquiryId),
        type: 'DISPATCH'
      },
      include: {
        items: true
      }
    });

    if (!checklist) {
      return res.status(400).json({
        message: 'No Dispatch Checklist found for this Inquiry. Please complete and approve the checklist in the To-Do & Checklists page first.'
      });
    }

    const allPassed = checklist.items.length > 0 && checklist.items.every(item => item.isPassed);
    if (!allPassed) {
      return res.status(400).json({
        message: 'The Dispatch Checklist is not fully approved. Please verify and pass all checklist items before proceeding with vehicle assignment.'
      });
    }

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

    // Automatically update vehicle status to READY_TO_LEAVE
    await prisma.vehicle.update({
      where: { id: Number(vehicleId) },
      data: { status: 'READY_TO_LEAVE' }
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

// GET /dispatch/led-boxes?inquiryId=
export const getLedDispatchBoxes = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const whereClause: any = {};
    if (inquiryId) whereClause.inquiryId = Number(inquiryId);

    const boxes = await prisma.ledDispatchBoxEntry.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
    res.json(boxes);
  } catch (error) {
    console.error('Error fetching LED dispatch boxes:', error);
    res.status(500).json({ message: 'Error fetching LED dispatch boxes' });
  }
};

// POST /dispatch/led-boxes
export const createLedDispatchBox = async (req: Request, res: Response) => {
  try {
    const { inquiryId, vehicleName, vehicleNumber, companyName, numBoxes, cabinetsPerBox } = req.body;

    if (!inquiryId || !vehicleName || !companyName || !numBoxes || !cabinetsPerBox) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const totalCabinets = Number(numBoxes) * Number(cabinetsPerBox);

    const boxEntry = await prisma.ledDispatchBoxEntry.create({
      data: {
        inquiryId: Number(inquiryId),
        vehicleName,
        vehicleNumber: vehicleNumber || null,
        companyName,
        numBoxes: Number(numBoxes),
        cabinetsPerBox: Number(cabinetsPerBox),
        totalCabinets,
      },
    });

    res.status(201).json(boxEntry);
  } catch (error) {
    console.error('Error creating LED dispatch box:', error);
    res.status(500).json({ message: 'Error creating LED dispatch box' });
  }
};

// DELETE /dispatch/led-boxes/:id
export const deleteLedDispatchBox = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.ledDispatchBoxEntry.delete({ where: { id: Number(id) } });
    res.json({ message: 'LED dispatch box deleted' });
  } catch (error) {
    console.error('Error deleting LED dispatch box:', error);
    res.status(500).json({ message: 'Error deleting LED dispatch box' });
  }
};
