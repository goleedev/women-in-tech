// app/lib/api/socket.ts
'use client';

export class SocketService {
  private socket: WebSocket | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.setupSocketEvents = this.setupSocketEvents.bind(this);
  }

  // 웹소켓 연결
  connect() {
    if (typeof window === 'undefined') return;

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('인증 토큰을 찾을 수 없습니다');
      return;
    }

    // WebSocket 연결 URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      `${wsProtocol}//${window.location.hostname}:5001`;

    this.socket = new WebSocket(`${wsUrl}`);
    this.setupSocketEvents();

    // 연결 시 인증 토큰 전송
    this.socket.onopen = () => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'auth', token }));
        this.reconnectAttempts = 0;
        console.log('WebSocket 연결됨');
      }
    };
  }

  // 웹소켓 이벤트 설정
  private setupSocketEvents() {
    if (!this.socket) return;

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        // 리스너에게 이벤트 전달
        const eventListeners = this.listeners.get(type);
        if (eventListeners) {
          eventListeners.forEach((listener) => listener(payload));
        }
      } catch (error) {
        console.error('WebSocket 메시지 파싱 오류:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket 연결 끊김, 재연결 시도 중...');

      // 자동 재연결
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, 2000 * Math.pow(2, this.reconnectAttempts));
      } else {
        console.error('최대 재연결 시도 횟수 도달');
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket 오류:', error);
    };
  }

  // 웹소켓 연결 해제
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // 이벤트 리스너 등록
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)?.add(callback);
  }

  // 이벤트 리스너 제거
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(eventType: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // 이벤트 전송
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(eventType: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: eventType,
          payload: data,
        })
      );
    } else {
      console.error('WebSocket이 연결되어 있지 않습니다');
    }
  }

  // 채팅방 참가
  joinRoom(roomId: number | string) {
    this.emit('join-room', { roomId });
  }

  // 채팅방 나가기
  leaveRoom(roomId: number | string) {
    this.emit('leave-room', { roomId });
  }

  // 메시지 전송
  sendMessage(roomId: number | string, content: string) {
    this.emit('send-message', { roomId, content });
  }

  // 타이핑 상태 전송
  sendTyping(roomId: number | string) {
    this.emit('typing', { roomId });
  }

  // 메시지 읽음 처리
  markRead(roomId: number | string) {
    this.emit('mark-read', { roomId });
  }
}

// 소켓 서비스 인스턴스 생성 (싱글턴 패턴)
export const socketService =
  typeof window !== 'undefined' ? new SocketService() : null;
