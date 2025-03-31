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
  private connectionPromise: Promise<boolean> | null = null;

  constructor() {
    this.setupSocketEvents = this.setupSocketEvents.bind(this);

    // Only run this code in the browser
    if (typeof window !== 'undefined') {
      // Connect on page load
      this.connect();

      // Disconnect on page unload
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });

      // Reconnect on network change
      window.addEventListener('online', () => {
        this.connect();
      });
    }
  }

  // Connect to WebSocket server
  connect(): Promise<boolean> {
    // Not running in SSR
    if (typeof window === 'undefined') return Promise.resolve(false);

    // Return existing connection promise if already connecting
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    )
      return this.connectionPromise || Promise.resolve(this.isConnected());

    // Return existing connection promise if already in progress to connect
    if (this.connectionPromise) return this.connectionPromise;

    // Check if token exists
    const token = localStorage.getItem('token');

    // If token does not exist, do not attempt to connect
    if (!token) return Promise.resolve(false);

    // Create a new connection promise
    this.connectionPromise = new Promise((resolve) => {
      try {
        // Define WebSocket URL using environment variable or fallback
        const wsUrl =
          process.env.NEXT_PUBLIC_WS_URL ||
          (() => {
            const wsProtocol =
              window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const hostname = window.location.hostname;
            // If we're in production (Vercel), use the backend URL
            if (
              hostname.includes('vercel.app') ||
              process.env.NODE_ENV === 'production'
            ) {
              return `wss://women-in-tech-backend.onrender.com`;
            }
            // Otherwise use local development settings
            const port = '5001';
            return `${wsProtocol}//${hostname}:${port}`;
          })();

        // Create a new WebSocket connection
        this.socket = new WebSocket(wsUrl);
        this.authenticating = true;

        // Connected event
        this.socket.onopen = () => {
          this.reconnectAttempts = 0;

          // Send authentication token after connection
          const token = localStorage.getItem('token');
          if (
            token &&
            this.socket &&
            this.socket.readyState === WebSocket.OPEN
          ) {
            this.socket.send(JSON.stringify({ type: 'auth', token }));

            // Set a timeout to wait for auth success
            setTimeout(() => {
              this.authenticating = false;
              this.sendPendingMessages();
              resolve(true);
              this.connectionPromise = null;
            }, 500);
          }
        };

        // Error event
        this.socket.onerror = () => {
          resolve(false);
          this.connectionPromise = null;
        };

        this.setupSocketEvents();
      } catch (error) {
        // Handle connection error
        console.error('WebSocket 연결 생성 중 오류:', error);
        this.authenticating = false;
        // Reconnect after a delay
        this.scheduleReconnect();

        resolve(false);

        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  // Set up WebSocket events
  private setupSocketEvents() {
    if (!this.socket) return;

    // Set up event listeners for WebSocket events
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Check if data is valid and has type
        if (!data.type && data.event) data.type = data.event;

        const { type, payload } = data;

        // Handle authentication success
        if (type === 'auth_success') {
          this.authenticating = false;
          this.sendPendingMessages();

          // Call auth success listeners
          const authListeners = this.listeners.get('auth_success');
          if (authListeners && authListeners.size > 0)
            authListeners.forEach((listener) => listener(data));

          return;
        }

        // Handle new message event
        if (type === 'new-message') {
          const eventListeners = this.listeners.get('new-message');

          if (eventListeners && eventListeners.size > 0) {
            eventListeners.forEach((listener) => {
              try {
                listener(payload || data);
              } catch (err) {
                console.error(`⚠️ 'new-message' not found: `, err);
              }
            });
          }

          return;
        }

        // Handle other events
        const eventListeners = this.listeners.get(type);
        if (eventListeners && eventListeners.size > 0) {
          eventListeners.forEach((listener) => {
            try {
              listener(payload || data);
            } catch (err) {
              console.error(`⚠️ '${type}' not found:`, err);
            }
          });
        }
      } catch (error) {
        console.warn('⚠️ WebSocket parsing error:', error, event.data);
      }
    };

    // Handle connection close event
    this.socket.onclose = (event) => {
      if (event.code !== 1000 && event.code !== 1001) this.scheduleReconnect();
    };

    // Handle connection error event
    this.socket.onerror = () => this.socket?.close();
  }

  // Schedule reconnection attempts
  private scheduleReconnect() {
    // Clear existing timeout if any
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Increment reconnect attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      // Calculate delay based on attempts
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      // Log reconnection attempt
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  // Send pending messages
  private sendPendingMessages() {
    if (this.pendingMessages.length > 0 && this.isConnected()) {
      // Send all pending messages
      const messagesToSend = [...this.pendingMessages];
      this.pendingMessages = [];

      // Send each message
      messagesToSend.forEach(({ eventType, data }) => {
        this.doEmit(eventType, data);
      });
    }
  }

  // Disconnect from WebSocket server
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
        this.socket.close(1000, '✨ Client disconnected');
      }
      this.socket = null;
    }

    // Clear all listeners
    this.connectionPromise = null;
  }

  // Check if WebSocket is connected
  isConnected(): boolean {
    return !!(this.socket && this.socket.readyState === WebSocket.OPEN);
  }

  // Register event listener
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(eventType: string, callback: (data: any) => void) {
    // Check if event type is valid
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    // Add callback to the event type
    this.listeners.get(eventType)?.add(callback);
    console.log(
      `'${eventType}' registered, Total of ${
        this.listeners.get(eventType)?.size
      }`
    );
  }

  // Unregister event listener
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(eventType: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback);
      console.log(
        `'${eventType}' registered, Remaining of ${eventListeners.size}`
      );
    }
  }

  // Send event to WebSocket server
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(eventType: string, data: any) {
    // Check if socket is connected
    if (this.authenticating || !this.isConnected()) {
      console.log(`Message pending: ${eventType}`);
      this.pendingMessages.push({ eventType, data });

      // If socket is not connected, try to connect
      if (!this.socket || this.socket.readyState !== WebSocket.CONNECTING)
        this.connect();

      return;
    }

    // Emit event to WebSocket server
    this.doEmit(eventType, data);
  }

  // Create a function to send event to WebSocket server
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private doEmit(eventType: string, data: any) {
    if (this.isConnected()) {
      // Generate a unique message ID
      const messageId = `msg_${++this.messageCounter}`;

      // Send the message with the unique ID
      this.socket!.send(
        JSON.stringify({
          type: eventType,
          payload: {
            ...data,
            _messageId: messageId,
          },
        })
      );
    } else {
      console.warn('⚠️ WebSocket is not connected. Cannot send message.');
    }
  }

  // Join a chat room
  joinRoom(roomId: number | string) {
    this.emit('join-room', { roomId });
  }

  // Leave a chat room
  leaveRoom(roomId: number | string) {
    this.emit('leave-room', { roomId });
  }

  // Send a message to a chat room
  sendMessage(roomId: number | string, content: string) {
    this.emit('send-message', { roomId, content });
  }

  // Send typing status
  sendTyping(roomId: number | string) {
    this.emit('typing', { roomId });
  }

  // Mark a message as read
  markRead(roomId: number | string) {
    this.emit('mark-read', { roomId });
  }
}

// Export the socket service instance
export const socketService =
  typeof window !== 'undefined' ? new SocketService() : null;
