import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;
    const where: any = { deletedAt: null };
    if (category) where.category = category;
    if (status) where.status = status;

    const equipment = await prisma.videoEquipment.findMany({ where }); 
    res.json(equipment);
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
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { inquiryId, equipmentId, bookedFrom, bookedTo, position } = req.body;
    const booking = await prisma.videoEventBooking.create({
      data: {
        inquiryId: Number(inquiryId),
        equipmentId: Number(equipmentId),
        bookedFrom: new Date(bookedFrom),
        bookedTo: new Date(bookedTo),
        position,
        status: 'BOOKED'
      }
    });
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
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
