'use client';

import { fetchAPI } from './client';
import { ChatRoom, Message } from './types';

// Create a function to fetch chat rooms
export const getChatRooms = async (): Promise<{ chat_rooms: ChatRoom[] }> => {
  return await fetchAPI<{ chat_rooms: ChatRoom[] }>('/chat/rooms');
};

// Create a function to join chat room
export const joinChatRoom = async (
  roomId: number | string
): Promise<{
  success: boolean;
  message: string;
  chat_room: {
    id: number;
    name: string;
    type: string;
  };
}> => {
  return await fetchAPI<{
    success: boolean;
    message: string;
    chat_room: {
      id: number;
      name: string;
      type: string;
    };
  }>(`/chat/rooms/${roomId}/join`, {
    method: 'POST',
  });
};

// Create a function to get all chat messages
export const getChatMessages = async (
  roomId: number | string,
  params?: { before?: number; limit?: number }
): Promise<{ messages: Message[]; has_more: boolean }> => {
  // Get the query parameters
  const queryParams = new URLSearchParams();

  // Append the parameters to the query string
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
  }

  // Construct the URL with query parameters
  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : '';
  return await fetchAPI<{ messages: Message[]; has_more: boolean }>(
    `/chat/rooms/${roomId}/messages${queryString}`
  );
};

// Create a function to send a message
export const sendMessage = async (
  roomId: number | string,
  content: string
): Promise<{
  success: boolean;
  message: Message;
}> => {
  return await fetchAPI<{
    success: boolean;
    message: Message;
  }>(`/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
};

// Create a function to mark a message as read
export const markMessagesAsRead = async (
  roomId: number | string
): Promise<{
  success: boolean;
  message: string;
}> => {
  return await fetchAPI<{ success: boolean; message: string }>(
    `/chat/rooms/${roomId}/read`,
    {
      method: 'PUT',
    }
  );
};
