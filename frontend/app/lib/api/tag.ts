'use client';

import { fetchAPI } from './client';
import { Tag } from './types';

// Create a function to fetch all tags
export const getAllTags = async (
  category?: string
): Promise<{ tags: Tag[] }> => {
  // Get the query parameters
  const queryParams = new URLSearchParams();

  // Append the parameters to the query string
  if (category) {
    queryParams.append('category', category);
  }

  // Construct the URL with query parameters
  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : '';

  // Fetch tags from the API
  return await fetchAPI<{ tags: Tag[] }>(`/tags${queryString}`);
};
