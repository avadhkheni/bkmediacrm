"use client";

import { useState, useEffect } from "react";
import { Bell, X, Info, CheckCircle, AlertTriangle, CreditCard } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { io } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, addNotification, markAsRead } = useNotificationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchNotifications();

    const socket = io("http://localhost:5001");

    socket.on("new_notification", (notification) => {
      // Only add if the user's role is in targetRoles
      const rolesArray = Array.isArray(notification.targetRoles) 
        ? notification.targetRoles 
        : notification.targetRoles.split(',');

      if (user?.role === 'ADMIN' || rolesArray.includes(user?.role)) {
        addNotification(notification);
        // Optional: Trigger a browser notification or sound
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, fetchNotifications, addNotification]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'QUOTATION_APPROVED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PAYMENT_RECEIVED': return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'EVENT_REMINDER_3D': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Bell className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm">Notifications</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={`p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors flex gap-3 ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="mt-1 shrink-0">{getIcon(notif.type)}</div>
                      <div className="space-y-1">
                        <p className={`text-sm ${!notif.read ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 text-center bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                <button className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline">
                  View All Notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
