// Update your API service if needed
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5432/api/v1';

export const fetchEvents = async (params = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, String(value));
  });

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : '';

  try {
    const response = await fetch(`${API_BASE_URL}/events${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include auth token if needed
        // 'Authorization': `Bearer ${token}`,
      },
      // Include credentials if using cookies
      // credentials: 'include',
    });

    if (!response.ok) {
      console.error('API Error:', await response.text());
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};
