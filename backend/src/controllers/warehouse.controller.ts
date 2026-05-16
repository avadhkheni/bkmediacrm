import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: {
          select: { videoStock: true, ledStock: true }
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
        ledStock: true
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
    
    // itemsToCheck would be the checklist booleans.
    // items would be [{ videoEquipId: 1, quantity: 1, warehouseId: 1 }]
    
    const checklist = await prisma.checklist.create({
      data: {
        type: 'DISPATCH',
        inquiryId: Number(inquiryId),
        staffName,
        notes,
        items: {
          create: itemsToCheck.map((check: any) => ({
            checkName: check.name,
            isPassed: check.isPassed,
            notes: check.notes
          }))
        }
      }
    });

    // Update statuses
    for (const item of items) {
      if (item.videoEquipId) {
        await prisma.videoEquipment.update({
          where: { id: item.videoEquipId },
          data: { status: 'IN_USE' }
        });
      } else if (item.ledStockId) {
        await prisma.ledStock.update({
          where: { id: item.ledStockId },
          data: { status: 'IN_USE' }
        });
      }

      await prisma.stockMovement.create({
        data: {
          warehouseId: Number(item.warehouseId),
          videoEquipId: item.videoEquipId ? Number(item.videoEquipId) : null,
          ledStockId: item.ledStockId ? Number(item.ledStockId) : null,
          action: 'SENT_TO_ORDER',
          quantity: item.quantity,
          inquiryId: Number(inquiryId),
          notes: 'Dispatched for event'
        }
      });
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
    
    const checklist = await prisma.checklist.create({
      data: {
        type: 'RETURN',
        inquiryId: Number(inquiryId),
        staffName,
        notes,
        penaltyAmount: penaltyAmount ? Number(penaltyAmount) : null,
        items: {
          create: itemsToCheck.map((check: any) => ({
            checkName: check.name,
            isPassed: check.isPassed,
            notes: check.notes
          }))
        }
      }
    });

    for (const item of items) {
      const newStatus = item.isDamaged ? 'DAMAGED' : 'AVAILABLE';
      
      if (item.videoEquipId) {
        await prisma.videoEquipment.update({
          where: { id: item.videoEquipId },
          data: { status: newStatus }
        });
      } else if (item.ledStockId) {
        await prisma.ledStock.update({
          where: { id: item.ledStockId },
          data: { status: newStatus }
        });
      }

      await prisma.stockMovement.create({
        data: {
          warehouseId: Number(item.warehouseId),
          videoEquipId: item.videoEquipId ? Number(item.videoEquipId) : null,
          ledStockId: item.ledStockId ? Number(item.ledStockId) : null,
          action: item.isDamaged ? 'DAMAGED' : 'RETURNED',
          quantity: item.quantity,
          inquiryId: Number(inquiryId),
          notes: item.isDamaged ? 'Returned with damage' : 'Returned safely'
        }
      });
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
          select: { videoStock: true, ledStock: true }
        }
      }
    });

    if (!warehouse) {
      res.status(404).json({ message: 'Warehouse not found' });
      return;
    }

    if (warehouse._count.videoStock > 0 || warehouse._count.ledStock > 0) {
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
