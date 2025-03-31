'use client';

import { fetchAPI } from './client';
import { User } from './types';

type UserRole = 'mentor' | 'mentee';

// Define the types for register data
export interface RegisterData {
  email: string;
  name: string;
  password: string;
  expertise?: string;
  profession?: string;
  seniority_level?: string;
  country?: string;
  role: UserRole;
  secondary_role: UserRole | '';
  bio?: string;
}

// Define the types for login credentails data
export interface LoginCredentials {
  email: string;
  password: string;
}

// Define the types for the auth response from the API
export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
}

// Define the types for the login response from the API
export interface LoginResponse extends AuthResponse {
  token: string;
}

// Create register function
export const register = async (
  userData: RegisterData
): Promise<AuthResponse> => {
  return await fetchAPI<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// Create login function
export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const data = await fetchAPI<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Store the token in local storage
  localStorage.setItem('token', data.token);

  // Get the full user profile after login
  const fullUserProfile = await getMe();

  // Store the complete user information in local storage
  localStorage.setItem('user', JSON.stringify(fullUserProfile));

  // Return the login response with the complete user profile
  return {
    ...data,
    user: fullUserProfile,
  };
};

// Create logout function
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

  // Remove the token and user information from local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  return result;
};

// Create a function to get the current user from api
export const getMe = async (): Promise<User> => {
  return await fetchAPI<User>('/auth/me');
};

// Create a function to get the current user from local storage
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  // Check if local storage for user is available
  const userStr = localStorage.getItem('user');

  return userStr ? (JSON.parse(userStr) as User) : null;
};

// Create a function to check if the user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;

  return !!localStorage.getItem('token');
};
