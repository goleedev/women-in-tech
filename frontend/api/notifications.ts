export async function getNotifications(userId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${userId}`
  );
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationAsRead(notificationId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true }),
    }
  );

  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}
