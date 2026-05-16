import { prisma } from '../utils/prisma';

export async function getStaffAvailability(startDate: string, endDate: string, role?: string, dept?: string) {
  const allStaff = await prisma.staff.findMany({
    where: {
      isActive: true,
      ...(role && { role }),
      ...(dept && { department: dept })
    },
    include: {
      assignments: {
        include: { inquiry: { select: { eventName: true, startDate: true, endDate: true } } }
      }
    }
  });

  return allStaff.map(s => {
    const conflicts = s.assignments.filter(a =>
      a.inquiry.startDate <= new Date(endDate) &&
      a.inquiry.endDate >= new Date(startDate)
    );
    const status = conflicts.length === 0
      ? 'AVAILABLE'
      : conflicts.some(c =>
          c.inquiry.startDate <= new Date(startDate) &&
          c.inquiry.endDate >= new Date(endDate))
        ? 'BUSY' : 'PARTIAL';
        
    return {
      ...s,
      status,
      busyInEvent: conflicts[0]?.inquiry.eventName || null,
      busyDates: conflicts.map(c => ({
        from: c.inquiry.startDate,
        to: c.inquiry.endDate,
        event: c.inquiry.eventName
      }))
    };
  });
}

export async function getLedAvailability(startDate: string, endDate: string) {
  const stocks = await prisma.ledStock.findMany({
    where: { isActive: true },
    include: {
      allocations: {
        include: { inquiry: { select: { eventName: true, startDate: true, endDate: true } } }
      }
    }
  });

  return stocks.map(l => {
    const activeBookings = l.allocations.filter(a =>
      a.inquiry.startDate <= new Date(endDate) &&
      a.inquiry.endDate >= new Date(startDate)
    );
    const bookedSqft = activeBookings.reduce((s, a) => s + a.allocatedSqft, 0);
    const availableSqft = Math.max(0, l.pricingSqft - bookedSqft);
    const status = bookedSqft === 0 ? 'ALL_FREE'
                 : availableSqft === 0 ? 'ALL_BOOKED' : 'PARTIAL';
                 
    return {
      ...l,
      bookedSqft,
      availableSqft,
      status,
      bookings: activeBookings.map(a => ({
        event: a.inquiry.eventName,
        sqft: a.allocatedSqft,
        from: a.inquiry.startDate,
        to: a.inquiry.endDate
      }))
    };
  });
}

export async function getVideoEquipmentAvailability(startDate: string, endDate: string, category?: string) {
  const equipment = await prisma.videoEquipment.findMany({
    where: {
      status: { not: 'MAINTENANCE' },
      ...(category && { category })
    },
    include: {
      bookings: {
        include: { inquiry: { select: { eventName: true } } }
      }
    }
  });

  return equipment.map(e => {
    const activeBooking = e.bookings.find(b =>
      b.bookedFrom <= new Date(endDate) &&
      b.bookedTo >= new Date(startDate) &&
      b.status !== 'RETURNED'
    );
    return {
      ...e,
      status: activeBooking ? 'IN_USE' : 'AVAILABLE',
      bookedInEvent: activeBooking?.inquiry.eventName || null,
      booking: activeBooking
        ? { from: activeBooking.bookedFrom, to: activeBooking.bookedTo, event: activeBooking.inquiry.eventName }
        : null
    };
  });
}
