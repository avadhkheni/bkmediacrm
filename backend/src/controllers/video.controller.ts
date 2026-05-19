import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;
    const where: any = { deletedAt: null };
    if (category) where.category = category;
    
    if (status === 'AVAILABLE') {
      where.OR = [
        { status: 'AVAILABLE' },
        { availableQuantity: { gt: 0 } }
      ];
    } else if (status === 'IN_USE') {
      where.OR = [
        { status: 'IN_USE' },
        { inUseQuantity: { gt: 0 } }
      ];
    } else if (status) {
      where.status = status;
    }

    const equipment = await prisma.videoEquipment.findMany({ where }); 
    
    const mapped = equipment.map(e => {
      let computedStatus = e.status;
      if (e.availableQuantity > 0) computedStatus = 'AVAILABLE';
      else if (e.inUseQuantity > 0) computedStatus = 'IN_USE';
      else if (e.maintenanceQuantity > 0) computedStatus = 'MAINTENANCE';
      
      return { ...e, status: computedStatus };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Error fetching equipment' });
  }
};

  export const createEquipment = async (req: Request, res: Response) => {
    try {
      const { name, category, brand, model, serialNumber, totalQuantity, availableQuantity, inUseQuantity, maintenanceQuantity, ratePerDay, status, notes, warehouseId } = req.body;
      const equipment = await prisma.videoEquipment.create({
        data: {
          name,
          category,
          brand,
          model,
          serialNumber,
          totalQuantity: totalQuantity ? Number(totalQuantity) : 1,
          availableQuantity: availableQuantity !== undefined ? Number(availableQuantity) : (totalQuantity ? Number(totalQuantity) : 1),
          inUseQuantity: inUseQuantity ? Number(inUseQuantity) : 0,
          maintenanceQuantity: maintenanceQuantity ? Number(maintenanceQuantity) : 0,
          ratePerDay: ratePerDay ? Number(ratePerDay) : null,
          status: status || 'AVAILABLE',
          notes,
          warehouseId: warehouseId ? Number(warehouseId) : null
        }
      });
    res.status(201).json(equipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ message: 'Error creating equipment' });
  }
};

  export const updateEquipment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, category, brand, model, serialNumber, totalQuantity, availableQuantity, inUseQuantity, maintenanceQuantity, ratePerDay, status, notes, warehouseId } = req.body;
      const equipment = await prisma.videoEquipment.update({
        where: { id: Number(id) },
        data: {
          name,
          category,
          brand,
          model,
          serialNumber,
          totalQuantity: (availableQuantity !== undefined || inUseQuantity !== undefined || maintenanceQuantity !== undefined) 
            ? (Number(availableQuantity || 0) + Number(inUseQuantity || 0) + Number(maintenanceQuantity || 0))
            : (totalQuantity ? Number(totalQuantity) : undefined),
          availableQuantity: availableQuantity !== undefined ? Number(availableQuantity) : undefined,
          inUseQuantity: inUseQuantity !== undefined ? Number(inUseQuantity) : undefined,
          maintenanceQuantity: maintenanceQuantity !== undefined ? Number(maintenanceQuantity) : undefined,
          ratePerDay: ratePerDay ? Number(ratePerDay) : null,
          status,
          notes,
          warehouseId: warehouseId ? Number(warehouseId) : null
        }
      });
    res.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ message: 'Error updating equipment' });
  }
};

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const where: any = {};
    if (inquiryId) where.inquiryId = Number(inquiryId);

    const bookings = await prisma.videoEventBooking.findMany({
      where,
      include: { equipment: true }
    });

    const vendors = await prisma.vendor.findMany({
      where: {
        OR: [
          { department: 'VIDEO' },
          { department: { contains: 'VIDEO' } }
        ]
      }
    });

    const bookingsWithVendor = bookings.map(b => ({
      ...b,
      vendor: b.vendorId ? vendors.find(v => v.id === b.vendorId) : null
    }));

    res.json(bookingsWithVendor);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { inquiryId, equipmentId, bookedFrom, bookedTo, position, vendorId, vendorCost } = req.body;

    const isOutsourced = !!vendorId;

    if (!isOutsourced) {
      // Check availability
      const equip = await prisma.videoEquipment.findUnique({ where: { id: Number(equipmentId) } });
      if (!equip || equip.availableQuantity <= 0) {
        return res.status(400).json({ message: 'Equipment not available in warehouse stock' });
      }
    }

    const booking = await prisma.videoEventBooking.create({
      data: {
        inquiryId: Number(inquiryId),
        equipmentId: Number(equipmentId),
        bookedFrom: new Date(bookedFrom),
        bookedTo: new Date(bookedTo),
        position,
        status: 'BOOKED',
        vendorId: vendorId ? Number(vendorId) : null,
        vendorCost: vendorCost ? Number(vendorCost) : null
      }
    });

    if (!isOutsourced) {
      // Update stock
      await prisma.videoEquipment.update({
        where: { id: Number(equipmentId) },
        data: {
          availableQuantity: { decrement: 1 },
          inUseQuantity: { increment: 1 }
        }
      });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.videoEventBooking.findUnique({ where: { id: Number(id) } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await prisma.videoEventBooking.delete({ where: { id: Number(id) } });

    // Restore stock ONLY if it wasn't outsourced from a vendor
    if (!booking.vendorId) {
      await prisma.videoEquipment.update({
        where: { id: booking.equipmentId },
        data: {
          availableQuantity: { increment: 1 },
          inUseQuantity: { decrement: 1 }
        }
      });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Error deleting booking' });
  }
};

export const getDataSheets = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const dataSheets = await prisma.videoDataSheet.findMany({
      where: { inquiryId: Number(inquiryId) },
      include: { entries: true }
    });
    res.json(dataSheets);
  } catch (error) {
    console.error('Error fetching data sheets:', error);
    res.status(500).json({ message: 'Error fetching data sheets' });
  }
};

export const createDataSheet = async (req: Request, res: Response) => {
  try {
    const { inquiryId, dayNumber, eventDate, sessionName } = req.body;
    const dataSheet = await prisma.videoDataSheet.create({
      data: {
        inquiryId: Number(inquiryId),
        dayNumber: Number(dayNumber),
        eventDate: new Date(eventDate),
        sessionName
      }
    });
    res.status(201).json(dataSheet);
  } catch (error) {
    console.error('Error creating data sheet:', error);
    res.status(500).json({ message: 'Error creating data sheet' });
  }
};

export const createDataSheetEntriesBulk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { entries } = req.body;

    const createdEntries = await prisma.videoDataSheetEntry.createMany({
      data: entries.map((e: any) => ({
        dataSheetId: Number(id),
        cameraPosition: e.cameraPosition,
        dataGb: Number(e.dataGb),
        notes: e.notes
      }))
    });

    res.json(createdEntries);
  } catch (error) {
    console.error('Error creating bulk entries:', error);
    res.status(500).json({ message: 'Error creating entries' });
  }
};

export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.videoEquipment.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });
    res.json({ message: 'Equipment soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Error deleting equipment' });
  }
};
