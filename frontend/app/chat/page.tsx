'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Calendar } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/app/context/AuthContext';

import { getChatRooms } from '@/app/lib/api/chat';
import { ChatRoom } from '@/app/lib/api/types';

import { formatDate } from '@/app/lib/utils';

import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';

export default function ChatPage() {
  // Get authentication context
  const { isAuthenticated } = useAuth();
  // State variables for chat rooms
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat rooms when the component mounts or when authentication status changes
  useEffect(() => {
    const fetchChatRooms = async () => {
      // Check if user is authenticated
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        // Fetch chat rooms response from the API
        const response = await getChatRooms();

        // Set chat rooms data to state
        setChatRooms(response.chat_rooms);
        setError(null);
      } catch (err) {
        // Handle error
        console.error('⚠️ Error while getting chats:', err);
        setError('⚠️ Error while getting chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="container mx-auto my-auto px-4 py-20 min-h-screen flex justify-center">
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
      <h1 className="text-3xl font-bold mb-6">My Chats</h1>

      {chatRooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Active chats not found</p>
          <p className="text-sm text-gray-500">
            You can start a new chat with a mentor or join an event chat.
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
                            ? 'Event Chat'
                            : 'Mentorship Chat'}
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
                        No messages yet. Start the conversation!
                      </div>
                    )}

                    <div className="flex justify-end items-center mt-auto pt-3 text-xs text-gray-500">
                      <Calendar size={12} className="mr-1" />
                      Created: {formatDate(room.created_at).split(' ')[0]}
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
