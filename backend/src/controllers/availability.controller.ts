import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getStaffAvailabilityController = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(String(startDate));
    const end = new Date(String(endDate));

    const staff = await prisma.staff.findMany({
      where: { deletedAt: null },
      include: {
        assignments: {
          where: {
            inquiry: {
              OR: [
                { startDate: { lte: end }, endDate: { gte: start } }
              ]
            }
          },
          include: { inquiry: true }
        }
      }
    });

    const availability = staff.map(s => ({
      ...s,
      isAvailable: s.assignments.length === 0,
      bookedIn: s.assignments.map(a => a.inquiry.eventName)
    }));

    res.json(availability);
  } catch (error) {
    console.error('Error fetching staff availability:', error);
    res.status(500).json({ message: 'Error fetching availability' });
  }
};

export const getLedAvailabilityController = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(String(startDate));
    const end = new Date(String(endDate));

    const stock = await prisma.ledStock.findMany({
      where: { deletedAt: null },
      include: {
        allocations: {
          where: {
            inquiry: {
              OR: [
                { startDate: { lte: end }, endDate: { gte: start } }
              ]
            }
          }
        }
      }
    });

    const availability = stock.map(s => {
      const totalBookedSqft = s.allocations.reduce((sum, a) => sum + a.allocatedSqft, 0);
      return {
        ...s,
        availableSqft: s.pricingSqft - totalBookedSqft,
        bookedSqft: totalBookedSqft
      };
    });

    res.json(availability);
  } catch (error) {
    console.error('Error fetching LED availability:', error);
    res.status(500).json({ message: 'Error fetching availability' });
  }
};

export const getVideoEquipmentAvailabilityController = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(String(startDate));
    const end = new Date(String(endDate));

    const equipment = await prisma.videoEquipment.findMany({
      where: { deletedAt: null },
      include: {
        bookings: {
          where: {
            OR: [
              { bookedFrom: { lte: end }, bookedTo: { gte: start } }
            ]
          }
        }
      }
    });

    const availability = equipment.map(e => ({
      ...e,
      isAvailable: e.bookings.length === 0,
      bookedEvents: e.bookings.length
    }));

    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching availability' });
  }
};

export const getSoundEquipmentAvailabilityController = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(String(startDate));
    const end = new Date(String(endDate));

    const equipment = await prisma.soundEquipment.findMany({
      where: { deletedAt: null },
      include: {
        bookings: {
          where: {
            OR: [
              { bookedFrom: { lte: end }, bookedTo: { gte: start } }
            ]
          }
        }
      }
    });

    const availability = equipment.map(e => ({
      ...e,
      isAvailable: e.bookings.length === 0,
      bookedEvents: e.bookings.length
    }));

    res.json(availability);
  } catch (error) {
    console.error('Error fetching sound equipment availability:', error);
    res.status(500).json({ message: 'Error fetching availability' });
  }
};
