import { Mentor } from '@/types/matching';

export async function fetchMentors(): Promise<Mentor[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users?role=mentor`
  );
  if (!res.ok) throw new Error('Failed to fetch mentors');
  return res.json();
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
