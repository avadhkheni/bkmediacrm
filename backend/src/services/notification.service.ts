import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { Server } from 'socket.io';

let io: Server;

export function setIoInstance(socketIo: Server) {
  io = socketIo;
}

export async function getNotifications() {
  return await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function markNotificationRead(id: string) {
  const numericId = parseInt(id.replace('notif-', '')) || parseInt(id);
  if (!isNaN(numericId)) {
    await prisma.notification.update({
      where: { id: numericId },
      data: { read: true }
    });
  }
}

async function addNotification(type: string, message: string, targetRoles: string[], inquiryId?: number) {
  try {
    const newNotif = await prisma.notification.create({
      data: {
        type,
        message,
        targetRoles: targetRoles.join(','),
        inquiryId,
        read: false
      }
    });

    // Emit live notification via socket
    if (io) {
      io.emit('new_notification', {
        ...newNotif,
        targetRoles: targetRoles // Send as array for frontend
      });
    }

    console.log(`[Notification] ${type}: ${message}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// ─── Cron Job 1: 3 days before event → Dept (product list reminder) ──────
export function startEventReminderJob() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const targetDate = threeDaysFromNow.toISOString().split('T')[0];

      const upcomingEvents = await prisma.inquiry.findMany({
        where: {
          startDate: {
            gte: new Date(targetDate),
            lte: new Date(new Date(targetDate).getTime() + 86400000),
          },
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        },
        include: { client: { select: { name: true } } },
      });

      for (const event of upcomingEvents) {
        await addNotification(
          'EVENT_REMINDER_3D',
          `Event "${event.eventName}" for ${event.client?.name} starts in 3 days. Prepare product list!`,
          event.department === 'VIDEO' ? ['VIDEO_DEPT', 'OPERATIONAL'] : ['LED_DEPT', 'OPERATIONAL'],
          event.id,
        );
      }
    } catch (error) {
      console.error('Event reminder cron error:', error);
    }
  });
}

// ─── Cron Job 2: 4 days before event end → Accounts (payment reminder) ────
export function startPaymentReminderJob() {
  cron.schedule('30 9 * * *', async () => {
    try {
      const fourDaysFromNow = new Date();
      fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
      const targetDate = fourDaysFromNow.toISOString().split('T')[0];

      const endingEvents = await prisma.inquiry.findMany({
        where: {
          endDate: {
            gte: new Date(targetDate),
            lte: new Date(new Date(targetDate).getTime() + 86400000),
          },
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        },
        include: {
          client: { select: { name: true } },
          invoices: { where: { status: { in: ['PENDING', 'PARTIAL'] } } },
        },
      });

      for (const event of endingEvents) {
        if (event.invoices.length > 0) {
          await addNotification(
            'PAYMENT_REMINDER',
            `Event "${event.eventName}" ending soon. Outstanding payment from ${event.client?.name}. Follow up!`,
            ['ACCOUNTS', 'FINANCE', 'ADMIN'],
            event.id,
          );
        }
      }
    } catch (error) {
      console.error('Payment reminder cron error:', error);
    }
  });
}

// ─── Notification Triggers (called from controllers) ──────────────────────

export async function notifyQuotationApproved(inquiryId: number, eventName: string) {
  await addNotification(
    'QUOTATION_APPROVED',
    `Quotation for "${eventName}" has been approved. Warehouse and dept managers - prepare allocations!`,
    ['OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT'],
    inquiryId,
  );
}

export async function notifyPaymentReceived(inquiryId: number, eventName: string, amount: number) {
  await addNotification(
    'PAYMENT_RECEIVED',
    `Payment of ₹${amount.toLocaleString()} received for "${eventName}".`,
    ['ADMIN', 'ACCOUNTS'],
    inquiryId,
  );
}

export async function notifyStaffAssigned(staffId: number, staffName: string, eventName: string) {
  await addNotification(
    'STAFF_ASSIGNED',
    `${staffName} has been assigned to "${eventName}".`,
    ['STAFF', 'OPERATIONAL'],
  );
}

// Start all cron jobs
export function startAllNotificationJobs() {
  startEventReminderJob();
  startPaymentReminderJob();
  console.log('[Notifications] Cron jobs started.');
}
