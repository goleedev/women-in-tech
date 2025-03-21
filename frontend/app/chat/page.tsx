'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { getChatRooms } from '@/app/lib/api/chat';
import { ChatRoom } from '@/app/lib/api/types';
import { Card, CardContent } from '@/app/ui/Card';
import { formatDate } from '@/app/lib/utils';
import { MessageSquare, Calendar } from 'lucide-react';

export default function ChatPage() {
  const { isAuthenticated } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const response = await getChatRooms();
        setChatRooms(response.chat_rooms);
        setError(null);
      } catch (err) {
        console.error('채팅방 목록 조회 오류:', err);
        setError('채팅방 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [isAuthenticated]);

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
      <h1 className="text-3xl font-bold mb-6">내 채팅방</h1>

      {chatRooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">활성화된 채팅방이 없습니다.</p>
          <p className="text-sm text-gray-500">
            이벤트에 참가하거나 멘토십 연결을 통해 채팅방에 참여할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatRooms.map((room) => (
            <Link key={room.id} href={`/chat/${room.id}`}>
              <Card className="hover:shadow-md transition-shadow duration-200 h-full">
                <CardContent className="p-0">
                  <div
                    className={`h-2 ${
                      room.type === 'event' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  ></div>
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-grow">
                        <h3 className="font-medium mb-1 line-clamp-1">
                          {room.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {room.type === 'event'
                            ? '이벤트 채팅'
                            : '멘토십 채팅'}
                        </p>
                      </div>

                      {room.unread_count > 0 && (
                        <span className="bg-red-100 text-red-600 rounded-full px-2 py-1 text-xs">
                          {room.unread_count}
                        </span>
                      )}
                    </div>

                    {room.last_message ? (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          <span className="font-medium">
                            {room.last_message.sender_name}:{' '}
                          </span>
                          {room.last_message.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(room.last_message.created_at)}
                        </p>
                      </div>
                    ) : (
                      <div className="border-t pt-3 mt-3 flex items-center text-sm text-gray-500">
                        <MessageSquare size={14} className="mr-1" />
                        대화를 시작해보세요
                      </div>
                    )}

                    <div className="flex justify-end items-center mt-auto pt-3 text-xs text-gray-500">
                      <Calendar size={12} className="mr-1" />
                      생성됨: {formatDate(room.created_at).split(' ')[0]}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
