// app/lib/api/index.ts
'use client';

// 각 API 모듈 내보내기
import * as authApi from './auth';
import * as userApi from './user';
import * as eventApi from './event';
import * as mentorshipApi from './mentorship';
import * as chatApi from './chat';
import * as notificationApi from './notification';
import * as tagApi from './tag';
import { socketService } from './socket';

// 타입 내보내기
export * from './types';

// 통합 API 객체 생성
const api = {
  auth: authApi,
  user: userApi,
  event: eventApi,
  mentorship: mentorshipApi,
  chat: chatApi,
  notification: notificationApi,
  tag: tagApi,
  socket: socketService,
};

export default api;

// 개별 내보내기
export {
  authApi,
  userApi,
  eventApi,
  mentorshipApi,
  chatApi,
  notificationApi,
  tagApi,
  socketService,
};
