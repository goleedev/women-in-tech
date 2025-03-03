export async function addFavorite(
  userId: number,
  targetId: number,
  targetType: 'mentor' | 'event'
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
    }),
  });

  if (!res.ok) throw new Error('Failed to add favorite');
  return res.json();
}
