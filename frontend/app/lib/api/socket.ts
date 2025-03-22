// app/lib/api/socket.ts
'use client';

export class SocketService {
  private socket: WebSocket | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private authenticating = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingMessages: Array<{ eventType: string; data: any }> = [];

  constructor() {
    this.setupSocketEvents = this.setupSocketEvents.bind(this);

    // 클라이언트 측에서만 실행
    if (typeof window !== 'undefined') {
      // 페이지 로드 시 자동 연결
      this.connect();

      // 페이지 언로드 시 연결 해제
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }

  // 웹소켓 연결
  connect() {
    if (typeof window === 'undefined') return;

    // 이미 연결 중이거나 연결된 상태면 건너뜀
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('인증 토큰이 없어 WebSocket 연결을 시도하지 않습니다.');
      return;
    }

    try {
      // WebSocket 연결 URL
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        `${wsProtocol}//${window.location.hostname}:5001`;

      console.log(`WebSocket 연결 시도: ${wsUrl}`);
      this.socket = new WebSocket(`${wsUrl}`);
      this.authenticating = true;
      this.setupSocketEvents();
    } catch (error) {
      console.error('WebSocket 연결 생성 중 오류:', error);
      this.authenticating = false;
      this.scheduleReconnect();
    }
  }

  // 웹소켓 이벤트 설정
  private setupSocketEvents() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket 연결됨');
      this.reconnectAttempts = 0;

      // 연결 후 인증 토큰 전송
      const token = localStorage.getItem('token');
      if (token && this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'auth', token }));
        this.authenticating = false;

        // 대기 중인 메시지들 전송
        this.sendPendingMessages();
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        // 인증 성공 메시지 처리
        if (type === 'auth_success') {
          console.log('WebSocket 인증 성공');
          this.authenticating = false;
          this.sendPendingMessages();
          return;
        }

        // 리스너에게 이벤트 전달
        const eventListeners = this.listeners.get(type);
        if (eventListeners) {
          eventListeners.forEach((listener) => listener(payload));
        }
      } catch (error) {
        console.warn('WebSocket 메시지 파싱 오류:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket 연결 종료 (코드: ${event.code})`);

      // 정상 종료가 아닌 경우에만 재연결 시도
      if (event.code !== 1000 && event.code !== 1001) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.warn('WebSocket 오류 발생:', error);
      // 오류 발생 시 소켓 닫음 - onclose 이벤트가 발생하여 재연결 수행
      this.socket?.close();
    };
  }

  // 재연결 예약
  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`${delay}ms 후 WebSocket 재연결 시도...`);

      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.warn(
        `최대 재연결 시도 횟수(${this.maxReconnectAttempts})에 도달했습니다.`
      );
    }
  }

  // 대기 중인 메시지 전송
  private sendPendingMessages() {
    if (this.pendingMessages.length > 0 && this.isConnected()) {
      console.log(`${this.pendingMessages.length}개의 대기 메시지 전송`);

      this.pendingMessages.forEach(({ eventType, data }) => {
        this.doEmit(eventType, data);
      });

      this.pendingMessages = [];
    }
  }

  // 웹소켓 연결 해제
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close(1000, '정상 종료');
      }
      this.socket = null;
    }
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return !!(this.socket && this.socket.readyState === WebSocket.OPEN);
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
    // 연결 중이면 대기 목록에 추가
    if (this.authenticating || !this.isConnected()) {
      console.log(`WebSocket이 준비되지 않아 메시지 대기: ${eventType}`);
      this.pendingMessages.push({ eventType, data });

      // 연결되어 있지 않으면 연결 시도
      if (!this.socket || this.socket.readyState !== WebSocket.CONNECTING) {
        this.connect();
      }
      return;
    }

    // 바로 전송
    this.doEmit(eventType, data);
  }

  // 실제 이벤트 전송 구현
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private doEmit(eventType: string, data: any) {
    if (this.isConnected()) {
      this.socket!.send(
        JSON.stringify({
          type: eventType,
          payload: data,
        })
      );
    } else {
      console.warn(
        'WebSocket이 연결되어 있지 않아 메시지를 전송할 수 없습니다.'
      );
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
