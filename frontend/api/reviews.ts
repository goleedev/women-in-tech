export async function addReview(
  mentorId: number,
  menteeId: number,
  rating: number,
  comment: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mentor_id: mentorId,
      mentee_id: menteeId,
      rating,
      comment,
    }),
  });

  if (!res.ok) throw new Error('Failed to add review');
  return res.json();
}

export async function getReviews(mentorId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${mentorId}`
  );
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}
