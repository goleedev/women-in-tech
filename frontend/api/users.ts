export async function getUsers() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getUser(userId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`
  );
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function addUser(name: string, email: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: '123456' }),
  });

  if (!res.ok) throw new Error('Failed to add user');
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateUser(userId: number, data: any) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function deleteUser(userId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
    {
      method: 'DELETE',
    }
  );

  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
}
