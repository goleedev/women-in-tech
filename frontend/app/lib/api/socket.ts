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
  private messageCounter = 0;

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

      // 온라인 상태 복구 시 재연결
      window.addEventListener('online', () => {
        console.log('네트워크 연결 복구, WebSocket 재연결 시도');
        this.connect();
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
      const hostname = window.location.hostname;
      const port = '5001'; // 포트는 백엔드 서버 포트에 맞게 설정
      const wsUrl = `${wsProtocol}//${hostname}:${port}`;

      console.log(`WebSocket 연결 시도: ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);
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
        console.log('인증 토큰 전송');
        this.socket.send(JSON.stringify({ type: 'auth', token }));

        // 약간의 지연 후에 메시지 전송 (인증 처리 시간을 위해)
        setTimeout(() => {
          this.authenticating = false;
          this.sendPendingMessages();
        }, 500);
      }
    };

    // frontend/app/lib/api/socket.ts 일부 수정 - onmessage 함수 개선
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket 메시지 수신:', data);

        // 타입 필드가 없는 경우 처리
        if (!data.type && data.event) {
          data.type = data.event; // 일부 메시지는 type 대신 event 필드 사용
        }

        const { type, payload } = data;

        // 인증 성공 메시지 처리
        if (type === 'auth_success') {
          console.log('WebSocket 인증 성공');
          this.authenticating = false;
          this.sendPendingMessages();
          return;
        }

        // 직접 메시지 이벤트인 경우 (백엔드가 메시지 객체를 직접 보내는 경우)
        if (type === 'new-message') {
          console.log(`'new-message' 이벤트 수신:`, payload);
          const eventListeners = this.listeners.get('new-message');
          if (eventListeners && eventListeners.size > 0) {
            eventListeners.forEach((listener) => {
              try {
                // payload가 없으면 data 전체를 전달
                listener(payload || data);
              } catch (err) {
                console.error(`'new-message' 이벤트 리스너 실행 중 오류:`, err);
              }
            });
          } else {
            console.warn(`'new-message' 이벤트에 대한 리스너가 없습니다`);
          }
          return;
        }

        // 리스너에게 이벤트 전달
        const eventListeners = this.listeners.get(type);
        if (eventListeners && eventListeners.size > 0) {
          console.log(
            `'${type}' 이벤트에 대한 ${eventListeners.size}개의 리스너에게 전달`
          );
          eventListeners.forEach((listener) => {
            try {
              listener(payload || data);
            } catch (err) {
              console.error(`'${type}' 이벤트 리스너 실행 중 오류:`, err);
            }
          });
        } else {
          console.warn(`'${type}' 이벤트에 대한 리스너가 없습니다`);
        }
      } catch (error) {
        console.warn('WebSocket 메시지 파싱 오류:', error, event.data);
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

      // 복사본을 만들어 작업
      const messagesToSend = [...this.pendingMessages];
      this.pendingMessages = [];

      messagesToSend.forEach(({ eventType, data }) => {
        this.doEmit(eventType, data);
      });
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

    // 리스너 초기화 (선택적)
    // this.listeners.clear();
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
    console.log(
      `'${eventType}' 이벤트에 리스너 등록됨, 총 ${
        this.listeners.get(eventType)?.size
      }개`
    );
  }

  // 이벤트 리스너 제거
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(eventType: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback);
      console.log(
        `'${eventType}' 이벤트에서 리스너 제거됨, 남은 ${eventListeners.size}개`
      );
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
      // 메시지 카운터를 포함하여 중복 메시지 식별
      const messageId = `msg_${++this.messageCounter}`;

      this.socket!.send(
        JSON.stringify({
          type: eventType,
          payload: {
            ...data,
            _messageId: messageId,
          },
        })
      );
      console.log(`메시지 전송: ${eventType} (ID: ${messageId})`);
    } else {
      console.warn(
        'WebSocket이 연결되어 있지 않아 메시지를 전송할 수 없습니다.'
      );
    }
  }

  // 채팅방 참가
  joinRoom(roomId: number | string) {
    console.log(`채팅방 ${roomId} 참가 요청`);
    this.emit('join-room', { roomId });
  }

  // 채팅방 나가기
  leaveRoom(roomId: number | string) {
    console.log(`채팅방 ${roomId} 나가기 요청`);
    this.emit('leave-room', { roomId });
  }

  // 메시지 전송
  sendMessage(roomId: number | string, content: string) {
    console.log(
      `채팅방 ${roomId}에 메시지 전송: ${content.substring(0, 30)}${
        content.length > 30 ? '...' : ''
      }`
    );
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
