'use client';

import { useEffect, useState } from 'react';
import { fetchMentors } from '@/api/matching';
import { Mentor } from '@/types/matching';
import MentorCard from './components/MentorCard';
import MentorFilters from './components/MentorFilters';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [search, setSearch] = useState('');
  const [techStack, setTechStack] = useState('');

  useEffect(() => {
    const loadMentors = async () => {
      try {
        const data = await fetchMentors();
        setMentors(data);
      } catch (error) {
        console.error('Failed to fetch mentors:', error);
      }
    };
    loadMentors();
  }, []);

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(search.toLowerCase()) &&
      (techStack === 'all' || mentor.tech_stack.includes(techStack))
  );

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Find a Mentor</h1>
      <MentorFilters
        search={search}
        setSearch={setSearch}
        techStack={techStack}
        setTechStack={setTechStack}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMentors.length > 0 ? (
          filteredMentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} menteeId={1} />
          ))
        ) : (
          <p className="text-center text-gray-500">No mentors found</p>
        )}
      </div>
    </div>
  );
}
