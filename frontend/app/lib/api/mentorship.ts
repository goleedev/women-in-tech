'use client';

import { fetchAPI } from './client';
import { MentorshipConnection, Pagination, User } from './types';

// Define the types for mentorship parameters
export interface MentorshipParams {
  role?: 'mentor' | 'mentee';
  expertise?: string;
  seniority_level?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
  mode?: string;
}

// Define the types for mentorship user data
export interface MentorshipUserWithMetadata extends User {
  tags: string[];
  similarity_score?: number;
  is_connected?: boolean;
  connection_status?: 'pending' | 'accepted' | 'rejected';
}

// Define the types for mentorship user data
export interface UsersResponse {
  users: MentorshipUserWithMetadata[];
  pagination: Pagination;
}

// Define the types for mentorship connection data
export interface ConnectionsResponse {
  connections: MentorshipConnection[];
  pagination: Pagination;
}

// Create a function to fetch mentorship users
export const getUsers = async (
  params?: MentorshipParams
): Promise<UsersResponse> => {
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

  try {
    return await fetchAPI<UsersResponse>(`/mentorship/users${queryString}`);
  } catch (error) {
    // Handle the error
    console.error('⚠️ Error fetching mentorship users:', error);

    throw error;
  }
};

// Create a function to connect with a mentor
export const connectRequest = async (
  mentorId: number | string,
  message: string
): Promise<{
  success: boolean;
  message: string;
  connection: { id: number; status: string };
}> => {
  return await fetchAPI<{
    success: boolean;
    message: string;
    connection: { id: number; status: string };
  }>('/mentorship/connect', {
    method: 'POST',
    body: JSON.stringify({ mentor_id: mentorId, message }),
  });
};

// Create a function to update the connection status
export const updateConnectionStatus = async (
  connectionId: number | string,
  status: 'accepted' | 'rejected'
): Promise<{ success: boolean; message: string }> => {
  return await fetchAPI<{ success: boolean; message: string }>(
    `/mentorship/connect/${connectionId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }
  );
};

// Create a function to get connection requests
export const getConnectionRequests = async (params?: {
  status?: 'pending' | 'accepted' | 'rejected';
  page?: number;
  limit?: number;
}): Promise<ConnectionsResponse> => {
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

  // Fetch connection requests
  return await fetchAPI<ConnectionsResponse>(
    `/mentorship/connect/requests${queryString}`
  );
};

// Create a function to get my connections
export const getMyConnections = async (params?: {
  page?: number;
  limit?: number;
}): Promise<ConnectionsResponse> => {
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

  // Fetch my connections
  return await fetchAPI<ConnectionsResponse>(
    `/mentorship/connect${queryString}`
  );
};

// Create a function to get recommended mentors
export const getRecommendedMentors = async (): Promise<{
  recommended_mentors: Array<User & { similarity_score: number }>;
}> => {
  return await fetchAPI<{
    recommended_mentors: Array<User & { similarity_score: number }>;
  }>('/mentorship/recommended');
};
