// app/lib/api/tag.ts
'use client';

import { fetchAPI } from './client';
import { Tag } from './types';

export const getAllTags = async (
  category?: string
): Promise<{ tags: Tag[] }> => {
  const queryParams = new URLSearchParams();

  if (category) {
    queryParams.append('category', category);
  }

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : '';
  return await fetchAPI<{ tags: Tag[] }>(`/tags${queryString}`);
};
