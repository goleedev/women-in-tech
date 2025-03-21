// app/lib/api/user.ts
'use client';

import { fetchAPI } from './client';
import { User } from './types';

export interface ProfileUpdateData {
  name?: string;
  expertise?: string;
  profession?: string;
  seniority_level?: string;
  country?: string;
  bio?: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface TagsResponse {
  success: boolean;
  message: string;
  tags: string[];
}

export const getUserProfile = async (
  userId: number | string
): Promise<User & { tags: string[] }> => {
  return await fetchAPI<User & { tags: string[] }>(`/users/${userId}`);
};

export const updateUserProfile = async (
  userId: number | string,
  profileData: ProfileUpdateData
): Promise<UserResponse> => {
  return await fetchAPI<UserResponse>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

export const updateUserTags = async (
  userId: number | string,
  tags: string[]
): Promise<TagsResponse> => {
  return await fetchAPI<TagsResponse>(`/users/${userId}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ tags }),
  });
};

export const uploadProfileImage = async (
  userId: number | string,
  imageFile: File
): Promise<{
  success: boolean;
  message: string;
  profile_image_url: string;
}> => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const token = localStorage.getItem('token');
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/profile-image`,
    {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: '프로필 이미지 업로드 실패' }));
    throw new Error(error.message || '프로필 이미지 업로드 실패');
  }

  return await response.json();
};
