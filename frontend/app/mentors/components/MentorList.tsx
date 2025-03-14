'use client';

import { useEffect, useState } from 'react';
import { fetchMentors } from '@/api/matching';
import { Mentor } from '@/types/matching';
import MentorCard from './MentorCard';

export default function MentorList() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMentors() {
      try {
        const data = await fetchMentors();
        setMentors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load mentors');
      } finally {
        setLoading(false);
      }
    }
    loadMentors();
  }, []);

  if (loading) return <p>Loading mentors...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="grid grid-cols-1 gap-4">
      {mentors.map((mentor) => (
        <MentorCard key={mentor.id} mentor={mentor} />
      ))}
    </div>
  );
}
