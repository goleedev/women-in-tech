'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Send, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/app/context/AuthContext';

import {
  getChatMessages,
  joinChatRoom,
  sendMessage as apiSendMessage,
  markMessagesAsRead,
} from '@/app/lib/api/chat';
import { socketService } from '@/app/lib/api/socket';
import { Message } from '@/app/lib/api/types';

import { formatDate } from '@/app/lib/utils';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';

export default function ChatRoomPage() {
  // Get the room ID from the URL parameters
  const { id } = useParams();
  const roomId = id as string;
  // Get the authentication context
  const { user } = useAuth();
  // State variables for chat room and messages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch messages from the server
  const fetchMessages = useCallback(async () => {
    // Check if room ID is valid
    if (!roomId) return;

    try {
      // Get messages from the server
      const messagesResponse = await getChatMessages(roomId);

      // Get the messages and reverse them for display
      const sortedMessages = [...messagesResponse.messages].reverse();

      setMessages(sortedMessages);
      setHasMore(messagesResponse.has_more);

      // Mark messages as read
      await markMessagesAsRead(roomId);

      setError(null);
    } catch (err) {
      // Handle error
      console.error('⚠️ Error while getting messages:', err);
      setError('⚠️ Error while getting messages');
    } finally {
      setRefreshing(false);
    }
  }, [roomId]);

  useEffect(() => {
    let isMounted = true;

    // Join the chat room when the component mounts
    const joinRoom = async () => {
      if (!roomId) return;

      setLoading(true);
      try {
        // Get chat room information
        const joinResponse = await joinChatRoom(roomId);

        // Check if mounted
        if (isMounted) setChatRoom(joinResponse.chat_room);

        // Fetch more messages
        await fetchMessages();

        // Set the chat room as joined
        if (isMounted) setIsInitialized(true);
      } catch (err) {
        // Handle error
        console.error('⚠️ Error while joining the chat room:', err);
        if (isMounted) {
          setError('⚠️ Error while joining the chat room');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Join the chat room
    joinRoom();

    // Set up an interval for auto-refresh
    const autoRefreshInterval = setInterval(() => {
      if (isInitialized && !refreshing) {
        fetchMessages();
      }
    }, 5000);

    // Clean up the interval and refresh timer on unmount
    return () => {
      isMounted = false;
      clearInterval(autoRefreshInterval);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [roomId, fetchMessages, isInitialized]);

  // Handle new messages from the socket
  const handleNewMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      let messageData = data;

      // Check if data has payload
      if (data.payload) {
        messageData = data.payload;
      }

      // Check if message is from the current room
      const msgRoomId =
        messageData.room_id?.toString() || messageData.chat_room_id?.toString();

      if (msgRoomId !== roomId.toString()) return;

      // Check if message is from the current user
      if (!messageData.sender && messageData.sender_id) {
        messageData.sender = {
          id: messageData.sender_id,
          name: messageData.sender_name || 'Unknown',
        };
      }

      // Check if message is from the current user
      setMessages((prev) => {
        // Duplicate message check
        const msgId = messageData.id?.toString();

        if (msgId && prev.some((msg) => msg.id?.toString() === msgId)) {
          return prev;
        }

        // Temporary message check
        const tempIndex = prev.findIndex(
          (msg) =>
            typeof msg.id === 'string' &&
            (msg.id as string).startsWith('temp_') &&
            msg.content === messageData.content &&
            msg.sender.id === messageData.sender.id
        );

        if (tempIndex !== -1) {
          const newMessages = [...prev];
          newMessages[tempIndex] = messageData;

          return newMessages;
        }

        // Add new message
        return [...prev, messageData];
      });

      // Mark messages as read if not sent by the current user
      if (messageData.sender?.id !== user?.id) {
        markMessagesAsRead(roomId).catch(console.error);
      }

      // Refresh messages after a delay
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        fetchMessages();
      }, 300);
    },
    [roomId, user, fetchMessages]
  );

  // Set up the socket connection and event handlers
  useEffect(() => {
    if (!roomId || !user || !isInitialized) return;

    // Connect to the socket if not already connected
    if (!socketService?.isConnected()) {
      socketService?.connect();
    }

    // Set up the socket event handlers
    socketService?.on('new-message', handleNewMessage);

    // Join the chat room
    socketService?.joinRoom(roomId);

    return () => {
      // Clean up the socket event handlers
      socketService?.off('new-message', handleNewMessage);

      // Leave the chat room
      if (socketService?.isConnected()) {
        socketService?.leaveRoom(roomId);
      }
    };
  }, [roomId, user, isInitialized, handleNewMessage]);

  // Refresh messages when the refresh button is clicked
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchMessages();
  };

  // Scroll to the bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load more messages when the user scrolls to the top
  const loadMoreMessages = async () => {
    // Check if there are more messages to load
    if (!hasMore || loading) return;

    try {
      // Get the oldest message ID
      const oldestMsgId = messages.length > 0 ? messages[0].id : undefined;
      // Fetch more messages from the server
      const messagesResponse = await getChatMessages(roomId, {
        before: oldestMsgId,
        limit: 20,
      });

      // Reverse the messages for display
      const container = messageContainerRef.current;
      const scrollHeight = container?.scrollHeight || 0;

      setMessages((prev) => [...messagesResponse.messages.reverse(), ...prev]);
      setHasMore(messagesResponse.has_more);

      // Scroll to the top of the container
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - scrollHeight;
      }
    } catch (error) {
      console.error('⚠️ Error while loading messages:', error);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if the message is empty or if a message is already being sent
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);

    // Generate a temporary ID for the message
    const tempId = `temp_${Date.now()}`;

    // Create an optimistic message
    const optimisticMessage: Message = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: tempId as any, // 임시 ID
      chat_room_id: Number(roomId),
      sender: {
        id: user?.id ?? 0,
        name: user?.name || '',
      },
      content: newMessage,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      // Send the message through the socket or HTTP API
      if (socketService?.isConnected()) {
        socketService.sendMessage(roomId, newMessage);
      } else {
        // Send the message through the API
        const response = await apiSendMessage(roomId, newMessage);

        // Check if the response is successful
        if (response.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id.toString() === tempId
                ? {
                    ...response.message,
                    sender: { ...response.message.sender },
                  }
                : msg
            )
          );
        }
      }

      // Refresh messages after sending
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      // Set a timer to refresh messages
      refreshTimerRef.current = setTimeout(() => {
        fetchMessages();
      }, 500);
    } catch (err) {
      console.error('⚠️ Error while sending messages:', err);

      // Handle error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.toString() === tempId
            ? { ...msg, content: `${msg.content} (전송 실패)` }
            : msg
        )
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing event
  const handleTyping = () => {
    // Check if the user is typing
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a timeout to send the typing event
    debounceTimeoutRef.current = setTimeout(() => {
      if (socketService?.isConnected()) {
        socketService?.sendTyping(roomId);
      }
      debounceTimeoutRef.current = null;
    }, 300);
  };

  if (loading) {
    return (
      <div className="container mx-auto my-auto px-4 py-20 min-h-screen flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !chatRoom) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error || 'Chat room not found'}
        </div>
        <div className="text-center mt-4">
          <Link href="/chat">
            <Button variant="outline">Back to chats</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center mb-4">
        <Link href="/chat" className="mr-3">
          <Button variant="outline" size="sm" className="p-2">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-xl font-bold truncate">{chatRoom.name}</h1>
        <div className="flex items-center ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="mr-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </Button>
          <div className="text-sm">
            {socketService?.isConnected() ? (
              <span className="text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                Connected
              </span>
            ) : (
              <span className="text-yellow-600 flex items-center">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></span>
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        ref={messageContainerRef}
        className="flex-grow overflow-y-auto bg-gray-50 rounded-lg p-4"
      >
        {hasMore && (
          <div className="text-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreMessages}
              disabled={loading}
            >
              Load previous messages
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              // Check if the message is from the current user
              const isMyMessage = message.sender.id === user?.id;
              // Check if the message is a temporary message
              const isTempMessage =
                typeof message.id === 'string' &&
                (message.id as string).startsWith('temp_');

              return (
                <div
                  key={message.id || `msg-${index}`}
                  className={`flex ${
                    isMyMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs sm:max-w-sm md:max-w-md ${
                      isMyMessage
                        ? `bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg ${
                            isTempMessage ? 'opacity-70' : ''
                          }`
                        : 'bg-white border border-gray-200 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                    } p-3 shadow-sm`}
                  >
                    {!isMyMessage && (
                      <div className="font-medium text-sm mb-1">
                        {message.sender.name}
                      </div>
                    )}
                    <div className="mb-1">{message.content}</div>
                    <div
                      className={`text-xs ${
                        isMyMessage ? 'text-blue-100' : 'text-gray-500'
                      } text-right`}
                    >
                      {formatDate(message.created_at).split(' ')[1]}
                      {isTempMessage && ' (Sending...)'}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 flex">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-grow rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleTyping}
          disabled={sendingMessage}
          autoFocus
        />
        <Button
          type="submit"
          className="rounded-l-none"
          disabled={!newMessage.trim() || sendingMessage}
        >
          <Send size={16} className="mr-1" />
          Send
        </Button>
      </form>
    </div>
  );
}
