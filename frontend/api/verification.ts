export async function requestEmailVerification(userId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/verification/request`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    }
  );

  if (!res.ok) throw new Error('Failed to request email verification');
  return res.json();
}

export async function verifyEmail(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/verification/verify?token=${token}`
  );
  if (!res.ok) throw new Error('Failed to verify email');
  return res.json();
}
