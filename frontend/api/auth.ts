export async function registerUser({
  name,
  email,
  password,
  country,
  city,
  job_title,
  tech_stack = [],
  years_of_experience = 0,
  mentoring_topics = [],
  available_times = [],
  calcom_link = '',
}: {
  name: string;
  email: string;
  password: string;
  country: string;
  city: string;
  job_title: string;
  tech_stack?: string[];
  years_of_experience?: number;
  mentoring_topics?: string[];
  available_times?: string[];
  calcom_link?: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      password_hash: password,
      country,
      city,
      job_title,
      tech_stack,
      years_of_experience,
      mentoring_topics,
      available_times,
      calcom_link,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to register');
  }

  return res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to login');
  }

  return res.json();
}
