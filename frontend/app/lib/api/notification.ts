// app/lib/api/notification.ts
'use client';

import { fetchAPI } from './client';
import { Notification, Pagination } from './types';

export interface NotificationParams {
  is_read?: boolean;
  page?: number;
  limit?: number;
}

export const getNotifications = async (
  params?: NotificationParams
): Promise<{
  notifications: Notification[];
  unread_count: number;
  pagination: Pagination;
}> => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : '';
  return await fetchAPI<{
    notifications: Notification[];
    unread_count: number;
    pagination: Pagination;
  }>(`/notifications${queryString}`);
};

export const markNotificationAsRead = async (
  notificationId: number | string
): Promise<{
  success: boolean;
  message: string;
}> => {
  return await fetchAPI<{ success: boolean; message: string }>(
    `/notifications/${notificationId}/read`,
    {
      method: 'PUT',
    }
  );
};

export const markAllNotificationsAsRead = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  return await fetchAPI<{ success: boolean; message: string }>(
    '/notifications/read-all',
    {
      method: 'PUT',
    }
  );
};
