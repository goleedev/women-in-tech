'use client';

import { fetchAPI } from './client';
import { Notification, Pagination } from './types';

// Define the types for notification parameters
export interface NotificationParams {
  is_read?: boolean;
  page?: number;
  limit?: number;
}

// Define the types for notification data
export const getNotifications = async (
  params?: NotificationParams
): Promise<{
  notifications: Notification[];
  unread_count: number;
  pagination: Pagination;
}> => {
  // Get the query parameters
  const queryParams = new URLSearchParams();

  // Append the parameters to the query string
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
  }

  // Construct the URL with query parameters
  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : '';

  // Fetch notifications from the API
  return await fetchAPI<{
    notifications: Notification[];
    unread_count: number;
    pagination: Pagination;
  }>(`/notifications${queryString}`);
};

// Create a function to mark a notification as read
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

// Create a function to mark all notifications as read
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
