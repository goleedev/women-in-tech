export async function requestMentorship(menteeId: number, mentorId: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/matching`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mentee_id: menteeId,
      mentor_id: mentorId,
    }),
  });

  if (!res.ok) throw new Error('Failed to request mentorship');
  return res.json();
}

export async function getMatchingStatus(menteeId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/matching/${menteeId}`
  );
  if (!res.ok) throw new Error('Failed to fetch matching status');
  return res.json();
}

export async function cancelMentorshipRequest(requestId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/matching/${requestId}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) throw new Error('Failed to cancel mentorship request');
  return res.json();
}
