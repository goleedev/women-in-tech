export async function login(email: string, password: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Failed to login");
  return res.json();
}

export async function logout() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to logout");
  return res.json();
}