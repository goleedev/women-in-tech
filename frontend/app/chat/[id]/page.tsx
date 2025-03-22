'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
import Button from '@/app/ui/Button';
import { ArrowLeft, Send, RefreshCw } from 'lucide-react';
import { formatDate } from '@/app/lib/utils';

export default function ChatRoomPage() {
  const { id } = useParams();
  const roomId = id as string;
  const { user } = useAuth();
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

  // 채팅방 참가 및 메시지 불러오기
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      console.log(`채팅 메시지 가져오기 (HTTP)`);
      // 메시지 불러오기
      const messagesResponse = await getChatMessages(roomId);

      const sortedMessages = [...messagesResponse.messages].reverse(); // 시간순 정렬
      console.log(
        `${sortedMessages.length}개의 메시지 로드됨:`,
        sortedMessages
      );
      setMessages(sortedMessages);
      setHasMore(messagesResponse.has_more);

      // 메시지 읽음 처리
      await markMessagesAsRead(roomId);

      setError(null);
    } catch (err) {
      console.error('채팅 메시지 로드 오류:', err);
      setError('메시지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  }, [roomId]);

  useEffect(() => {
    let isMounted = true;

    const joinRoom = async () => {
      if (!roomId) return;

      setLoading(true);
      try {
        console.log(`채팅방 ${roomId} 참가 시도 (HTTP)`);
        // 채팅방 참가
        const joinResponse = await joinChatRoom(roomId);
        if (isMounted) {
          setChatRoom(joinResponse.chat_room);
          console.log('채팅방 정보 수신:', joinResponse.chat_room);
        }

        // 초기 메시지 로드
        await fetchMessages();

        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('채팅방 참가 오류:', err);
        if (isMounted) {
          setError('채팅방에 접속하는 중 오류가 발생했습니다.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    joinRoom();

    // 자동 새로고침 설정 (5초마다)
    const autoRefreshInterval = setInterval(() => {
      if (isInitialized && !refreshing) {
        console.log('자동 새로고침 실행');
        fetchMessages();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(autoRefreshInterval);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [roomId, fetchMessages, isInitialized]);

  // 메시지 수신 핸들러 (웹소켓)
  const handleNewMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      console.log('새 메시지 수신 (웹소켓):', data);

      // 데이터 정규화
      let messageData = data;
      if (data.payload) {
        messageData = data.payload;
      }

      // room_id 확인
      const msgRoomId =
        messageData.room_id?.toString() || messageData.chat_room_id?.toString();

      if (msgRoomId !== roomId.toString()) {
        console.log(`다른 방 메시지 무시: ${msgRoomId} (현재: ${roomId})`);
        return;
      }

      // sender 필드 확인
      if (!messageData.sender && messageData.sender_id) {
        messageData.sender = {
          id: messageData.sender_id,
          name: messageData.sender_name || '알 수 없음',
        };
      }

      // 중복 메시지 확인
      setMessages((prev) => {
        // ID로 중복 확인
        const msgId = messageData.id?.toString();
        if (msgId && prev.some((msg) => msg.id?.toString() === msgId)) {
          return prev;
        }

        // 임시 메시지 확인 및 교체
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

        // 새 메시지 추가
        return [...prev, messageData];
      });

      // 메시지가 내 것이 아니면 읽음 처리
      if (messageData.sender?.id !== user?.id) {
        markMessagesAsRead(roomId).catch(console.error);
      }

      // 강제 새로고침 타이머 설정
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = setTimeout(() => {
        fetchMessages();
      }, 300); // 300ms 후에 새로고침
    },
    [roomId, user, fetchMessages]
  );

  // 웹소켓 설정
  useEffect(() => {
    if (!roomId || !user || !isInitialized) return;

    console.log('웹소켓 설정 시작...');

    // 웹소켓 연결
    if (!socketService?.isConnected()) {
      socketService?.connect();
    }

    // 핸들러 등록
    socketService?.on('new-message', handleNewMessage);

    // 채팅방 참가
    socketService?.joinRoom(roomId);

    return () => {
      // 핸들러 해제
      socketService?.off('new-message', handleNewMessage);

      // 채팅방 퇴장
      if (socketService?.isConnected()) {
        socketService?.leaveRoom(roomId);
      }
    };
  }, [roomId, user, isInitialized, handleNewMessage]);

  // 수동 새로고침
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchMessages();
  };

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
      const messagesResponse = await getChatMessages(roomId, {
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

    // 임시 ID 생성 (UI 표시용)
    const tempId = `temp_${Date.now()}`;

    // 낙관적 UI 업데이트 - 메시지를 즉시 화면에 표시
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

    // 메시지 상태 업데이트
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage(''); // 입력창 초기화

    try {
      // 웹소켓으로 메시지 전송
      if (socketService?.isConnected()) {
        console.log('웹소켓으로 메시지 전송');
        socketService.sendMessage(roomId, newMessage);
      } else {
        // 웹소켓 연결이 없으면 HTTP API로 전송
        console.log('HTTP API로 메시지 전송');
        const response = await apiSendMessage(roomId, newMessage);

        // 서버 응답으로 낙관적 메시지 교체
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

      // 새로고침 타이머 설정
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = setTimeout(() => {
        fetchMessages();
      }, 500); // 500ms 후에 새로고침
    } catch (err) {
      console.error('메시지 전송 오류:', err);

      // 전송 실패 표시 (옵션)
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

  // 타이핑 상태 전송
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleTyping = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (socketService?.isConnected()) {
        socketService?.sendTyping(roomId);
      }
      debounceTimeoutRef.current = null;
    }, 300);
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
                연결됨
              </span>
            ) : (
              <span className="text-yellow-600 flex items-center">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></span>
                오프라인
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
            {messages.map((message, index) => {
              const isMyMessage = message.sender.id === user?.id;
              // 임시 메시지인지 확인 (string으로 시작하는 ID)
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
                      {isTempMessage && ' (전송 중...)'}
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
          autoFocus
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
