import { create } from 'zustand';
import api from '@/lib/api';

interface Notification {
  id: number;
  type: string;
  message: string;
  targetRoles: string;
  inquiryId?: number;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      // In persistent version, the backend returns formatted notifications
      set({ 
        notifications: data,
        unreadCount: data.filter((n: Notification) => !n.read).length
      });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  },
  addNotification: (notification) => {
    set((state) => {
      const newNotifications = [notification, ...state.notifications].slice(0, 100);
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length
      };
    });
  },
  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => {
        const newNotifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter((n) => !n.read).length,
        };
      });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },
}));
