import { Mentor } from '@/types/matching';

export async function fetchMentors(): Promise<Mentor[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
  if (!res.ok) throw new Error('Failed to fetch mentors');

  const users = await res.json();

  // ✅ `job_title`이 존재하는 유저만 멘토로 간주
  return users.filter((user: Mentor) => user.job_title);
}

export async function requestMentorship(menteeId: number, mentorId: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/matching`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mentee_id: menteeId, mentor_id: mentorId }),
  });

  if (!res.ok) throw new Error('Failed to request mentorship');
  return res.json();
}

export async function cancelMentorshipRequest(requestId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/matching/${requestId}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) throw new Error('Failed to cancel request');
  return res.json();
}
