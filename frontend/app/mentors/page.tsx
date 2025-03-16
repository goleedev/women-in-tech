'use client';

import { fetchMentors } from '@/api/matching';
import { useState, useEffect } from 'react';
import MentorFilters from './components/MentorFilters';
import { Mentor } from '@/types/matching';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [techStack, setTechStack] = useState<string>('all');

  useEffect(() => {
    async function loadMentors() {
      setLoading(true);
      try {
        const data = await fetchMentors();
        setMentors(data);
      } catch (error) {
        console.error('Failed to fetch mentors:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMentors();
  }, []);

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(search.toLowerCase()) &&
      (techStack === 'all' || mentor.tech_stack.includes(techStack))
  );

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold">Find a Mentor</h1>

      <MentorFilters
        search={search}
        setSearch={setSearch}
        techStack={techStack}
        setTechStack={setTechStack}
      />

      {loading ? (
        <p>Loading mentors...</p>
      ) : filteredMentors.length > 0 ? (
        <ul>
          {filteredMentors.map((mentor) => (
            <li key={mentor.id} className="mt-4">
              <h2 className="font-bold">{mentor.name}</h2>
              <p>{mentor.job_title}</p>
              <p>{mentor.country}</p>
              <button className="border px-4 py-2 mt-2">
                Request Mentorship
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No mentors found</p>
      )}
    </div>
  );
}
