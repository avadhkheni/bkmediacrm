import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getSoundSetup = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    if (!inquiryId) return res.status(400).json({ message: 'inquiryId is required' });

    let setup = await prisma.soundSetup.findUnique({
      where: { inquiryId: Number(inquiryId) }
    });

    if (!setup) {
      // Create a default one if not exists
      setup = await prisma.soundSetup.create({
        data: { inquiryId: Number(inquiryId) }
      });
    }

    res.json(setup);
  } catch (error) {
    console.error('Error fetching sound setup:', error);
    res.status(500).json({ message: 'Error fetching sound setup' });
  }
};

export const upsertSoundSetup = async (req: Request, res: Response) => {
  try {
    const { inquiryId, ...data } = req.body;
    if (!inquiryId) return res.status(400).json({ message: 'inquiryId is required' });

    // Calculate total wattage if speakers/wattage changed
    // This is a simple logic, can be more complex
    const wattage = data.totalWattage || 0;

    const setup = await prisma.soundSetup.upsert({
      where: { inquiryId: Number(inquiryId) },
      update: {
        ...data,
        powerRequiredKw: (Number(wattage) * 1.5) / 1000 // Simple rule of thumb: 1.5x for headroom
      },
      create: {
        inquiryId: Number(inquiryId),
        ...data,
        powerRequiredKw: (Number(wattage) * 1.5) / 1000
      }
    });

    res.json(setup);
  } catch (error) {
    console.error('Error saving sound setup:', error);
    res.status(500).json({ message: 'Error saving sound setup' });
  }
};

export const getSoundEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = await prisma.soundEquipment.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment' });
  }
};

export const updateSoundWorkflow = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.params;
    const { field, value } = req.body;

    const setup = await prisma.soundSetup.update({
      where: { inquiryId: Number(inquiryId) },
      data: { [field]: value }
    });

    res.json(setup);
  } catch (error) {
    res.status(500).json({ message: 'Error updating workflow' });
  }
};

export const getSoundBookings = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.query;
    const bookings = await prisma.soundEventBooking.findMany({
      where: { inquiryId: Number(inquiryId) },
      include: { equipment: true }
    });

    const vendors = await prisma.vendor.findMany({
      where: { department: 'SOUND' }
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

export const createSoundBooking = async (req: Request, res: Response) => {
  try {
    const { inquiryId, equipmentId, position, bookedFrom, bookedTo, vendorId, vendorCost } = req.body;

    const isOutsourced = !!vendorId;

    if (!isOutsourced) {
      // Check availability (simple)
      const equip = await prisma.soundEquipment.findUnique({ where: { id: equipmentId } });
      if (!equip || equip.availableQuantity <= 0) {
        return res.status(400).json({ message: 'Equipment not available in warehouse stock' });
      }
    }

    const booking = await prisma.soundEventBooking.create({
      data: {
        inquiryId: Number(inquiryId),
        equipmentId: Number(equipmentId),
        position,
        bookedFrom: new Date(bookedFrom),
        bookedTo: new Date(bookedTo),
        vendorId: vendorId ? Number(vendorId) : null,
        vendorCost: vendorCost ? Number(vendorCost) : null
      }
    });

    if (!isOutsourced) {
      // Update stock
      await prisma.soundEquipment.update({
        where: { id: equipmentId },
        data: {
          availableQuantity: { decrement: 1 },
          inUseQuantity: { increment: 1 }
        }
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error creating sound booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
};

export const deleteSoundBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.soundEventBooking.findUnique({ where: { id: Number(id) } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await prisma.soundEventBooking.delete({ where: { id: Number(id) } });

    // Restore stock ONLY if it wasn't outsourced from a vendor
    if (!booking.vendorId) {
      await prisma.soundEquipment.update({
        where: { id: booking.equipmentId },
        data: {
          availableQuantity: { increment: 1 },
          inUseQuantity: { decrement: 1 }
        }
      });
    }

    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking' });
  }
};

export const createSoundEquipment = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const equipment = await prisma.soundEquipment.create({
      data: {
        ...data,
        availableQuantity: Number(data.totalQuantity || 1),
        totalQuantity: Number(data.totalQuantity || 1),
        ratePerDay: Number(data.ratePerDay || 0)
      }
    });
    res.status(201).json(equipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ message: 'Error creating equipment' });
  }
};

export const updateSoundEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const equipment = await prisma.soundEquipment.update({
      where: { id: Number(id) },
      data: {
        ...data,
        totalQuantity: data.totalQuantity ? Number(data.totalQuantity) : undefined,
        ratePerDay: data.ratePerDay ? Number(data.ratePerDay) : undefined
      }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating equipment' });
  }
};

export const deleteSoundEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.soundEquipment.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() }
    });
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting equipment' });
  }
};
