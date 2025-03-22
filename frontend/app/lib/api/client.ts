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

  try {
    console.log(`API 요청: ${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      // 디버깅용으로 body도 표시 (민감한 정보가 아닌 경우)
      body: options.body ? '(request body)' : undefined,
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text(); // 응답 텍스트 가져오기
      let errorData;

      try {
        // JSON 파싱 시도
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('API 에러 응답 JSON 파싱 실패:', e);
        // JSON 파싱 실패 시 텍스트 그대로 사용
        errorData = {
          message:
            errorText ||
            `API 요청 실패: ${response.status} ${response.statusText}`,
        };
      }

      console.error('API 에러 응답:', errorData);
      throw new Error(errorData.message || 'API 요청 실패');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // 에러가 Error 객체가 아닐 경우 처리
    if (!(error instanceof Error)) {
      console.error('API 요청 중 알 수 없는 에러:', error);
      throw new Error('API 요청 중 알 수 없는 에러가 발생했습니다');
    }

    // 기존 에러 다시 던지기
    throw error;
  }
}
