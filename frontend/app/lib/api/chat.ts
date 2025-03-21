// app/lib/api/chat.ts
'use client';

import { fetchAPI } from './client';
import { ChatRoom, Message } from './types';

export const getChatRooms = async (): Promise<{ chat_rooms: ChatRoom[] }> => {
  return await fetchAPI<{ chat_rooms: ChatRoom[] }>('/chat/rooms');
};

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

export const getChatMessages = async (
  roomId: number | string,
  params?: { before?: number; limit?: number }
): Promise<{ messages: Message[]; has_more: boolean }> => {
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
};

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
