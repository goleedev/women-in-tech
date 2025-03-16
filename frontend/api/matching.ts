import {
  Mentor,
  MentorshipRequest,
  MentorshipRequestDraft,
} from '@/types/matching';

/**
 * 🔹 현재 로그인한 유저의 멘토십 요청 목록 가져오기
 */
export async function fetchUserRequests(
  userId: number
): Promise<MentorshipRequest[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/matching/${userId}`
  );

  if (!res.ok) throw new Error('Failed to fetch mentorship requests');

  const data: MentorshipRequest[] = await res.json();
  return data; // ✅ 배열로 보장
}

/**
 * 🔹 멘토 리스트 가져오기 (job_title = 'mentor'인 유저만 반환)
 */
export async function fetchMentors(loggedInUserId: number): Promise<Mentor[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
  if (!res.ok) throw new Error('Failed to fetch mentors');

  const users = await res.json();

  // ✅ `job_title`이 존재하는 유저만 멘토로 간주하고, 현재 로그인한 유저 제외
  return users.filter(
    (user: Mentor) => user.job_title && user.id !== loggedInUserId
  );
}

/**
 * 🔹 멘토십 요청 보내기 (멘티 -> 멘토)
 */
export async function requestMentorship(
  menteeId: number,
  mentorId: number
): Promise<MentorshipRequest> {
  const requestData: MentorshipRequestDraft = {
    mentee_id: menteeId,
    mentor_id: mentorId,
    status: 'pending', // ✅ 기본 값 설정
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/matching`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  });

  if (!res.ok) throw new Error('Failed to request mentorship');

  // ✅ 응답을 `MentorshipRequest` 타입으로 변환
  const responseData: MentorshipRequest = await res.json();
  return responseData;
}

/**
 * 🔹 특정 유저의 매칭 상태 가져오기
 */
export async function getMatchingStatus(
  menteeId: number
): Promise<MentorshipRequest | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/matching/${menteeId}`
  );

  if (res.status === 404) return null; // ✅ 요청이 없으면 `null` 반환
  if (!res.ok) throw new Error('Failed to fetch matching status');

  return res.json();
}

/**
 * 🔹 멘토십 요청 취소
 */
export async function cancelMentorshipRequest(
  requestId: number
): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/matching/${requestId}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) throw new Error('Failed to cancel mentorship request');
}
