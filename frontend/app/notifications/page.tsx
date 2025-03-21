'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/app/lib/api/notification';
import { Notification } from '@/app/lib/api/types';
import { Card, CardContent } from '@/app/ui/Card';
import Button from '@/app/ui/Button';
import { formatDate } from '@/app/lib/utils';
import { Bell, BellOff, MessageSquare, Calendar, UserPlus } from 'lucide-react';

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const response = await getNotifications();
        setNotifications(response.notifications);
        setUnreadCount(response.unread_count);
        setError(null);
      } catch (err) {
        console.error('알림 목록 조회 오류:', err);
        setError('알림 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);

      // 알림 목록 업데이트
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // 읽지 않은 알림 수 업데이트
      setUnreadCount((prev) => prev - 1);
    } catch (err) {
      console.error('알림 읽음 처리 오류:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      // 모든 알림 읽음 처리
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );

      // 읽지 않은 알림 수 초기화
      setUnreadCount(0);
    } catch (err) {
      console.error('모든 알림 읽음 처리 오류:', err);
    }
  };

  // 현재 탭에 따라 필터링된 알림 목록
  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter((notification) => !notification.is_read);

  // 알림 아이콘 선택
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="flex-shrink-0 text-blue-600" size={20} />;
      case 'mentorship_request':
        return <UserPlus className="flex-shrink-0 text-green-600" size={20} />;
      case 'message':
        return (
          <MessageSquare className="flex-shrink-0 text-purple-600" size={20} />
        );
      default:
        return <Bell className="flex-shrink-0 text-gray-600" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            모두 읽음으로 표시
          </Button>
        )}
      </div>

      {/* 탭 */}
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
            모든 알림
          </button>
          <button
            className={`py-2 px-1 -mb-px ${
              activeTab === 'unread'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('unread')}
          >
            읽지 않은 알림
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
              ? '알림이 없습니다.'
              : '읽지 않은 알림이 없습니다.'}
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
                    {getNotificationIcon(notification.type)}
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
                          aria-label="읽음으로 표시"
                        >
                          <BellOff size={16} />
                        </button>
                      )}
                    </div>

                    {/* 알림 유형에 따른 액션 버튼 */}
                    <div className="mt-3">
                      {notification.type === 'event' && (
                        <Link href={`/events/${notification.reference_id}`}>
                          <Button variant="outline" size="sm">
                            이벤트 보기
                          </Button>
                        </Link>
                      )}

                      {notification.type === 'mentorship_request' && (
                        <Link href="/mentorship/connections">
                          <Button variant="outline" size="sm">
                            요청 확인
                          </Button>
                        </Link>
                      )}

                      {notification.type === 'message' &&
                        notification.reference_type === 'message' && (
                          <Link href={`/chat/${notification.reference_id}`}>
                            <Button variant="outline" size="sm">
                              메시지 보기
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
