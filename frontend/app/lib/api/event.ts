// app/lib/api/event.ts
'use client';

import { fetchAPI } from './client';
import { Event, Pagination } from './types';

export interface EventParams {
  location?: string;
  date?: string;
  topic?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EventsResponse {
  events: Event[];
  pagination: Pagination;
}

export interface EventData {
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
}

export interface EventResponse {
  success: boolean;
  message: string;
  event?: {
    id: number;
    title: string;
    date: string;
  };
}

export const getEvents = async (
  params?: EventParams
): Promise<EventsResponse> => {
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
  return await fetchAPI<EventsResponse>(`/events${queryString}`);
};

export const getEventById = async (
  eventId: number | string
): Promise<Event> => {
  return await fetchAPI<Event>(`/events/${eventId}`);
};

export const createEvent = async (
  eventData: EventData
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

export const updateEvent = async (
  eventId: number | string,
  eventData: Partial<EventData> & { status?: string }
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>(`/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
};

export const attendEvent = async (
  eventId: number | string
): Promise<{
  success: boolean;
  message: string;
  status: string;
}> => {
  return await fetchAPI<{
    success: boolean;
    message: string;
    status: string;
  }>(`/events/${eventId}/attend`, {
    method: 'POST',
  });
};

export const cancelEventAttendance = async (
  eventId: number | string
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>(`/events/${eventId}/attend`, {
    method: 'DELETE',
  });
};

export const likeEvent = async (
  eventId: number | string
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>(`/events/${eventId}/like`, {
    method: 'POST',
  });
};

export const unlikeEvent = async (
  eventId: number | string
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>(`/events/${eventId}/like`, {
    method: 'DELETE',
  });
};

export const getLikedEvents = async (params?: {
  page?: number;
  limit?: number;
}): Promise<EventsResponse> => {
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
  return await fetchAPI<EventsResponse>(`/events/liked${queryString}`);
};
