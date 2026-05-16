import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const { vehicleType, isActive } = req.query;
    const whereClause: any = { deletedAt: null };
    if (vehicleType) whereClause.vehicleType = String(vehicleType);
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      include: {
        dispatchStaffAssignments: {
          include: {
            inquiry: { select: { eventName: true, startDate: true, endDate: true } },
            staff: { select: { name: true, role: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { name, numberPlate, vehicleType, capacityNotes } = req.body;

    if (!name || !numberPlate || !vehicleType) {
      return res.status(400).json({ message: 'name, numberPlate, and vehicleType are required' });
    }

    const vehicle = await prisma.vehicle.create({
      data: { name, numberPlate, vehicleType, capacityNotes },
    });
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ message: 'Error creating vehicle' });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, numberPlate, vehicleType, capacityNotes, isActive } = req.body;

    const existing = await prisma.vehicle.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ message: 'Vehicle not found' });

    const vehicle = await prisma.vehicle.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(numberPlate !== undefined && { numberPlate }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(capacityNotes !== undefined && { capacityNotes }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ message: 'Error updating vehicle' });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.vehicle.findUnique({
      where: { id: Number(id) },
      include: { dispatchStaffAssignments: true },
    });
    if (!existing) return res.status(404).json({ message: 'Vehicle not found' });
    if (existing.dispatchStaffAssignments.length > 0) {
      return res.status(400).json({ message: 'Cannot delete vehicle with active dispatch assignments' });
    }

    await prisma.vehicle.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date(), isActive: false }
    });
    res.json({ message: 'Vehicle soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Error deleting vehicle' });
  }
};
