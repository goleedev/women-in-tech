'use client';

import { fetchAPI } from './client';
import { Event, Pagination } from './types';

// Define the types for event parameters
export interface EventParams {
  location?: string;
  date?: string;
  topic?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Define the types for event data
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

// Define the types for events response
export interface EventsResponse {
  events: Event[];
  pagination: Pagination;
}

// Define the types for event response
export interface EventResponse {
  success: boolean;
  message: string;
  event?: {
    id: number;
    title: string;
    date: string;
  };
}

// Create a function to fetch events
export const getEvents = async (
  params?: EventParams
): Promise<EventsResponse> => {
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

  return await fetchAPI<EventsResponse>(`/events${queryString}`);
};

// Create a function to fetch event by ID
export const getEventById = async (
  eventId: number | string
): Promise<Event> => {
  return await fetchAPI<Event>(`/events/${eventId}`);
};

// Create a function to fetch events by user ID
export const createEvent = async (
  eventData: EventData
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

// Create a function to update event
export const updateEvent = async (
  eventId: number | string,
  eventData: Partial<EventData> & { status?: string }
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>(`/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
};

// Create a function to attend event
export const attendEvent = async (
  eventId: number | string
): Promise<{
  success: boolean;
  message: string;
  status?: string;
}> => {
  try {
    // Fetch the event attendance
    const response = await fetchAPI<{
      success: boolean;
      message: string;
      status?: string;
    }>(`/events/${eventId}/attend`, {
      method: 'POST',
    });

    return response;
  } catch (error) {
    // Handle the error
    console.error('⚠️ Failed to attend event:', error);

    throw error;
  }
};

// Create a function to cancel event attendance
export const cancelEventAttendance = async (
  eventId: number | string
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>(`/events/${eventId}/attend`, {
    method: 'DELETE',
  });
};

// Create a function to like event
export const likeEvent = async (
  eventId: number | string
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>(`/events/${eventId}/like`, {
    method: 'POST',
  });
};

// Create a function to unlike event
export const unlikeEvent = async (
  eventId: number | string
): Promise<EventResponse> => {
  return await fetchAPI<EventResponse>(`/events/${eventId}/like`, {
    method: 'DELETE',
  });
};

// Create a function to fetch liked events
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
