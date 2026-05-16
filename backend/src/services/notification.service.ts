import cron from 'node-cron';
import { prisma } from '../utils/prisma';

// In-memory notification store (in production, use DB or push notifications)
interface Notification {
  id: string;
  type: string;
  message: string;
  targetRoles: string[];
  inquiryId?: number;
  createdAt: Date;
  read: boolean;
}

let notifications: Notification[] = [];
let notifCounter = 0;

export function getNotifications(): Notification[] {
  return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function markNotificationRead(id: string): void {
  const n = notifications.find(n => n.id === id);
  if (n) n.read = true;
}

function addNotification(type: string, message: string, targetRoles: string[], inquiryId?: number) {
  notifCounter++;
  notifications.push({
    id: `notif-${notifCounter}`,
    type,
    message,
    targetRoles,
    inquiryId,
    createdAt: new Date(),
    read: false,
  });
  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications = notifications.slice(-100);
  }
  console.log(`[Notification] ${type}: ${message}`);
}

// ─── Cron Job 1: 3 days before event → Dept (product list reminder) ──────
// Runs daily at 9:00 AM
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
        addNotification(
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
// Runs daily at 9:30 AM
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
          addNotification(
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

export function notifyQuotationApproved(inquiryId: number, eventName: string) {
  addNotification(
    'QUOTATION_APPROVED',
    `Quotation for "${eventName}" has been approved. Warehouse and dept managers - prepare allocations!`,
    ['OPERATIONAL', 'VIDEO_DEPT', 'LED_DEPT'],
    inquiryId,
  );
}

export function notifyPaymentReceived(inquiryId: number, eventName: string, amount: number) {
  addNotification(
    'PAYMENT_RECEIVED',
    `Payment of ₹${amount.toLocaleString()} received for "${eventName}".`,
    ['ADMIN', 'ACCOUNTS'],
    inquiryId,
  );
}

export function notifyStaffAssigned(staffId: number, staffName: string, eventName: string) {
  addNotification(
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
