import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext(null);

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Authenticated Session Active',
    message: 'User logged in successfully with 256-bit signed JWT session.',
    type: 'success',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Audit Trail Telemetry Synchronized',
    message: 'PostgreSQL connection verified with securecipher_db on localhost:5432.',
    type: 'info',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Cryptographic Engine Online',
    message: 'All 6 primitives (AES-256-GCM, RSA-OAEP, Diffie-Hellman, SHA-256, MD5, DES) ready.',
    type: 'info',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'notif-4',
    title: 'Zero-Knowledge Memory Verified',
    message: 'Ephemeral memory cleanup executed; no secret keys stored in persistent database.',
    type: 'warning',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    read: true,
  },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('securecipher_notifications');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('securecipher_notif_settings');
      return saved
        ? JSON.parse(saved)
        : {
            securityAlerts: true,
            auditLogs: true,
            executionAlerts: true,
            emailDigest: false,
          };
    } catch {
      return {
        securityAlerts: true,
        auditLogs: true,
        executionAlerts: true,
        emailDigest: false,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('securecipher_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('securecipher_notif_settings', JSON.stringify(settings));
  }, [settings]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const addNotification = ({ title, message, type = 'info' }) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        markAsRead,
        markAllAsRead,
        clearAll,
        addNotification,
        updateSetting,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
