// src/app/services/api.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

// 이벤트 목록 가져오기
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
      },
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

// 이벤트 상세 정보 가져오기 (누락된 함수 추가)
export const getEventById = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API Error:', await response.text());
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    throw error;
  }
};

// 이벤트 좋아요 상태 토글
export const toggleEventLike = async (
  eventId: string,
  isLiked: boolean,
  token: string
) => {
  try {
    const method = isLiked ? 'DELETE' : 'POST';
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/like`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('API Error:', await response.text());
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error toggling like for event ID ${eventId}:`, error);
    throw error;
  }
};

// 이벤트 참가 신청/취소
export const toggleEventAttendance = async (
  eventId: string,
  isAttending: boolean,
  token: string
) => {
  try {
    const method = isAttending ? 'DELETE' : 'POST';
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/attend`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('API Error:', await response.text());
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error toggling attendance for event ID ${eventId}:`, error);
    throw error;
  }
};
