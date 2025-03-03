export async function getEvents() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function registerForEvent(eventId: number, userId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    }
  );

  if (!res.ok) throw new Error('Failed to register for event');
  return res.json();
}
