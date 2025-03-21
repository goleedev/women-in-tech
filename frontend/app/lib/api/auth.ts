// app/lib/api/auth.ts
'use client';

import { fetchAPI } from './client';
import { User } from './types';

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  expertise?: string;
  profession?: string;
  seniority_level?: string;
  country?: string;
  role: 'mentor' | 'mentee';
  bio?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface LoginResponse extends AuthResponse {
  token: string;
}

// 인증 관련 API 함수들
export const register = async (
  userData: RegisterData
): Promise<AuthResponse> => {
  return await fetchAPI<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const data = await fetchAPI<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // 토큰과 사용자 정보 저장
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

export const logout = async (): Promise<{
  success: boolean;
  message: string;
}> => {
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
};

export const getMe = async (): Promise<User> => {
  return await fetchAPI<User>('/auth/me');
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('user');
  return userStr ? (JSON.parse(userStr) as User) : null;
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};
