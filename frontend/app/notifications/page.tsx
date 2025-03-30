'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/app/context/AuthContext';

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/app/lib/api/notification';
import { Notification } from '@/app/lib/api/types';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';

import { formatDate } from '@/app/lib/utils';

export default function NotificationsPage() {
  // Get authentication context
  const { isAuthenticated } = useAuth();

  // State variables for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Fetch notifications when the component mounts or when authentication status changes
  useEffect(() => {
    const fetchNotifications = async () => {
      // Check if user is authenticated
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        // Fetch notifications response from the API
        const response = await getNotifications();

        // Set notifications and unread count
        setNotifications(response.notifications);
        setUnreadCount(response.unread_count);
        setError(null);
      } catch (err) {
        // Handle error
        console.error('⚠️ Error while fetching notifications:', err);
        setError('⚠️ Error while fetching notifications');
      } finally {
        setLoading(false);
      }
    };

    // Call the fetch function
    fetchNotifications();
  }, [isAuthenticated]);

  // Function to mark a notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      // Mark notification as read using the API
      await markNotificationAsRead(notificationId);

      // Update the notification state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // Decrement the unread count
      setUnreadCount((prev) => prev - 1);
    } catch (err) {
      console.error('⚠️ Error while marking notifications as read:', err);
    }
  };

  // Function to mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      // Mark all notifications as read using the API
      await markAllNotificationsAsRead();

      // Update the notification state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );

      // Reset the unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('⚠️ Error while marking all notifications as read:', err);
    }
  };

  // Filter notifications based on the active tab
  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter((notification) => !notification.is_read);

  if (loading) {
    return (
      <div className="container mx-auto min-h-screen px-4 py-20 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold mb-2 md:mb-0">알림</h1>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <BellOff size={16} className="mr-1" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            className={`py-2 px-1 -mb-px ${
              activeTab === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All Notifications
          </button>
          <button
            className={`py-2 px-1 -mb-px ${
              activeTab === 'unread'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('unread')}
          >
            Unread Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {activeTab === 'all'
              ? 'No notifications.'
              : 'No unread notifications.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${
                notification.is_read ? 'bg-white' : 'bg-blue-50'
              } transition-colors duration-200`}
            >
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    <Bell className="flex-shrink-0 text-gray-600" size={20} />
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className={`${
                            notification.is_read ? 'font-normal' : 'font-medium'
                          }`}
                        >
                          {notification.content}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label="Mark as read"
                        >
                          <BellOff size={16} />
                        </button>
                      )}
                    </div>

                    <div className="mt-3">
                      {notification.type === 'event' && (
                        <Link href={`/events/${notification.reference_id}`}>
                          <Button variant="outline" size="sm">
                            View Event
                          </Button>
                        </Link>
                      )}

                      {notification.type === 'mentorship_request' && (
                        <Link href="/mentorship/connections">
                          <Button variant="outline" size="sm">
                            View Request
                          </Button>
                        </Link>
                      )}

                      {notification.type === 'message' &&
                        notification.reference_type === 'message' && (
                          <Link href={`/chat/${notification.reference_id}`}>
                            <Button variant="outline" size="sm">
                              View Message
                            </Button>
                          </Link>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
