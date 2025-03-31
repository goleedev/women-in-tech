'use client';

// Define the base URL for the API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://women-in-tech-backend.onrender.com/api/v1';

// create a function to fetch data from the API
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get the token from local storage
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Set the headers for the request
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // If the token exists, add it to the headers
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    // Get response from the API
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Set 401 status to unauthorized
    if (response.status === 401) {
      // Remove the token and user information from local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeRole');

      // Redirect to the login page with an expired token message
      window.location.href = '/login?expired=true';
      throw new Error('⚠️ Token expired');
    }

    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      // Get the error message from the response
      const errorText = await response.text();

      let errorData;

      try {
        // Parse the error response as JSON
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('⚠️ Failed to parse error:', e);
        errorData = {
          message:
            errorText ||
            `⚠️ Failed to fetch error: ${response.status} ${response.statusText}`,
        };
      }

      console.error('⚠️ Failed to get error:', errorData);
      throw new Error(errorData.message || '⚠️ Failed to get error');
    }

    // Parse the response as JSON
    const data = await response.json();

    return data;
  } catch (error) {
    // Handle errors
    if (!(error instanceof Error)) {
      console.error('⚠️ Failed to get error:', error);
      throw new Error('⚠️ Failed to get error');
    }

    throw error;
  }
}
