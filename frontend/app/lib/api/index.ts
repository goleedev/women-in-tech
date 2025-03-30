'use client';

import * as authApi from './auth';
import * as chatApi from './chat';
import * as eventApi from './event';
import * as mentorshipApi from './mentorship';
import * as notificationApi from './notification';
import { socketService } from './socket';
import * as tagApi from './tag';
import * as userApi from './user';
export * from './types';

// Set up the API object to group all the API modules
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

// Export the API object as default
export default api;

// Export individual API modules for convenience
export {
  authApi,
  chatApi,
  eventApi,
  mentorshipApi,
  notificationApi,
  socketService,
  tagApi,
  userApi,
};
