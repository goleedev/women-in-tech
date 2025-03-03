export async function reportUser(
  reporterId: number,
  reportedUserId: number,
  reason: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
    }),
  });

  if (!res.ok) throw new Error('Failed to report user');
  return res.json();
}

export async function reportEvent(
  reporterId: number,
  eventId: number,
  reason: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reporter_id: reporterId,
      event_id: eventId,
      reason,
    }),
  });

  if (!res.ok) throw new Error('Failed to report event');
  return res.json();
}
