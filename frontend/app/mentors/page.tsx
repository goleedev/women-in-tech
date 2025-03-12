'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mentor } from '@/types/mentor';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    // ✅ Fetch mentors from API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => setMentors(data))
      .catch((error) => console.error('❌ Error fetching mentors:', error));
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold">Find a Mentor</h1>
      {mentors.length === 0 ? (
        <p>Loading mentors...</p>
      ) : (
        <ul className="mt-4">
          {mentors.map((mentor) => (
            <li key={mentor.id} className="p-2 border rounded mt-2">
              <p>
                <strong>{mentor.name}</strong>
              </p>
              <p>{mentor.job_title}</p>
              <p>{mentor.country}</p>
              <Button className="mt-2">Request Mentorship</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
