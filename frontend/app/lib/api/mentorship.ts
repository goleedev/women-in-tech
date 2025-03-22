'use client';

import { fetchAPI } from './client';
import { MentorshipConnection, Pagination, User } from './types';

export interface MentorshipParams {
  role?: 'mentor' | 'mentee';
  expertise?: string;
  seniority_level?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
  mode?: string; // 활성 역할 모드 추가
}

export interface MentorshipUserWithMetadata extends User {
  tags: string[];
  similarity_score?: number;
  is_connected?: boolean;
}

export interface UsersResponse {
  users: MentorshipUserWithMetadata[];
  pagination: Pagination;
}

export interface ConnectionsResponse {
  connections: MentorshipConnection[];
  pagination: Pagination;
}

export const getUsers = async (
  params?: MentorshipParams
): Promise<UsersResponse> => {
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

  try {
    console.log('API 요청 URL:', `/mentorship/users${queryString}`); // 디버깅용 로그 추가
    return await fetchAPI<UsersResponse>(`/mentorship/users${queryString}`);
  } catch (error) {
    console.error('멘토십 사용자 조회 API 오류:', error);
    throw error; // 에러 다시 던지기
  }
};

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

export const getConnectionRequests = async (params?: {
  status?: 'pending' | 'accepted' | 'rejected';
  page?: number;
  limit?: number;
}): Promise<ConnectionsResponse> => {
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
  return await fetchAPI<ConnectionsResponse>(
    `/mentorship/connect/requests${queryString}`
  );
};

export const getMyConnections = async (params?: {
  page?: number;
  limit?: number;
}): Promise<ConnectionsResponse> => {
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
  return await fetchAPI<ConnectionsResponse>(
    `/mentorship/connect${queryString}`
  );
};

export const getRecommendedMentors = async (): Promise<{
  recommended_mentors: Array<User & { similarity_score: number }>;
}> => {
  return await fetchAPI<{
    recommended_mentors: Array<User & { similarity_score: number }>;
  }>('/mentorship/recommended');
};
