'use client';

import { useState, useEffect } from 'react';
import { fetchMentors, requestMentorship } from '@/api/matching';
import MentorFilters from './components/MentorFilters';
import { Mentor, MentorshipRequest } from '@/types/matching';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [techStack, setTechStack] = useState<string>('all');

  const { user } = useAuth(); // ✅ 로그인 정보 가져오기

  useEffect(() => {
    async function loadMentors() {
      setLoading(true);
      try {
        if (!user) return;

        console.log('user:', user);

        const data = await fetchMentors(user.id);
        setMentors(data);
      } catch (error) {
        console.error('Failed to fetch mentors:', error);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      loadMentors();
    } else {
      setLoading(false); // 로그인 안 된 경우에도 로딩 false로 변경
    }
  }, [user]);

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(search.toLowerCase()) &&
      (techStack === 'all' || mentor.tech_stack.includes(techStack))
  );

  const handleRequestMentorship = async (mentorId: number) => {
    if (!user) return; // ✅ 로그인되지 않았으면 요청 불가능

    try {
      const newRequest = await requestMentorship(user.id, mentorId);
      setRequests((prev) => [...prev, newRequest]);
    } catch (error) {
      console.error('Failed to request mentorship:', error);
    }
  };

  const isRequestSent = (mentorId: number) =>
    requests.some((req) => req.mentor_id === mentorId);

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold">Find a Mentor</h1>

      {!user && (
        <p className="text-red-500 mb-4">
          You must be logged in to request mentorship.{' '}
          <Link href="/login" className="underline text-blue-600">
            Login here
          </Link>
        </p>
      )}

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
              {user ? (
                <button
                  className={`border px-4 py-2 mt-2 ${
                    isRequestSent(mentor.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={() => handleRequestMentorship(mentor.id)}
                  disabled={isRequestSent(mentor.id)}
                >
                  {isRequestSent(mentor.id)
                    ? 'Request Sent'
                    : 'Request Mentorship'}
                </button>
              ) : (
                <p className="text-gray-500">Login to request mentorship</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No mentors found</p>
      )}
    </div>
  );
}
