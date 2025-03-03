export async function sendConnectionRequest(
  fromUserId: number,
  toUserId: number
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/connections`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_user_id: fromUserId, to_user_id: toUserId }),
    }
  );

  if (!res.ok) throw new Error('Failed to send connection request');
  return res.json();
}

export async function getConnections(userId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/connections/${userId}`
  );
  if (!res.ok) throw new Error('Failed to fetch connections');
  return res.json();
}

export async function removeConnection(connectionId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/connections/${connectionId}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) throw new Error('Failed to remove connection');
  return res.json();
}
