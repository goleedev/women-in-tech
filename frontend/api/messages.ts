export async function sendMessage(
  senderId: number,
  receiverId: number,
  content: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
    }),
  });

  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function getMessages(userId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${userId}`
  );
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}
