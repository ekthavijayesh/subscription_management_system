"use server";

/**
 * TASK-054 — Notification Server Actions
 */

import { requireAuth } from "@/lib/auth/authorization";
import {
  listUserNotifications,
  markNotificationAsRead,
  type NotificationRecord,
} from "@/lib/services/notification.service";

export interface NotificationActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getUserNotificationsAction(
  limit: number = 20
): Promise<NotificationActionResult<NotificationRecord[]>> {
  try {
    const session = await requireAuth();
    const list = await listUserNotifications(session.user.id, limit);
    return { success: true, data: list };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load notifications";
    return { success: false, error: message };
  }
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  try {
    const session = await requireAuth();
    await markNotificationAsRead(notificationId, session.user.id);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update notification";
    return { success: false, error: message };
  }
}
