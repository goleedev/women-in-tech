export async function registerForEvent(userId: number, eventId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/event-attendance`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, event_id: eventId }),
    }
  );

  if (!res.ok) throw new Error('Failed to register for event');
  return res.json();
}

export async function getEventAttendees(eventId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/event-attendance/${eventId}`
  );
  if (!res.ok) throw new Error('Failed to fetch event attendees');
  return res.json();
}
