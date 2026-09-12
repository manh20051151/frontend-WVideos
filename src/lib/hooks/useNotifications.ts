'use client';

import { useState } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, setNotifications };
};
