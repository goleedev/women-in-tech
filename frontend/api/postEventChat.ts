export async function sendPostEventMessage(
  eventId: number,
  senderId: number,
  message: string
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/post-event-chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, sender_id: senderId, message }),
    }
  );

  if (!res.ok) throw new Error('Failed to send post-event chat message');
  return res.json();
}

export async function getPostEventChat(eventId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/post-event-chat/${eventId}`
  );
  if (!res.ok) throw new Error('Failed to fetch post-event chat messages');
  return res.json();
}
