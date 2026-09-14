'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import notificationApi, { type AppNotification } from '@/lib/apis/notification.api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export type { AppNotification };

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const notificationsRef = useRef<AppNotification[]>([]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  // Lấy danh sách thông báo ban đầu
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    notificationApi
      .getNotifications(0, 20)
      .then((page) => {
        const items = page.content ?? [];
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read).length);
      })
      .catch(() => {
        // Không hiển thị lỗi, chỉ để trống
      });
  }, []);

  // Kết nối WebSocket (STOMP qua SockJS) để nhận thông báo realtime
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    let client: { subscribe: (d: string, cb: (m: { body: string }) => void) => void; activate: () => void; deactivate: () => void } | null = null;
    let active = true;

    (async () => {
      const [{ Client }, SockJSMod] = await Promise.all([
        import('@stomp/stompjs'),
        import('sockjs-client'),
      ]);
      if (!active) return;

      const SockJS = ((SockJSMod as unknown as { default?: unknown }).default ?? SockJSMod) as unknown as new (url: string) => WebSocket;
      const stompClient = new Client({
        webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          setConnected(true);
          stompClient.subscribe('/user/queue/notifications', (message) => {
            try {
              const n = JSON.parse(message.body) as AppNotification;
              setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
              setUnreadCount((c) => c + 1);
            } catch {
              // ignore parse errors
            }
          });
        },
        onStompError: () => setConnected(false),
        onWebSocketClose: () => setConnected(false),
      });

      client = stompClient as unknown as typeof client;
      stompClient.activate();
    })();

    return () => {
      active = false;
      client?.deactivate();
    };
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markAsRead(id);
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllAsRead();
    } catch {
      // ignore
    }
  }, []);

  const hideNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.hideNotification(id);
    } catch {
      // ignore
    }
  }, []);

  const hideAllFromActor = useCallback(async (actorId: string) => {
    const removedUnread = notificationsRef.current.filter(
      (n) => n.actorId === actorId && !n.read
    ).length;
    setNotifications((prev) => prev.filter((n) => n.actorId !== actorId));
    setUnreadCount((c) => Math.max(0, c - removedUnread));
    try {
      await notificationApi.hideAllFromActor(actorId);
    } catch {
      // ignore
    }
  }, []);

  return { notifications, unreadCount, connected, markAsRead, markAllAsRead, hideNotification, hideAllFromActor };
};
