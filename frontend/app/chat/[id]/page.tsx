'use client';

import { useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, Send } from 'lucide-react';
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
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 메시지 핸들러 ref로 저장하여 의존성 배열 문제 해결
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newMessageHandlerRef = useRef<(data: any) => void>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userTypingHandlerRef = useRef<(data: any) => void>(null);

  // 채팅방 참가 및 메시지 불러오기
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

        // 메시지 불러오기
        const messagesResponse = await getChatMessages(roomId);
        if (isMounted) {
          const sortedMessages = [...messagesResponse.messages].reverse(); // 시간순 정렬
          console.log(
            `${sortedMessages.length}개의 메시지 로드됨:`,
            sortedMessages
          );
          setMessages(sortedMessages);
          setHasMore(messagesResponse.has_more);
        }

        // 메시지 읽음 처리
        await markMessagesAsRead(roomId);

        if (isMounted) {
          setError(null);
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

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // 웹소켓 설정
  useEffect(() => {
    if (!roomId || !user || !isInitialized) return;

    console.log('웹소켓 설정 시작...');

    // 웹소켓 연결 확보
    if (!socketService?.isConnected()) {
      socketService?.connect();
    }

    // 메시지 핸들러 정의
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNewMessage = (data: any) => {
      console.log('새 메시지 수신 (상세):', data);

      // 데이터 형식 검증 및 정규화
      let messageData = data;

      // 백엔드에서 다양한 형태로 데이터를 보낼 수 있으므로 구조 확인
      if (data.payload) {
        messageData = data.payload;
      }

      // room_id나 chat_room_id 필드 확인
      const msgRoomId =
        messageData.room_id?.toString() || messageData.chat_room_id?.toString();

      if (!msgRoomId) {
        console.warn('메시지에 방 ID가 없음:', messageData);
        return;
      }

      // 방 ID 확인 (문자열로 비교)
      if (msgRoomId === roomId.toString()) {
        // 데이터 구조 확인 - sender 필드가 없으면 추가
        if (!messageData.sender && messageData.sender_id) {
          messageData.sender = {
            id: messageData.sender_id,
            name: messageData.sender_name || '알 수 없음',
          };
        }

        setMessages((prev) => {
          // 이미 같은 ID의 메시지가 있는지 확인
          const msgId = messageData.id?.toString();
          const isDuplicate = prev.some(
            (msg) =>
              msg.id?.toString() === msgId ||
              (typeof msg.id === 'string' &&
                typeof msg.id === 'string' &&
                (msg.id as string).startsWith('temp_') &&
                msg.content === messageData.content &&
                msg.sender.id === messageData.sender.id)
          );

          if (isDuplicate) {
            console.log('중복 메시지 무시:', messageData);
            return prev;
          }

          console.log('새 메시지 추가:', messageData);
          return [...prev, messageData];
        });

        // 내가 보낸 메시지가 아닌 경우 읽음 처리
        if (messageData.sender.id !== user?.id) {
          markMessagesAsRead(roomId).catch(console.error);
        }
      } else {
        console.log(`다른 방(${msgRoomId})의 메시지 무시, 현재 방: ${roomId}`);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUserTyping = (data: any) => {
      if (
        data.room_id?.toString() === roomId.toString() &&
        data.user_id !== user.id
      ) {
        console.log(`사용자 ${data.user_name} 타이핑 중`);
        // 타이핑 상태 표시 UI 구현 (선택적)
      }
    };

    // ref에 핸들러 저장
    newMessageHandlerRef.current = handleNewMessage;
    userTypingHandlerRef.current = handleUserTyping;

    // 웹소켓 조인 및 핸들러 등록
    const registerHandlers = () => {
      console.log(`채팅방 ${roomId} 웹소켓 참가 시도`);
      socketService?.joinRoom(roomId);

      // 핸들러 등록
      socketService?.on('new-message', (data) => {
        newMessageHandlerRef.current?.(data);
      });

      socketService?.on('user-typing', (data) => {
        userTypingHandlerRef.current?.(data);
      });
    };

    // 웹소켓이 연결된 상태면 바로 등록, 아니면 500ms 후 다시 시도
    if (socketService?.isConnected()) {
      registerHandlers();
    } else {
      setTimeout(() => {
        if (socketService?.isConnected()) {
          registerHandlers();
        } else {
          console.log('웹소켓 연결 실패, HTTP 폴백 사용');
        }
      }, 500);
    }

    // 웹소켓 연결 상태 확인 및 채팅방 재참가
    const intervalId = setInterval(() => {
      if (socketService && socketService.isConnected()) {
        // 주기적으로 채팅방 재참가 (연결이 끊겼을 경우를 대비)
        socketService.joinRoom(roomId);
      } else if (socketService) {
        console.log('웹소켓 연결 끊김, 재연결 시도');
        socketService.connect();
      }
    }, 10000); // 10초마다 체크

    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('채팅방 컴포넌트 언마운트');

      // 등록된 핸들러 제거
      if (socketService) {
        socketService.off('new-message', (data) => {
          newMessageHandlerRef.current?.(data);
        });

        socketService.off('user-typing', (data) => {
          userTypingHandlerRef.current?.(data);
        });

        // 채팅방 나가기
        if (socketService.isConnected()) {
          console.log(`채팅방 ${roomId} 나가기`);
          socketService.leaveRoom(roomId);
        }
      }

      clearInterval(intervalId);
    };
  }, [roomId, user, isInitialized]);

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

  // 타이핑 상태 전송 - 디바운스 적용
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
        <div className="ml-auto text-sm">
          {socketService?.isConnected() ? (
            <span className="text-green-600 flex items-center">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
              실시간 연결됨
            </span>
          ) : (
            <span className="text-yellow-600 flex items-center">
              <span className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></span>
              오프라인 모드
            </span>
          )}
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
