'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mentor } from '@/types/mentor';

export default function FindMentorPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/matching/find?preferred_tech_stack=React&preferred_experience=3`
    )
      .then((res) => res.json())
      .then((data) => setMentors(data))
      .catch((error) => console.error('❌ Error fetching mentors:', error));
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold">Matching Mentors</h1>
      {mentors.length === 0 ? (
        <p>No mentors found.</p>
      ) : (
        <ul className="mt-4">
          {mentors.map((mentor) => (
            <li key={mentor.id} className="p-2 border rounded mt-2">
              <p>
                <strong>{mentor.name}</strong>
              </p>
              <p>{mentor.job_title}</p>
              <p>{mentor.country}</p>
              <p>
                <strong>Expertise:</strong> {mentor.expertise.join(', ')}
              </p>
              <p>
                <strong>Experience:</strong> {mentor.years_of_experience} years
              </p>
              <p>
                <strong>Available:</strong>{' '}
                {mentor.is_available ? '✅ Yes' : '❌ No'}
              </p>
              <Button className="mt-2" disabled={!mentor.is_available}>
                Request Mentorship
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
