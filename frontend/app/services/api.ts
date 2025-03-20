// src/services/api.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

// 타입 정의
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  expertise?: string;
  profession?: string;
  seniority_level?: string;
  country?: string;
  bio?: string;
  profile_image_url?: string;
  is_verified?: boolean;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  end_date?: string;
  location: string;
  topic: string;
  organizer: {
    id: number;
    name: string;
    email?: string;
  };
  max_attendees: number;
  current_attendees: number;
  image_url?: string;
  is_online: boolean;
  online_link?: string;
  status: string;
  is_liked?: boolean;
  tags: string[];
  attendees?: Array<{ id: number; name: string }>;
}

export interface ChatRoom {
  id: number;
  name: string;
  type: 'event' | 'mentorship';
  event_id?: number;
  mentorship_id?: number;
  last_message?: {
    content: string;
    sender_id: number;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: number;
  chat_room_id: number;
  sender: {
    id: number;
    name: string;
    profile_image_url?: string;
  };
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MentorshipConnection {
  id: number;
  mentor: {
    id: number;
    name: string;
    expertise: string;
    profession: string;
  };
  mentee: {
    id: number;
    name: string;
    expertise: string;
    profession: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  chat_room_id?: number;
}

export interface Notification {
  id: number;
  type: string;
  content: string;
  is_read: boolean;
  reference_id: number;
  reference_type: string;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  category: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 헬퍼 함수 - 요청 보내기
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries()) // Convert Headers instance to Record<string, string>
      : options.headers && typeof options.headers === 'object'
      ? Object.fromEntries(
          Object.entries(options.headers).map(([key, value]) => [
            key,
            String(value),
          ])
        ) // Ensure all values are strings
      : {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return await response.json();
}

// 인증 관련 API
export const authAPI = {
  // 회원가입
  register: async (userData: {
    email: string;
    name: string;
    password: string;
    expertise?: string;
    profession?: string;
    seniority_level?: string;
    country?: string;
    role: 'mentor' | 'mentee';
    bio?: string;
  }) => {
    return await fetchAPI<{ success: boolean; message: string; user: User }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
  },

  // 로그인
  login: async (credentials: { email: string; password: string }) => {
    const data = await fetchAPI<{
      success: boolean;
      token: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // 토큰과 사용자 정보 저장
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  },

  // 로그아웃
  logout: async () => {
    const result = await fetchAPI<{ success: boolean; message: string }>(
      '/auth/logout',
      {
        method: 'POST',
      }
    );

    // 로컬 스토리지에서 토큰과 사용자 정보 삭제
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return result;
  },

  // 내 정보 조회
  getMe: async () => {
    return await fetchAPI<User>('/auth/me');
  },

  // 현재 로그인한 사용자 정보 가져오기
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? (JSON.parse(userStr) as User) : null;
  },

  // 로그인 상태 확인
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// 사용자 관련 API
export const userAPI = {
  // 사용자 프로필 조회
  getUserProfile: async (userId: number | string) => {
    return await fetchAPI<User & { tags: string[] }>(`/users/${userId}`);
  },

  // 사용자 프로필 업데이트
  updateUserProfile: async (
    userId: number | string,
    profileData: {
      name?: string;
      expertise?: string;
      profession?: string;
      seniority_level?: string;
      country?: string;
      bio?: string;
    }
  ) => {
    return await fetchAPI<{ success: boolean; message: string; user: User }>(
      `/users/${userId}`,
      {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }
    );
  },

  // 사용자 태그 업데이트
  updateUserTags: async (userId: number | string, tags: string[]) => {
    return await fetchAPI<{
      success: boolean;
      message: string;
      tags: string[];
    }>(`/users/${userId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tags }),
    });
  },

  // 프로필 이미지 업로드
  uploadProfileImage: async (userId: number | string, imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/profile-image`,
      {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Profile image upload failed');
    }

    return (await response.json()) as {
      success: boolean;
      message: string;
      profile_image_url: string;
    };
  },
};

// 이벤트 관련 API
export const eventAPI = {
  // 이벤트 목록 조회
  getEvents: async (params?: {
    location?: string;
    date?: string;
    topic?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

    return await fetchAPI<{ events: Event[]; pagination: Pagination }>(
      `/events${queryString}`
    );
  },

  // 이벤트 상세 조회
  getEventById: async (eventId: number | string) => {
    return await fetchAPI<Event>(`/events/${eventId}`);
  },

  // 이벤트 생성
  createEvent: async (eventData: {
    title: string;
    description: string;
    date: string;
    end_date?: string;
    location: string;
    topic: string;
    max_attendees?: number;
    is_online?: boolean;
    online_link?: string;
    tags?: string[];
  }) => {
    return await fetchAPI<{
      success: boolean;
      message: string;
      event: { id: number; title: string; date: string };
    }>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  // 이벤트 업데이트
  updateEvent: async (
    eventId: number | string,
    eventData: {
      title?: string;
      description?: string;
      date?: string;
      end_date?: string;
      location?: string;
      topic?: string;
      max_attendees?: number;
      is_online?: boolean;
      online_link?: string;
      status?: string;
      tags?: string[];
    }
  ) => {
    return await fetchAPI<{ success: boolean; message: string }>(
      `/events/${eventId}`,
      {
        method: 'PUT',
        body: JSON.stringify(eventData),
      }
    );
  },

  // 이벤트 참가 신청
  attendEvent: async (eventId: number | string) => {
    return await fetchAPI<{
      success: boolean;
      message: string;
      status: string;
    }>(`/events/${eventId}/attend`, {
      method: 'POST',
    });
  },

  // 이벤트 참가 취소
  cancelEventAttendance: async (eventId: number | string) => {
    return await fetchAPI<{ success: boolean; message: string }>(
      `/events/${eventId}/attend`,
      {
        method: 'DELETE',
      }
    );
  },

  // 이벤트 좋아요
  likeEvent: async (eventId: number | string) => {
    return await fetchAPI<{ success: boolean; message: string }>(
      `/events/${eventId}/like`,
      {
        method: 'POST',
      }
    );
  },

  // 이벤트 좋아요 취소
  unlikeEvent: async (eventId: number | string) => {
    return await fetchAPI<{ success: boolean; message: string }>(
      `/events/${eventId}/like`,
      {
        method: 'DELETE',
      }
    );
  },

  // 좋아요한 이벤트 목록
  getLikedEvents: async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

    return await fetchAPI<{ events: Event[]; pagination: Pagination }>(
      `/events/liked${queryString}`
    );
  },
};

// 멘토십 관련 API
export const mentorshipAPI = {
  // 멘토/멘티 검색
  getUsers: async (params?: {
    role?: 'mentor' | 'mentee';
    expertise?: string;
    seniority_level?: string;
    country?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

    return await fetchAPI<{
      users: Array<
        User & {
          tags: string[];
          similarity_score?: number;
          is_connected?: boolean;
        }
      >;
      pagination: Pagination;
    }>(`/mentorship/users${queryString}`);
  },

  // 멘토십 연결 요청
  connectRequest: async (mentorId: number | string, message: string) => {
    return await fetchAPI<{
      success: boolean;
      message: string;
      connection: { id: number; status: string };
    }>('/mentorship/connect', {
      method: 'POST',
      body: JSON.stringify({ mentor_id: mentorId, message }),
    });
  },

  // 멘토십 연결 요청 수락/거절
  updateConnectionStatus: async (
    connectionId: number | string,
    status: 'accepted' | 'rejected'
  ) => {
    return await fetchAPI<{ success: boolean; message: string }>(
      `/mentorship/connect/${connectionId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }
    );
  },

  // 멘토십 연결 요청 목록
  getConnectionRequests: async (params?: {
    status?: 'pending' | 'accepted' | 'rejected';
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

    return await fetchAPI<{
      connections: MentorshipConnection[];
      pagination: Pagination;
    }>(`/mentorship/connect/requests${queryString}`);
  },

  // 내 멘토십 연결 목록
  getMyConnections: async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

    return await fetchAPI<{
      connections: MentorshipConnection[];
      pagination: Pagination;
    }>(`/mentorship/connect${queryString}`);
  },

  // 추천 멘토 조회
  getRecommendedMentors: async () => {
    return await fetchAPI<{
      recommended_mentors: Array<User & { similarity_score: number }>;
    }>('/mentorship/recommended');
  },
};

// 채팅 관련 API
export const chatAPI = {
  // 채팅방 목록 조회
  getChatRooms: async () => {
    return await fetchAPI<{ chat_rooms: ChatRoom[] }>('/chat/rooms');
  },

  // 채팅방 참가
  joinChatRoom: async (roomId: number | string) => {
    return await fetchAPI<{
      success: boolean;
      message: string;
      chat_room: { id: number; name: string; type: string };
    }>(`/chat/rooms/${roomId}/join`, {
      method: 'POST',
    });
  },

  // 채팅방 메시지 목록 조회
  getChatMessages: async (
    roomId: number | string,
    params?: { before?: number; limit?: number }
  ) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

    return await fetchAPI<{ messages: Message[]; has_more: boolean }>(
      `/chat/rooms/${roomId}/messages${queryString}`
    );
  },

  // 메시지 전송
  sendMessage: async (roomId: number | string, content: string) => {
    return await fetchAPI<{
      success: boolean;
      message: Message;
    }>(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // 채팅방 메시지 읽음 처리
  markMessagesAsRead: async (roomId: number | string) => {
    return await fetchAPI<{ success: boolean; message: string }>(
      `/chat/rooms/${roomId}/read`,
      {
        method: 'PUT',
      }
    );
  },
};

// 알림 관련 API
export const notificationAPI = {
  // 알림 목록 조회
  getNotifications: async (params?: {
    is_read?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

    return await fetchAPI<{
      notifications: Notification[];
      unread_count: number;
      pagination: Pagination;
    }>(`/notifications${queryString}`);
  },

  // 알림 읽음 처리
  markNotificationAsRead: async (notificationId: number | string) => {
    return await fetchAPI<{ success: boolean; message: string }>(
      `/notifications/${notificationId}/read`,
      {
        method: 'PUT',
      }
    );
  },

  // 모든 알림 읽음 처리
  markAllNotificationsAsRead: async () => {
    return await fetchAPI<{ success: boolean; message: string }>(
      '/notifications/read-all',
      {
        method: 'PUT',
      }
    );
  },
};

// 태그 관련 API
export const tagAPI = {
  // 전체 태그 목록 조회
  getAllTags: async (category?: string) => {
    const queryParams = new URLSearchParams();

    if (category) {
      queryParams.append('category', category);
    }

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : '';

    return await fetchAPI<{ tags: Tag[] }>(`/tags${queryString}`);
  },
};

// 웹소켓 연결 관리
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
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Authentication token not found');
      return;
    }

    // WebSocket 연결 URL (백엔드 URL과 일치하게 설정)
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
        console.log('WebSocket connected');
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
        console.error('WebSocket message parsing error:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');

      // 연결 끊김 시 자동 재연결
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, 2000 * Math.pow(2, this.reconnectAttempts));
      } else {
        console.error('Max reconnect attempts reached');
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
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
      console.error('WebSocket is not connected');
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

// 소켓 서비스 인스턴스 생성
export const socketService = new SocketService();

// API 통합 내보내기
const api = {
  auth: authAPI,
  user: userAPI,
  event: eventAPI,
  mentorship: mentorshipAPI,
  chat: chatAPI,
  notification: notificationAPI,
  tag: tagAPI,
  socket: socketService,
};

export default api;
