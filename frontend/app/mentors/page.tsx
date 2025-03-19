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

  const { user } = useAuth();

  useEffect(() => {
    async function loadMentors() {
      setLoading(true);
      try {
        if (!user) return; // If user is not logged in, don't fetch
        const data = await fetchMentors(user.id);
        setMentors(data);
      } catch (error) {
        console.error('Failed to fetch mentors:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMentors();
  }, [user]);

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.name.toLowerCase().includes(search.toLowerCase()) &&
      (techStack === 'all' || mentor.tech_stack.includes(techStack))
  );

  const handleRequestMentorship = async (mentorId: number) => {
    try {
      if (!user?.id) {
        console.error('User is not logged in');
        return;
      }

      console.log(
        `Requesting mentorship: Mentee(${user.id}) → Mentor(${mentorId})`
      );

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

      {/* 🔹 로그인 안 한 경우 */}
      {!user ? (
        <p className="mt-4">
          You must be{' '}
          <Link href="/login" className="text-blue-500 underline">
            logged in
          </Link>{' '}
          to request a mentor.
        </p>
      ) : (
        <>
          {/* 🔹 검색 & 필터 */}
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
                </li>
              ))}
            </ul>
          ) : (
            <p>No mentors found</p>
          )}
        </>
      )}
    </div>
  );
}
