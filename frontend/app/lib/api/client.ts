// app/lib/api/client.ts
'use client';

// API 기본 URL 설정
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

// 인증과 에러 처리를 포함한 기본 fetch 함수
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // 클라이언트 측에서만 localStorage 접근
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'API 요청 실패' }));
    throw new Error(error.message || 'API 요청 실패');
  }

  return await response.json();
}
