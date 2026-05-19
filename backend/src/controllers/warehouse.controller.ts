import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        videoStock: true,
        ledStock: true,
        soundStock: true,
        _count: {
          select: { videoStock: true, ledStock: true, soundStock: true }
        }
      }
    });
    res.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ message: 'Error fetching warehouses' });
  }
};

export const createWarehouse = async (req: Request, res: Response) => {
  try {
    const { name, location, status } = req.body;
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location,
        status: status || 'ACTIVE'
      }
    });
    res.status(201).json(warehouse);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ message: 'Error creating warehouse' });
  }
};

export const updateWarehouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: Number(id) },
      data: {
        name,
        location,
        status
      }
    });
    res.json(warehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ message: 'Error updating warehouse' });
  }
};

export const getWarehouseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: Number(id) },
      include: {
        videoStock: true,
        ledStock: true,
        soundStock: true
      }
    });
    
    if (!warehouse) {
      res.status(404).json({ message: 'Warehouse not found' });
      return;
    }
    
    res.json(warehouse);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ message: 'Error fetching warehouse details' });
  }
};

export const getMovements = async (req: Request, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        warehouse: true,
        videoEquipment: true,
        ledStock: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(movements);
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ message: 'Error fetching movements' });
  }
};

export const createDispatch = async (req: Request, res: Response) => {
  try {
    const { inquiryId, staffName, notes, items, itemsToCheck } = req.body;
    
    const numericInquiryId = Number(inquiryId);
    if (isNaN(numericInquiryId)) {
      res.status(400).json({ message: 'Invalid Inquiry ID' });
      return;
    }

    const checklist = await prisma.checklist.create({
      data: {
        type: 'DISPATCH',
        inquiryId: numericInquiryId,
        staffName,
        notes,
        items: {
          create: (itemsToCheck || []).map((check: any) => ({
            checkName: check.name,
            isPassed: check.isPassed,
            notes: check.notes
          }))
        }
      }
    });

    // If all items are passed, set assigned vehicles status to READY_TO_LEAVE
    const allPassed = (itemsToCheck || []).length > 0 && (itemsToCheck || []).every((check: any) => check.isPassed === true);
    if (allPassed) {
      const assignments = await prisma.dispatchStaffAssignment.findMany({
        where: { inquiryId: numericInquiryId }
      });
      const vehicleIds = assignments.map(a => a.vehicleId);
      if (vehicleIds.length > 0) {
        await prisma.vehicle.updateMany({
          where: { id: { in: vehicleIds } },
          data: { status: 'READY_TO_LEAVE' }
        });
      }
    }

    // Update statuses and quantities
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        
        if (item.videoEquipId) {
          await prisma.videoEquipment.update({
            where: { id: Number(item.videoEquipId) },
            data: { 
              status: 'IN_USE',
              availableQuantity: { decrement: qty },
              inUseQuantity: { increment: qty }
            }
          });
        } else if (item.ledStockId) {
          await prisma.ledStock.update({
            where: { id: Number(item.ledStockId) },
            data: { 
              status: 'IN_USE',
              availableQuantity: { decrement: qty },
              inUseQuantity: { increment: qty }
            }
          });
        } else if (item.soundEquipId) {
          await prisma.soundEquipment.update({
            where: { id: Number(item.soundEquipId) },
            data: { 
              status: 'IN_USE',
              availableQuantity: { decrement: qty },
              inUseQuantity: { increment: qty }
            }
          });
        }

        await prisma.stockMovement.create({
          data: {
            warehouseId: Number(item.warehouseId),
            videoEquipId: item.videoEquipId ? Number(item.videoEquipId) : null,
            ledStockId: item.ledStockId ? Number(item.ledStockId) : null,
            soundEquipId: item.soundEquipId ? Number(item.soundEquipId) : null,
            action: 'SENT_TO_ORDER',
            quantity: qty,
            inquiryId: numericInquiryId,
            notes: 'Dispatched for event'
          }
        });
      }
    }

    res.status(201).json(checklist);
  } catch (error) {
    console.error('Error creating dispatch:', error);
    res.status(500).json({ message: 'Error processing dispatch' });
  }
};

export const createReturn = async (req: Request, res: Response) => {
  try {
    const { inquiryId, staffName, notes, penaltyAmount, items, itemsToCheck } = req.body;
    
    const numericInquiryId = Number(inquiryId);
    if (isNaN(numericInquiryId)) {
      res.status(400).json({ message: 'Invalid Inquiry ID' });
      return;
    }

    const checklist = await prisma.checklist.create({
      data: {
        type: 'RETURN',
        inquiryId: numericInquiryId,
        staffName,
        notes,
        penaltyAmount: penaltyAmount ? Number(penaltyAmount) : null,
        items: {
          create: (itemsToCheck || []).map((check: any) => ({
            checkName: check.name,
            isPassed: check.isPassed,
            notes: check.notes
          }))
        }
      }
    });

    // Set inquiry's assigned vehicles status back to AVAILABLE upon return checklist submission
    const assignments = await prisma.dispatchStaffAssignment.findMany({
      where: { inquiryId: numericInquiryId }
    });
    const vehicleIds = assignments.map(a => a.vehicleId);
    if (vehicleIds.length > 0) {
      await prisma.vehicle.updateMany({
        where: { id: { in: vehicleIds } },
        data: { status: 'AVAILABLE' }
      });
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        const isDamaged = item.isDamaged === true;
        const newStatus = isDamaged ? 'DAMAGED' : 'AVAILABLE';
        
        if (item.videoEquipId) {
          await prisma.videoEquipment.update({
            where: { id: Number(item.videoEquipId) },
            data: { 
              status: newStatus,
              availableQuantity: isDamaged ? undefined : { increment: qty },
              inUseQuantity: { decrement: qty },
              maintenanceQuantity: isDamaged ? { increment: qty } : undefined
            }
          });
        } else if (item.ledStockId) {
          await prisma.ledStock.update({
            where: { id: Number(item.ledStockId) },
            data: { 
              status: newStatus,
              availableQuantity: isDamaged ? undefined : { increment: qty },
              inUseQuantity: { decrement: qty },
              maintenanceQuantity: isDamaged ? { increment: qty } : undefined
            }
          });
        } else if (item.soundEquipId) {
          await prisma.soundEquipment.update({
            where: { id: Number(item.soundEquipId) },
            data: { 
              status: newStatus,
              availableQuantity: isDamaged ? undefined : { increment: qty },
              inUseQuantity: { decrement: qty },
              maintenanceQuantity: isDamaged ? { increment: qty } : undefined
            }
          });
        }

        await prisma.stockMovement.create({
          data: {
            warehouseId: Number(item.warehouseId),
            videoEquipId: item.videoEquipId ? Number(item.videoEquipId) : null,
            ledStockId: item.ledStockId ? Number(item.ledStockId) : null,
            soundEquipId: item.soundEquipId ? Number(item.soundEquipId) : null,
            action: isDamaged ? 'DAMAGED' : 'RETURNED',
            quantity: qty,
            inquiryId: numericInquiryId,
            notes: isDamaged ? 'Returned with damage' : 'Returned safely'
          }
        });
      }
    }

    res.status(201).json(checklist);
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({ message: 'Error processing return' });
  }
};

export const deleteWarehouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if warehouse has active stock before deleting
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { videoStock: true, ledStock: true, soundStock: true }
        }
      }
    });

    if (!warehouse) {
      res.status(404).json({ message: 'Warehouse not found' });
      return;
    }

    if (warehouse._count.videoStock > 0 || warehouse._count.ledStock > 0 || warehouse._count.soundStock > 0) {
      res.status(400).json({ message: 'Cannot delete warehouse that contains equipment stock. Please reassign or delete the stock first.' });
      return;
    }

    await prisma.warehouse.delete({
      where: { id: Number(id) }
    });
    
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ message: 'Error deleting warehouse' });
  }
};
