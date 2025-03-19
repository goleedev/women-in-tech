'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// 소켓 메시지 타입 정의
export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  sent_at: string;
}

export interface Notification {
  id?: number;
  type: string;
  message: string;
  data?: any;
}

export const useSocket = (userId?: number) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eventMessages, setEventMessages] = useState<ChatMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // 소켓 연결
    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008',
      {
        withCredentials: true,
      }
    );

    // 연결 이벤트
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // 사용자 인증
      socket.emit('authenticate', { userId });
    });

    // 연결 해제 이벤트
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // 알림 수신
    socket.on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // 이벤트 채팅 메시지 수신
    socket.on('event-message', (message: ChatMessage) => {
      setEventMessages((prev) => [...prev, message]);
    });

    // 개인 채팅 메시지 수신
    socket.on('private-message', (message: ChatMessage) => {
      setPrivateMessages((prev) => [...prev, message]);
    });

    // 소켓 인스턴스 저장
    socketRef.current = socket;

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // 이벤트 채팅방 참여
  const joinEventChat = (eventId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-event-chat', eventId);
    }
  };

  // 개인 채팅방 참여
  const joinPrivateChat = (otherUserId: number) => {
    if (socketRef.current && isConnected && userId) {
      const chatId = [userId, otherUserId].sort().join('-');
      socketRef.current.emit('join-private-chat', chatId);
    }
  };

  // 이벤트 채팅 메시지 전송
  const sendEventMessage = (eventId: number, content: string) => {
    if (socketRef.current && isConnected && userId) {
      socketRef.current.emit('chat-message', {
        type: 'event',
        senderId: userId,
        eventId,
        content,
      });
    }
  };

  // 개인 채팅 메시지 전송
  const sendPrivateMessage = (receiverId: number, content: string) => {
    if (socketRef.current && isConnected && userId) {
      socketRef.current.emit('chat-message', {
        type: 'private',
        senderId: userId,
        receiverId,
        content,
      });
    }
  };

  // 멘토십 요청 알림 전송
  const sendMentorshipRequest = (mentorId: number) => {
    if (socketRef.current && isConnected && userId) {
      socketRef.current.emit('mentorship-request', {
        menteeId: userId,
        mentorId,
      });
    }
  };

  // 알림 지우기
  const clearNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  // 모든 알림 지우기
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    isConnected,
    notifications,
    eventMessages,
    privateMessages,
    joinEventChat,
    joinPrivateChat,
    sendEventMessage,
    sendPrivateMessage,
    sendMentorshipRequest,
    clearNotification,
    clearAllNotifications,
  };
};

export default useSocket;
