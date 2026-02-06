import { getDb } from "./index";
import { v4 as uuidv4 } from "uuid";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  data?: string;
  isRead: boolean;
  createdAt: string;
}

export function createNotification(data: {
  userId: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}): Notification {
  const db = getDb();
  const id = uuidv4();

  db.prepare(
    `INSERT INTO notifications (id, user_id, type, message, data) VALUES (?, ?, ?, ?, ?)`
  ).run(id, data.userId, data.type, data.message, data.data ? JSON.stringify(data.data) : null);

  return {
    id,
    userId: data.userId,
    type: data.type,
    message: data.message,
    data: data.data ? JSON.stringify(data.data) : undefined,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
}

export function getUserNotifications(userId: string, unreadOnly = false): Notification[] {
  const db = getDb();
  const query = unreadOnly
    ? "SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC"
    : "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";

  const rows = db.prepare(query).all(userId) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    message: row.message as string,
    data: row.data as string | undefined,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at as string,
  }));
}

export function markNotificationRead(id: string): void {
  const db = getDb();
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
}

export function markAllNotificationsRead(userId: string): void {
  const db = getDb();
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(userId);
}
