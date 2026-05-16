import { Request, Response } from 'express';
import { getNotifications, markNotificationRead } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || '';
    const all = await getNotifications();
    
    // Filter notifications for the user's role (ADMIN sees all)
    const filtered = userRole === 'ADMIN'
      ? all
      : all.filter(n => n.targetRoles.split(',').includes(userRole));
      
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await markNotificationRead(id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification:', error);
    res.status(500).json({ message: 'Error marking notification' });
  }
};
