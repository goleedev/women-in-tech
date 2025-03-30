'use client';

import { fetchAPI } from './client';
import { User } from './types';

// Define the types for the profile update data
export interface ProfileUpdateData {
  name?: string;
  expertise?: string;
  profession?: string;
  seniority_level?: string;
  country?: string;
  bio?: string;
}

// Define the types for the user response from the API
export interface UserResponse {
  success: boolean;
  message: string;
  user: User;
}

// Define the types for the tags response from the API
export interface TagsResponse {
  success: boolean;
  message: string;
  tags: string[];
}

// Create a function to fetch user profile
export const getUserProfile = async (
  userId: number | string
): Promise<User & { tags: string[] }> => {
  return await fetchAPI<User & { tags: string[] }>(`/users/${userId}`);
};

// Create a function to update user profile
export const updateUserProfile = async (
  userId: number | string,
  profileData: ProfileUpdateData
): Promise<UserResponse> => {
  return await fetchAPI<UserResponse>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// Create a function to update user tags
export const updateUserTags = async (
  userId: number | string,
  tags: string[]
): Promise<TagsResponse> => {
  return await fetchAPI<TagsResponse>(`/users/${userId}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ tags }),
  });
};
