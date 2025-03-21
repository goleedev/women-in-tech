'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import {
  getChatMessages,
  joinChatRoom,
  sendMessage,
  markMessagesAsRead,
} from '@/app/lib/api/chat';
import { socketService } from '@/app/lib/api/socket';
import { Message } from '@/app/lib/api/types';
import Button from '@/app/ui/Button';
import { ArrowLeft, Send } from 'lucide-react';
import { formatDate } from '@/app/lib/utils';

export default function ChatRoomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  // 채팅방 참가 및 메시지 불러오기
  useEffect(() => {
    const joinRoom = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // 채팅방 참가
        const joinResponse = await joinChatRoom(id as string);
        setChatRoom(joinResponse.chat_room);

        // 메시지 불러오기
        const messagesResponse = await getChatMessages(id as string);
        setMessages(messagesResponse.messages.reverse()); // 시간순 정렬
        setHasMore(messagesResponse.has_more);

        // 메시지 읽음 처리
        await markMessagesAsRead(id as string);

        setError(null);
      } catch (err) {
        console.error('채팅방 참가 오류:', err);
        setError('채팅방에 접속하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    joinRoom();
  }, [id]);

  // 웹소켓 설정
  useEffect(() => {
    if (!id || !user) return;

    // 웹소켓 연결
    if (!id || !user) return;

    // 웹소켓 연결
    socketService?.connect();
    socketService?.joinRoom(id as string);

    // 새 메시지 수신 리스너
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNewMessage = (data: any) => {
      if (data.room_id.toString() === id.toString()) {
        setMessages((prev) => [...prev, data]);
        // 내가 보낸 메시지가 아닌 경우 읽음 처리
        if (data.sender.id !== user.id) {
          markMessagesAsRead(id as string).catch(console.error);
        }
      }
    };

    // 타이핑 상태 리스너
    const handleUserTyping = () => {
      // 타이핑 상태 처리 (선택적 구현)
    };

    // 리스너 등록
    socketService?.on('new-message', handleNewMessage);
    socketService?.on('user-typing', handleUserTyping);

    // 컴포넌트 언마운트 시 정리
    return () => {
      socketService?.off('new-message', handleNewMessage);
      socketService?.off('user-typing', handleUserTyping);
      socketService?.leaveRoom(id as string);
    };
  }, [id, user]);

  // 스크롤 관리
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 이전 메시지 로드
  const loadMoreMessages = async () => {
    if (!hasMore || loading) return;

    try {
      const oldestMsgId = messages.length > 0 ? messages[0].id : undefined;
      const messagesResponse = await getChatMessages(id as string, {
        before: oldestMsgId,
        limit: 20,
      });

      // 스크롤 위치 기억
      const container = messageContainerRef.current;
      const scrollHeight = container?.scrollHeight || 0;

      setMessages((prev) => [...messagesResponse.messages.reverse(), ...prev]);
      setHasMore(messagesResponse.has_more);

      // 스크롤 위치 복원
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - scrollHeight;
      }
    } catch (error) {
      console.error('이전 메시지 로드 오류:', error);
    }
  };

  // 메시지 전송
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      await sendMessage(id as string, newMessage);
      setNewMessage('');
    } catch (err) {
      console.error('메시지 전송 오류:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // 타이핑 상태 전송
  const handleTyping = () => {
    socketService?.sendTyping(id as string);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !chatRoom) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          {error || '채팅방을 찾을 수 없습니다.'}
        </div>
        <div className="text-center mt-4">
          <Link href="/chat">
            <Button variant="outline">채팅 목록으로 돌아가기</Button>
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
              이전 메시지 불러오기
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>메시지가 없습니다. 첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMyMessage = message.sender.id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isMyMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs sm:max-w-sm md:max-w-md ${
                      isMyMessage
                        ? 'bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg'
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
          placeholder="메시지를 입력하세요..."
          className="flex-grow rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleTyping}
          disabled={sendingMessage}
        />
        <Button
          type="submit"
          className="rounded-l-none"
          disabled={!newMessage.trim() || sendingMessage}
        >
          <Send size={16} className="mr-1" />
          전송
        </Button>
      </form>
    </div>
  );
}
